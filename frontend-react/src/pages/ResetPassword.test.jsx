import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import api from '../context/api';
import ResetPassword from './ResetPassword';
vi.mock('../context/api', () => ({ default: { post: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
const show = (url = '/reset-password?token=test-token') => render(<MemoryRouter initialEntries={[url]}><ResetPassword /></MemoryRouter>);
test('submits the link token and new password and shows success', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password reset successful.' } });
    show();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'test-token', newPassword: 'new-password' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Password reset successful.');
});
test('missing tokens cannot submit', () => {
    show('/reset-password');
    expect(screen.getByRole('alert')).toHaveTextContent('Request a new reset link');
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeDisabled();
});
test('shows server failure without claiming success', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'This link has expired.' } } });
    show();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This link has expired.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
