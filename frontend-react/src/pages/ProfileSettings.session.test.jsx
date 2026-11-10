import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';
import toast from 'react-hot-toast';
vi.mock('react-hot-toast',()=>({default:{error:vi.fn()}}));
const auth = vi.hoisted(() => ({ user: {}, login: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('../context/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', changeTheme: vi.fn() }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('../components/profile/PreferencesSettings', () => ({ default: () => null }));
vi.mock('../components/profile/AgentProfileSettings', () => ({ default: () => null }));
vi.mock('../components/profile/SecuritySettings', () => ({ default: ({ formData, handleChange, handleSubmit, message, error }) => (
  <form onSubmit={handleSubmit}>
    {message && <p>{message}</p>}{error && <p>{error}</p>}
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


test.each([['image/svg+xml',20],['image/png',3*1024*1024+1]])('avatar picker rejects %s/%s before FileReader', async (type,size) => {
  const read=vi.spyOn(FileReader.prototype,'readAsDataURL').mockImplementation(()=>{});
  try {
    const {container}=render(<MemoryRouter><ProfileSettings /></MemoryRouter>);
    await act(async()=>{await Promise.resolve();});
    fireEvent.change(container.querySelector('#avatarUpload'),{target:{files:[{type,size}]}});
    expect(read).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Choose JPEG, PNG or WebP up to 3 MiB.');
  } finally {read.mockRestore();}
});
test('avatar picker reads valid raster selection', async()=>{
  const read=vi.spyOn(FileReader.prototype,'readAsDataURL').mockImplementation(function(){Object.defineProperty(this,'result',{value:'data:image/png;base64,iVBORw0KGgo='});this.onloadend();});
  try {
    const {container}=render(<MemoryRouter><ProfileSettings /></MemoryRouter>);
    await act(async()=>{await Promise.resolve();});
    const file=new File(['synthetic'],'avatar.png',{type:'image/png'});
    fireEvent.change(container.querySelector('#avatarUpload'),{target:{files:[file]}});
    expect(read).toHaveBeenCalledWith(file);
    expect(screen.getByAltText('Avatar').getAttribute('src')).toBe('data:image/png;base64,iVBORw0KGgo=');
  } finally {read.mockRestore();}
});
test('partial profile response displays the omission message',async()=>{
  api.put.mockResolvedValue({data:{user:auth.user,partial:true,message:'Profile updated; some fields could not be saved.'}});
  await save();expect(await screen.findByText('Profile updated; some fields could not be saved.')).toBeTruthy();
});
