import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import * as api from '../api/adminApi';
import DashboardPage from './DashboardPage';
vi.mock('../api/adminApi', () => ({ fetchDashboardStats: vi.fn(), fetchRevenueData: vi.fn(), fetchUserGrowth: vi.fn(), fetchListings: vi.fn() }));
vi.mock('framer-motion', () => ({ m: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
    button: ({ children, className, type, onClick }) => <button type={type} className={className} onClick={onClick}>{children}</button>
} }));
beforeEach(() => {
    vi.resetAllMocks();
    api.fetchDashboardStats.mockResolvedValue({ totalListings: 123, pendingApproval: 1, totalUsers: 10 });
    api.fetchRevenueData.mockResolvedValue({ data: [] });
    api.fetchUserGrowth.mockResolvedValue({ data: [] });
    api.fetchListings.mockResolvedValue({ listings: [{ id: 'listing-1', title: 'Pending Kandy home' }] });
});
test('keeps successful dashboard data and reports unavailable revenue', async () => {
    api.fetchRevenueData.mockRejectedValue(new Error('Revenue unavailable'));
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(await screen.findByText('Pending Kandy home')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('revenue');
    expect(screen.queryByText('All Clear!')).not.toBeInTheDocument();
});
test('does not claim an empty approval queue when its request fails', async () => {
    api.fetchListings.mockRejectedValue(new Error('Listings unavailable'));
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('pending listings');
    expect(screen.queryByText('All Clear!')).not.toBeInTheDocument();
});
