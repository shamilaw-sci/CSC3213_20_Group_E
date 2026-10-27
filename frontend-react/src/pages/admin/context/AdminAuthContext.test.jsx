import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';

const api = vi.hoisted(() => ({
    verifyAdminSession: vi.fn(), adminLogout: vi.fn(),
}));
vi.mock('../api/adminApi', () => api);

function SessionProbe() {
    const { admin, loading, logout } = useAdminAuth();
    const [failed, setFailed] = useState(false);
    return <>
        <span>{loading ? 'Loading' : admin ? 'Signed in' : 'Signed out'}</span>
        <button onClick={async () => { try { await logout(); } catch { setFailed(true); } }}>Sign out</button>
        {failed && <span>Sign out failed</span>}
    </>;
}

describe('Admin server logout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('admin_token', 'test-admin-token');
        localStorage.setItem('admin_data', JSON.stringify({ id: 'admin-1' }));
        api.verifyAdminSession.mockResolvedValue({ valid: true, admin: { id: 'admin-1' } });
        api.adminLogout.mockResolvedValue({ message: 'Logged out' });
    });
    afterEach(() => { cleanup(); localStorage.clear(); });

    const showSession = () => render(<MemoryRouter><Routes>
        <Route element={<AdminAuthProvider />}><Route path="/" element={<SessionProbe />} /></Route>
    </Routes></MemoryRouter>);

    test('waits for cookie-clearing server logout before clearing the admin session', async () => {
        let completeLogout;
        api.adminLogout.mockReturnValue(new Promise(resolve => { completeLogout = resolve; }));
        showSession();
        await screen.findByText('Signed in');
        fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
        expect(api.adminLogout).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Signed in')).toBeInTheDocument();
        expect(localStorage.getItem('admin_token')).toBe('test-admin-token');

        completeLogout({ message: 'Logged out' });
        await screen.findByText('Signed out');
        expect(localStorage.getItem('admin_token')).toBeNull();
        expect(localStorage.getItem('admin_data')).toBeNull();
    });

    test('does not claim logout succeeded when cookie clearing fails', async () => {
        api.adminLogout.mockRejectedValue(new Error('Network unavailable'));
        showSession();
        await screen.findByText('Signed in');
        fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
        await waitFor(() => expect(screen.getByText('Sign out failed')).toBeInTheDocument());
        expect(screen.getByText('Signed in')).toBeInTheDocument();
        expect(localStorage.getItem('admin_token')).toBe('test-admin-token');
    });
});
