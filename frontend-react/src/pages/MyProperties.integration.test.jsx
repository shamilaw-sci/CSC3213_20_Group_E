import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import MyProperties from './MyProperties';
import { UserAuthProvider, useAuth } from '../context/UserAuthContext';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
const payment = vi.hoisted(() => ({ triggerPayment: vi.fn(), paymentConfig: { status: 'ready', listingFee: '500.00', sandbox: true }, checkoutQuote: null, checkoutBusy: false, retryPaymentConfig: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('../hooks/usePayhere', () => ({ usePayhere: () => payment }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children, className }) => <div className={className}>{children}</div> } }));

const seller = { id: 'fixture-seller', name: 'Fixture seller', role: 'SELLER' };
const property = (id, status = 'pending', paymentStatus = 'Paid') => ({
  id, title: `Fixture ${id}`, seller_id: seller.id, status, payment_status: paymentStatus,
  price: 1000, city: 'Colombo', district: 'Colombo', images: [],
});
const fixtures = [
  property('unpaid-pending', 'pending', 'Unpaid'),
  property('unpaid-approved', 'approved', 'Unpaid'),
  property('paid-pending'),
  property('paid-approved', 'approved'),
  property('paid-rejected', 'rejected', 'paid'),
];

let auth;
function AuthProbe() { const value = useAuth(); React.useEffect(() => { auth = value; }, [value]); return null; }
function show() {
  return render(<MemoryRouter initialEntries={['/my-properties']}>
    <UserAuthProvider>
      <AuthProbe />
      <Toaster />
      <Routes><Route path="/my-properties" element={<MyProperties />} /></Routes>
    </UserAuthProvider>
  </MemoryRouter>);
}

