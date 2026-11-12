import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import api from '../context/api';
import ResetPassword from './ResetPassword';
vi.mock('../context/api', () => ({ default: { post: vi.fn() } }));
const auth = vi.hoisted(() => ({ setUserData: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); localStorage.setItem('admin_token', 'synthetic-old-token'); localStorage.setItem('admin_data', '{}'); });
afterEach(() => localStorage.clear());
const show = (url = '/reset-password?token=test-token') => render(<MemoryRouter initialEntries={[url]}><ResetPassword /></MemoryRouter>);
test('submits the link token and new password and shows success', async () => {
    api.post.mockResolvedValue({ data: { message: 'Password reset successful.' } });
    show();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password-long' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password-long' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'test-token', newPassword: 'new-password-long' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Password reset successful.');
    expect(auth.setUserData).toHaveBeenCalledWith(null);
    expect(localStorage.getItem('admin_token')).toBeNull(); expect(localStorage.getItem('admin_data')).toBeNull();
});
test('missing tokens cannot submit', () => {
    show('/reset-password');
    expect(screen.getByRole('alert')).toHaveTextContent('Request a new reset link');
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeDisabled();
});
test('shows server failure without claiming success', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'This link has expired.' } } });
    show();
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password-long' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password-long' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This link has expired.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(auth.setUserData).not.toHaveBeenCalled(); expect(localStorage.getItem('admin_token')).toBe('synthetic-old-token');
});
