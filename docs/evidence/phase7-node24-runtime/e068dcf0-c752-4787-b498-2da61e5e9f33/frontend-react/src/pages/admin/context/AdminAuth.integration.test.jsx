import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';
import AdminProtectedRoute from '../components/AdminProtectedRoute';

const api = vi.hoisted(() => ({ verifyAdminSession: vi.fn(), adminLogout: vi.fn() }));
vi.mock('../api/adminApi', () => api);

function AdminDestination() {
  const { admin } = useAdminAuth();
  return <><h1>Admin destination</h1><output aria-label="Verified admin">{admin.id}:{admin.role}</output></>;
}

function show() {
  return render(<MemoryRouter initialEntries={['/admin/dashboard']}><Routes>
    <Route element={<AdminAuthProvider />}>
      <Route path="/admin/login" element={<h1>Admin login destination</h1>} />
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminDestination />} />
      </Route>
    </Route>
  </Routes></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  api.verifyAdminSession.mockRejectedValue(new Error('Invalid session'));
});

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe('Admin provider and route guard integration', () => {
  test('stored admin profile alone cannot grant access without a token', async () => {
    localStorage.setItem('admin_data', JSON.stringify({ id: 'forged-admin', role: 'ADMIN' }));
    show();
    expect(await screen.findByRole('heading', { name: 'Admin login destination' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin destination' })).not.toBeInTheDocument();
    expect(api.verifyAdminSession).not.toHaveBeenCalled();
  });

  test('forged token and profile are rejected when server verification fails', async () => {
    localStorage.setItem('admin_token', 'forged-token');
    localStorage.setItem('admin_data', JSON.stringify({ id: 'forged-admin', role: 'ADMIN' }));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    show();
    expect(await screen.findByRole('heading', { name: 'Admin login destination' })).toBeInTheDocument();
    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_data')).toBeNull();
    expect(screen.queryByLabelText('Verified admin')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Admin session verification failed:', 'Invalid session');
  });

  test('protected content waits for server verification and uses verified identity', async () => {
    localStorage.setItem('admin_token', 'fixture-session');
    localStorage.setItem('admin_data', JSON.stringify({ id: 'forged-admin', role: 'ADMIN' }));
    let finish;
    api.verifyAdminSession.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    show();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByLabelText('Verified admin')).not.toBeInTheDocument();
    const verified = { id: 'server-admin', name: 'Verified admin', role: 'ADMIN' };
    await act(async () => finish({ valid: true, admin: verified }));
    expect(await screen.findByRole('heading', { name: 'Admin destination' })).toBeInTheDocument();
    expect(screen.getByLabelText('Verified admin')).toHaveTextContent('server-admin:ADMIN');
    expect(JSON.parse(localStorage.getItem('admin_data'))).toEqual(verified);
  });

  test('a negative verification response denies access even with saved admin data', async () => {
    localStorage.setItem('admin_token', 'fixture-invalid-session');
    localStorage.setItem('admin_data', JSON.stringify({ id: 'forged-admin', role: 'ADMIN' }));
    api.verifyAdminSession.mockResolvedValueOnce({ valid: false });
    show();
    expect(await screen.findByRole('heading', { name: 'Admin login destination' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Verified admin')).not.toBeInTheDocument();
  });
});
