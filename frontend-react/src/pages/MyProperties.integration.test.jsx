import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import MyProperties from './MyProperties';
import { UserAuthProvider } from '../context/UserAuthContext';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
const payment = vi.hoisted(() => ({ triggerPayment: vi.fn() }));
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

function show() {
  return render(<MemoryRouter initialEntries={['/my-properties']}>
    <UserAuthProvider>
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
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this listing?');
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Fixture paid-pending' })).toBeInTheDocument();
  });

  test('successful deletion removes only the selected listing and updates the draft filter', async () => {
    window.confirm.mockReturnValue(true);
    show();
    await screen.findByRole('heading', { name: 'Fixture unpaid-pending' });
    fireEvent.click(card('unpaid-pending').getByTitle('Delete Listing'));
    expect(await screen.findByText('Listing deleted successfully')).toBeInTheDocument();
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/properties/my-listings/unpaid-pending');
    expect(listedTitles()).toEqual(fixtures.filter(item => item.id !== 'unpaid-pending').map(item => item.title));
    fireEvent.click(screen.getByRole('button', { name: /Drafts \(Unpaid\)/ }));
    expect(listedTitles()).toEqual(['Fixture unpaid-approved']);
  });

  test('failed deletion retains the selected listing and shows server failure feedback', async () => {
    window.confirm.mockReturnValue(true);
    api.delete.mockRejectedValueOnce(new Error('Controlled delete failure'));
    show();
    await screen.findByRole('heading', { name: 'Fixture paid-approved' });
    fireEvent.click(card('paid-approved').getByTitle('Delete Listing'));
    expect(await screen.findByText('Failed to delete property.')).toBeInTheDocument();
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/properties/my-listings/paid-approved');
    expect(listedTitles()).toEqual(fixtures.map(item => item.title));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Fixture paid-approved' })).toBeInTheDocument());
  });
});
