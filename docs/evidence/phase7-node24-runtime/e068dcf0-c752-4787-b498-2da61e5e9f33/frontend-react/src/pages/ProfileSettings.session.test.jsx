import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';
const auth = vi.hoisted(() => ({ user: {}, login: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('../context/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', changeTheme: vi.fn() }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('../components/profile/PreferencesSettings', () => ({ default: () => null }));
vi.mock('../components/profile/AgentProfileSettings', () => ({ default: () => null }));
vi.mock('../components/profile/SecuritySettings', () => ({ default: ({ formData, handleChange, handleSubmit }) => (
  <form onSubmit={handleSubmit}>
    <input aria-label="Current password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} />
    <input aria-label="New password" name="password" value={formData.password} onChange={handleChange} />
    <input aria-label="Confirm password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
    <button type="submit">Save credentials</button>
  </form>
) }));
beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear(); localStorage.setItem('admin_token', 'synthetic-old-token');
  auth.user = { id: 'user', role: 'ADMIN', name: 'Synthetic', email: 'synthetic@example.test' };
  api.get.mockImplementation(async url => ({ data: url === '/saved-searches' ? { savedSearches: [] }
    : url === '/favorites' ? { favorites: [] } : url === '/agents/my-appointments' ? { appointments: [] } : { unreadCount: 0 } }));
});
afterEach(() => { cleanup(); localStorage.clear(); });
async function save() {
  render(<MemoryRouter><ProfileSettings /></MemoryRouter>);
  await screen.findByLabelText('Current password');
  await act(async () => { await Promise.resolve(); });
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old-password' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save credentials' }));
  });
}
test('confirmed Admin password change replaces cached Bearer with server token', async () => {
  api.put.mockResolvedValue({ data: { user: auth.user, token: 'synthetic-new-token' } });
  await save(); await waitFor(() => expect(auth.login).toHaveBeenCalledWith(auth.user));
  expect(localStorage.getItem('admin_token')).toBe('synthetic-new-token');
});
test('consumer password change keeps credential HttpOnly and does not cache body tokens', async () => {
  auth.user = { ...auth.user, role: 'BUYER' }; localStorage.removeItem('admin_token');
  api.put.mockResolvedValue({ data: { user: auth.user } });
  await save(); await waitFor(() => expect(auth.login).toHaveBeenCalled());
  expect(localStorage.getItem('admin_token')).toBeNull();
});
test('failed password change does not replace current Admin credential', async () => {
  api.put.mockRejectedValue({ response: { data: { message: 'Synthetic failure' } } });
  await save(); await waitFor(() => expect(api.put).toHaveBeenCalled());
  expect(auth.login).not.toHaveBeenCalled(); expect(localStorage.getItem('admin_token')).toBe('synthetic-old-token');
});