const card = (id) => within(screen.getByRole('heading', { name: `Fixture ${id}` }).closest('.group'));
const listedTitles = () => screen.queryAllByRole('heading', { level: 3 }).map(node => node.textContent);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('matchMedia', vi.fn((media) => ({
    matches: false, media, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })));
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  api.get.mockImplementation(async (path) => {
    if (path === '/auth/me') return { data: { user: seller } };
    if (path === '/properties/my-listings') return { data: { properties: fixtures } };
    throw new Error(`Unexpected HTTP request: ${path}`);
  });
  api.delete.mockResolvedValue({ data: { message: 'Property deleted successfully' } });
  payment.triggerPayment.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  toast.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Actual MyProperties with auth provider and controlled HTTP', () => {
  test('loading does not prematurely display the empty state', async () => {
    let finish;
    api.get.mockImplementation((path) => path === '/auth/me'
      ? Promise.resolve({ data: { user: seller } })
      : new Promise(resolve => { finish = resolve; }));
    const { container } = show();
    await screen.findByRole('heading', { name: 'Manage My Listings' });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('No listings found')).not.toBeInTheDocument();
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    await act(async () => finish({ data: { properties: [] } }));
    expect(await screen.findByText('No listings found')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  test('an empty response offers the first-listing action', async () => {
    api.get.mockImplementation(async (path) => path === '/auth/me'
      ? { data: { user: seller } } : { data: { properties: [] } });
    show();
    expect(await screen.findByText('No listings found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Your First Property' })).toBeInTheDocument();
  });

  test('load failure displays feedback and does not invent listing cards', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockImplementation(async (path) => {
      if (path === '/auth/me') return { data: { user: seller } };
      throw new Error('Controlled load failure');
    });
    show();
    expect(await screen.findByText('Failed to load properties')).toBeInTheDocument();
    expect(screen.getByText('No listings found')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Fixture / })).not.toBeInTheDocument();
  });

  test('unpaid records are effective drafts while paid moderation states stay distinct', async () => {
    show();
    await screen.findByRole('heading', { name: 'Fixture paid-approved' });
    expect(listedTitles()).toEqual(fixtures.map(item => item.title));
    expect(card('unpaid-approved').getByText('Drafts (Unpaid)')).toBeInTheDocument();
    expect(card('unpaid-approved').getByText('Payment Required to Submit')).toBeInTheDocument();
    expect(card('paid-approved').queryByRole('button', { name: /Pay Rs/ })).not.toBeInTheDocument();
    for (const [tab, titles] of [
      ['Drafts (Unpaid)', ['Fixture unpaid-pending', 'Fixture unpaid-approved']],
      ['Pending Review', ['Fixture paid-pending']],
      ['Live & Approved', ['Fixture paid-approved']],
      ['Needs Changes', ['Fixture paid-rejected']],
      ['All Listings', fixtures.map(item => item.title)],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(tab.replace(/[()]/g, '\\$&')) }));
      expect(listedTitles()).toEqual(titles);
    }
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test('canceling deletion leaves both API and listing untouched', async () => {
    show();
    await screen.findByRole('heading', { name: 'Fixture paid-pending' });
    fireEvent.click(card('paid-pending').getByTitle('Delete Listing'));
    const dialog = screen.getByRole('dialog', { name: 'Remove listing?' });
    expect(dialog).toHaveAccessibleDescription(/Payment and conversation history will be retained/);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(window.confirm).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Fixture paid-pending' })).toBeInTheDocument();
  });

  test('successful deletion removes only the selected listing and updates the draft filter', async () => {
    show();
    await screen.findByRole('heading', { name: 'Fixture unpaid-pending' });
    fireEvent.click(card('unpaid-pending').getByTitle('Delete Listing'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove listing' }));
    expect(await screen.findByText('Listing removed successfully')).toBeInTheDocument();
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/properties/my-listings/unpaid-pending');
    expect(listedTitles()).toEqual(fixtures.filter(item => item.id !== 'unpaid-pending').map(item => item.title));
    fireEvent.click(screen.getByRole('button', { name: /Drafts \(Unpaid\)/ }));
    expect(listedTitles()).toEqual(['Fixture unpaid-approved']);
  });

  test('failed deletion retains the selected listing and shows server failure feedback', async () => {
    api.delete.mockRejectedValueOnce(new Error('Controlled delete failure'));
    show();
    await screen.findByRole('heading', { name: 'Fixture paid-approved' });
    fireEvent.click(card('paid-approved').getByTitle('Delete Listing'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove listing' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not remove this listing. Please try again.');
    expect(screen.getByRole('button', { name: 'Remove listing' })).toBeEnabled();
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/properties/my-listings/paid-approved');
    expect(screen.getByRole('heading', { name: 'Fixture paid-approved', hidden: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove listing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.delete).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('heading', { name: 'Fixture paid-approved' })).not.toBeInTheDocument();
  });
});

test('rejected owner listing displays its saved moderation reason', async () => {
  const reason = 'Seller E2E - please update description';
  api.get.mockImplementation(async path => path === '/auth/me'
    ? { data: { user: seller } }
    : { data: { properties: [{ ...property('rejected-reason', 'rejected'), rejection_reason: reason }] } });
  show();
  expect(await screen.findByText(reason)).toBeInTheDocument();
  expect(card('rejected-reason').getByText('Reason for rejection')).toBeInTheDocument();
});

test('paid rejected listing supports correction without invoking checkout', async () => {
  const rejected = { ...property('correct-me', 'rejected'), description: 'Original description', contact_number: '0771234567', rejection_reason: 'Please update description', house_size: 1500, land_size: 15, bedrooms: 3, bathrooms: 2, address: '123 Main Road' };
  api.get.mockImplementation(async path => path === '/auth/me' ? { data: { user: seller } } : { data: { properties: [rejected] } });
  api.patch = vi.fn().mockResolvedValue({ data: { property: { ...rejected, description: 'Corrected property description', status: 'pending', rejection_reason: null } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit & Resubmit' }));
  expect(screen.getByLabelText('Description')).toHaveValue('Original description');
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Corrected property description' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save & Resubmit' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
  expect(api.patch.mock.calls[0][0]).toBe('/properties/my-listings/correct-me');
  expect(api.patch.mock.calls[0][1]).toMatchObject({ description: 'Corrected property description' });
  expect(api.patch.mock.calls[0][1]).not.toHaveProperty('payment_status');
  expect(payment.triggerPayment).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.queryByText('Please update description')).not.toBeInTheDocument();
  expect(card('correct-me').getByText('Pending Review')).toBeInTheDocument();
});

test('correction cancel leaves saved listing and checkout untouched', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit & Resubmit' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Unsaved corrections' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(api.patch).not.toHaveBeenCalled();
  expect(payment.triggerPayment).not.toHaveBeenCalled();
  expect(card('paid-rejected').getByText('Needs Changes')).toBeInTheDocument();
});

test('failed correction preserves entered text and allows retry', async () => {
  const rejected = { ...property('retry-edit', 'rejected'), description: 'Original description', contact_number: '0771234567', bedrooms: 3, bathrooms: 2, house_size: 1500, land_size: 15 };
  api.get.mockImplementation(async path => path === '/auth/me' ? { data: { user: seller } } : { data: { properties: [rejected] } });
  api.patch = vi.fn().mockRejectedValueOnce({ response: { data: { message: 'Please retry your correction' } } }).mockResolvedValueOnce({ data: { property: { ...rejected, status: 'pending' } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit & Resubmit' }));
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Corrected property description' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save & Resubmit' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please retry your correction');
  expect(screen.getByLabelText('Description')).toHaveValue('Corrected property description');
  fireEvent.click(screen.getByRole('button', { name: 'Save & Resubmit' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(api.patch).toHaveBeenCalledTimes(2);
  expect(payment.triggerPayment).not.toHaveBeenCalled();
});

test('rental correction retains and can change the rental period', async () => {
  const rejected = { ...property('rental-edit', 'rejected'), type: 'Rent House', price_period: 'Year', description: 'Rental description', contact_number: '0771234567' };
  api.get.mockImplementation(async path => path === '/auth/me' ? { data: { user: seller } } : { data: { properties: [rejected] } });
  api.patch = vi.fn().mockResolvedValue({ data: { property: { ...rejected, status: 'pending', price_period: 'Month' } } });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit & Resubmit' }));
  expect(screen.getByLabelText('Rental period')).toHaveValue('Year');
  fireEvent.change(screen.getByLabelText('Rental period'), { target: { value: 'Month' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save & Resubmit' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/properties/my-listings/rental-edit', expect.objectContaining({ pricePeriod: 'Month' })));
});

 test('removal locks dismissal and duplicate submissions until the request finishes', async () => {
  let finish;
  api.delete.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  show();
  await screen.findByRole('heading', { name: 'Fixture paid-approved' });
  fireEvent.click(card('paid-approved').getByTitle('Delete Listing'));
  const remove = screen.getByRole('button', { name: 'Remove listing' });
  fireEvent.click(remove); fireEvent.click(remove);
  expect(screen.getByRole('button', { name: 'Removing...' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(api.delete).toHaveBeenCalledTimes(1);
  await act(async () => finish({ data: {} }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(payment.triggerPayment).not.toHaveBeenCalled();
});

test('account change closes removal and ignores a previous account request completion', async () => {
  let finish;
  api.delete.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  show();
  await screen.findByRole('heading', { name: 'Fixture paid-approved' });
  fireEvent.click(card('paid-approved').getByTitle('Delete Listing'));
  fireEvent.click(screen.getByRole('button', { name: 'Remove listing' }));
  api.get.mockResolvedValue({ data: { properties: [{ ...property('new-account'), seller_id: 'other-seller' }] } });
  act(() => auth.setUserData({ ...seller, id: 'other-seller' }));
  await screen.findByRole('heading', { name: 'Fixture new-account' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await act(async () => finish({ data: {} }));
  expect(screen.getByRole('heading', { name: 'Fixture new-account' })).toBeInTheDocument();
  expect(screen.queryByText('Listing removed successfully')).not.toBeInTheDocument();
});

test('a listing belonging to another account cannot open removal', async () => {
  api.get.mockImplementation(async path => path === '/auth/me' ? { data: { user: seller } }
    : { data: { properties: [{ ...property('foreign-owner'), seller_id: 'other-seller' }] } });
  show();
  await screen.findByRole('heading', { name: 'Fixture foreign-owner' });
  expect(card('foreign-owner').getByTitle('Delete Listing')).toBeDisabled();
  fireEvent.click(card('foreign-owner').getByTitle('Delete Listing'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(api.delete).not.toHaveBeenCalled();
});
