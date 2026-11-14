import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import Topbar from './Topbar';
import { fetchPendingAgents, fetchDashboardStats } from '../api/adminApi';
vi.mock('../api/adminApi', () => ({ fetchPendingAgents: vi.fn().mockResolvedValue({ agents: [] }), fetchDashboardStats: vi.fn().mockResolvedValue({ pendingApproval: 0 }), fetchRoleRequests: vi.fn().mockResolvedValue({ requests: [{ id: 'pending' }] }) }));
vi.mock('../../../context/ThemeProvider', () => ({ useTheme: () => ({ isDark: false, changeTheme: vi.fn() }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
beforeEach(() => { vi.clearAllMocks(); fetchPendingAgents.mockResolvedValue({ agents: [] }); fetchDashboardStats.mockResolvedValue({ pendingApproval: 0 }); });
function Route() { const location = useLocation(); return <output data-testid="route">{location.pathname}{location.search}</output>; }
test('shows pending seller request in notification queue', async () => {
  render(<MemoryRouter><Topbar /></MemoryRouter>);
  fireEvent.click(screen.getByTitle('Notifications'));
  expect(await screen.findByRole('button', { name: /1 seller upgrade request awaiting review/i })).toBeInTheDocument();
});
test('includes pending Agent applications alongside Seller and listing alerts, linking to approvals', async () => {
  fetchPendingAgents.mockResolvedValue({ agents: [{ id: 'g3' }, { id: 'g4' }] });
  fetchDashboardStats.mockResolvedValue({ pendingApproval: 3 });
  render(<MemoryRouter><Topbar /><Route /></MemoryRouter>);
  fireEvent.click(screen.getByTitle('Notifications'));
  const button = await screen.findByRole('button', { name: /2 agent applications awaiting review/i });
  expect(screen.getByText('6 Actions')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /1 seller upgrade request awaiting review/i })).toBeInTheDocument();
  expect(screen.getByText(/3 properties are awaiting/)).toBeInTheDocument();
  fireEvent.click(button);
  expect(screen.getByTestId('route')).toHaveTextContent('/admin/agent-approvals');
});
test('opening the bell refreshes the Agent queue after a new application', async () => {
  render(<MemoryRouter><Topbar /></MemoryRouter>);
  await screen.findByTitle('Notifications');
  fetchPendingAgents.mockResolvedValue({ agents: [{ id: 'new' }] });
  fireEvent.click(screen.getByTitle('Notifications'));
  expect(await screen.findByRole('button', { name: /1 agent application awaiting review/i })).toBeInTheDocument();
});
test('polling refreshes Agent applications on the existing thirty-second interval', async () => {
  vi.useFakeTimers();
  render(<MemoryRouter><Topbar /></MemoryRouter>);
  await act(async () => {});
  expect(fetchPendingAgents).toHaveBeenCalledTimes(1);
  fetchPendingAgents.mockResolvedValue({ agents: [{ id: 'new' }] });
  await act(async () => { vi.advanceTimersByTime(30000); });
  expect(fetchPendingAgents).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByTitle('Notifications'));
  expect(screen.getByRole('button', { name: /1 agent application awaiting review/i })).toBeInTheDocument();
});
