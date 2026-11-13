import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPassword() {
    const auth = useAuth();
    const [params] = useSearchParams();
    const token = params.get('token');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        if (!token || loading || success) return;
        setError('');
        if (password.length < 6) return setError('Password must be at least 6 characters.');
        if (password !== confirm) return setError('Passwords do not match.');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', { token, newPassword: password });
            auth?.setUserData?.(null);
            try {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_data');
            } catch {
                console.error('Cached admin sign-in could not be cleared.');
            }
            setSuccess(data.message || 'Password reset successful. You can now sign in.');
            setPassword('');
            setConfirm('');
            // Remove the consumed credential from the address bar/history entry.
            window.history.replaceState(window.history.state, '', window.location.pathname);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to reset your password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6 py-16">
            <section className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <Link to="/" className="text-xl font-bold text-emerald-600">Thirasara</Link>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-8 mb-3">Reset password</h1>
                <p className="text-slate-500 mb-6">Choose a new password for your account.</p>
                {(!token || error) && <p role="alert" className="text-sm text-red-600 mb-4">{!token ? 'Request a new reset link from the sign-in page.' : error}</p>}
                {success ? <p role="status" className="text-emerald-600 mb-6">{success}</p> : (
                    <form onSubmit={submit} className="space-y-5">
                        <div><label htmlFor="new-password" className="block text-sm font-medium mb-2">New password</label>
                            <Input id="new-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
                        <div><label htmlFor="confirm-password" className="block text-sm font-medium mb-2">Confirm password</label>
                            <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
                        <Button type="submit" disabled={!token || loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">{loading ? 'Resetting…' : 'Reset password'}</Button>
                    </form>
                )}
                <Link to="/login" className="block text-center text-sm text-emerald-600 mt-6">Back to sign in</Link>
            </section>
        </main>
    );
}
