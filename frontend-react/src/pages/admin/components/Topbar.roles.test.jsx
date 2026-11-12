import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi, afterEach } from 'vitest';
import Topbar from './Topbar';
vi.mock('../api/adminApi', () => ({ fetchDashboardStats: vi.fn().mockResolvedValue({ pendingApproval: 0 }), fetchRoleRequests: vi.fn().mockResolvedValue({ requests: [{ id: 'pending' }] }) }));
vi.mock('../../../context/ThemeProvider', () => ({ useTheme: () => ({ isDark: false, changeTheme: vi.fn() }) }));
afterEach(cleanup);
test('shows pending seller request in notification queue', async () => {
  render(<MemoryRouter><Topbar /></MemoryRouter>);
  fireEvent.click(screen.getByTitle('Notifications'));
  expect(await screen.findByRole('button', { name: /1 seller upgrade request awaiting review/i })).toBeInTheDocument();
});
