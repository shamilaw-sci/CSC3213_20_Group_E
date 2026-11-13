import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SellerDashboard from './SellerDashboard';
const mocks = vi.hoisted(() => ({ get: vi.fn(), user: { id: 'seller', role: 'SELLER', name: 'Seller' } }));
vi.mock('../context/api', () => ({ default: { get: mocks.get } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
const Location = () => <output aria-label="Current route">{useLocation().pathname}</output>;
const show = () => render(<MemoryRouter><SellerDashboard /><Location /></MemoryRouter>);
const respond = (properties = [], conversations = []) => mocks.get.mockImplementation(async path => ({ data: path === '/conversations' ? { conversations } : { properties } }));
const panel = title => screen.getByRole('heading', { name: title }).parentElement.parentElement.parentElement;
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

test('both snapshot panels retain loading spinners until parent requests settle', () => {
    mocks.get.mockImplementation(() => new Promise(() => {}));
    show();
    expect(panel('Recent Listings').querySelector('.animate-spin')).toBeTruthy();
    expect(panel('Active Buyer Chats').querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByText('No properties listed yet')).not.toBeInTheDocument();
    expect(mocks.get.mock.calls.map(([path]) => path)).toEqual(['/properties/my-listings/activity', '/properties/my-listings', '/conversations']);
});

test('empty snapshots and listing/inbox actions preserve destinations', async () => {
    respond(); show();
    await screen.findByText('No properties listed yet');
    expect(screen.getByText(/No active inquiries yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ List Your First Property' }));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/add-property');
    fireEvent.click(screen.getByRole('button', { name: 'View all (0)' }));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/my-properties');
    fireEvent.click(screen.getByRole('link', { name: 'Open Inbox' }));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/messages');
});

test('listing snapshot keeps first four server rows, badges independent of payment, fallbacks and property navigation', async () => {
    respond([
        { id: 'z', title: 'Server first', status: 'approved', payment_status: 'Unpaid', price: 2000000, images: ['first.jpg'], city: 'Kandy', district: 'Central', listing_type: 'Rent', views_count: 9 },
        { id: 'a', title: 'Server second', status: 'pending', payment_status: 'Paid', price: 0 },
        { id: 'x', title: 'Server third', status: 'rejected', payment_status: 'paid', price: 500 },
        { id: 'b', title: 'Server fourth', status: 'draft', payment_status: 'Unpaid' },
        { id: 'hidden', title: 'Excluded fifth', status: 'approved', payment_status: 'Paid' },
    ]); show();
    await screen.findByText('Server first');
    const rows = within(panel('Recent Listings'));
    expect(rows.getAllByRole('heading', { level: 3 }).map(node => node.textContent.trim())).toEqual(['Server first', 'Server second', 'Server third', 'Server fourth']);
    expect(screen.queryByText('Excluded fifth')).not.toBeInTheDocument();
    expect(rows.getByText('Live')).toBeInTheDocument();
    expect(rows.getByText('Reviewing')).toBeInTheDocument();
    expect(rows.getByText('Needs Fix')).toBeInTheDocument();
    expect(rows.getByText('Rs. 2.0M')).toBeInTheDocument();
    expect(rows.getByText('Rent')).toBeInTheDocument();
    expect(rows.getAllByText('Sale')).toHaveLength(3);
    expect(rows.getByRole('img', { name: 'Server first' })).toHaveAttribute('src', 'first.jpg');
    expect(rows.getAllByRole('img')).toHaveLength(1);
    expect(rows.getAllByTitle('View Property')).toHaveLength(4);
    fireEvent.click(rows.getAllByTitle('View Property')[0]);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/property/z');
    fireEvent.click(rows.getByRole('button', { name: 'View all (5)' }));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/my-properties');
});

test('conversation snapshot keeps first three server rows and buyer/property fallbacks with row navigation', async () => {
    respond([], [
        { id: 'z', buyer: { name: 'Zelda' }, property: { title: 'First inquiry' } },
        { id: 'a' },
        { id: 'm', buyer: { name: 'Maya' }, property: { title: 'Third inquiry' } },
        { id: 'hidden', buyer: { name: 'Excluded buyer' } },
    ]); show();
    await screen.findByText('Zelda');
    const chats = panel('Active Buyer Chats');
    expect([...chats.querySelectorAll('.cursor-pointer')].map(node => node.textContent)).toEqual(['ZZeldaFirst inquiry', 'BProspective BuyerProperty Inquiry', 'MMayaThird inquiry']);
    expect(screen.queryByText('Excluded buyer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Prospective Buyer'));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/messages');
});
