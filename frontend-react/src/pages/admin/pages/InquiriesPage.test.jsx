import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchInquiries } from '../api/adminApi';
import InquiriesPage from './InquiriesPage';
vi.mock('../api/adminApi', () => ({ fetchInquiries: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
test('shows submitted contact information and message in the separate admin section', async () => {
    fetchInquiries.mockResolvedValue({ inquiries: [{ id: 'q1', first_name: 'Test', last_name: 'Visitor', email: 'test@example.com', message: 'Please share details.', created_at: '2026-10-25T00:00:00Z' }], total: 1 });
    render(<InquiriesPage />);
    expect(await screen.findByText('Test Visitor')).toBeInTheDocument();
    expect(screen.getByText('Please share details.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test@example.com' })).toHaveAttribute('href', 'mailto:test@example.com');
});
test('does not show an empty inbox when its request fails', async () => {
    fetchInquiries.mockRejectedValue(new Error('Unavailable'));
    render(<InquiriesPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load inquiries');
    expect(screen.queryByText('No inquiries yet.')).not.toBeInTheDocument();
});
