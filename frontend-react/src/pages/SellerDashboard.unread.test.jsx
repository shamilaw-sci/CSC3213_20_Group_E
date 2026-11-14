import React, { useEffect } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import SellerDashboard from './SellerDashboard';
const state = vi.hoisted(() => ({ count: 1, user: { id: 'seller', role: 'SELLER' } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(async path => ({ data: path === '/conversations' ? { conversations: [{ id: '1', buyer: { name: 'Saved buyer' } }, { id: '2' }] } : { properties: [] } })) } }));
vi.mock('../components/layout/Navbar', () => ({ default: function Navbar({ onUnreadCountChange }) {
 useEffect(() => { onUnreadCountChange?.({ userId: state.user.id, count: state.count }); });
 return null;
} }));
afterEach(cleanup);
test('badge follows shared unread count while conversation history remains', async () => {
 const view = render(<MemoryRouter><SellerDashboard /></MemoryRouter>);
 await screen.findByText('Saved buyer');
 expect(screen.getByRole('button', { name: /Inquiries.*1/ })).toBeInTheDocument();
 state.count = 0;
 view.rerender(<MemoryRouter><SellerDashboard /></MemoryRouter>);
 await waitFor(() => expect(screen.getByRole('button', { name: 'Inquiries' })).toBeInTheDocument());
 expect(screen.getByText('Saved buyer')).toBeInTheDocument();
 expect(screen.getByRole('heading', { name: 'Buyer Conversations' })).toBeInTheDocument();
});

