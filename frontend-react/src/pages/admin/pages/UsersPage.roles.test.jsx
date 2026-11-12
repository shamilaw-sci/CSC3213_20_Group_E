import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import UsersPage from './UsersPage';
const mocks = vi.hoisted(() => ({ fetchUsers: vi.fn().mockResolvedValue({ users: [] }), fetchRoleRequests: vi.fn().mockResolvedValue({ requests: [] }), banUser: vi.fn(), unbanUser: vi.fn(), updateUserRole: vi.fn(), approveRoleRequest: vi.fn(), rejectRoleRequest: vi.fn() }));
vi.mock('../api/adminApi', () => mocks);
afterEach(cleanup);
function MountedPage() {
 const navigate = useNavigate();
 return <><button onClick={() => navigate('/admin/users?section=requests')}>Open request notification</button><UsersPage /></>;
}
test('notification navigation opens requests while the users page stays mounted', async () => {
 render(<MemoryRouter initialEntries={['/admin/users']}><MountedPage /></MemoryRouter>);
 fireEvent.click(screen.getByText('Open request notification'));
 await vi.waitFor(() => expect(mocks.fetchRoleRequests).toHaveBeenCalledWith('pending'));
});
