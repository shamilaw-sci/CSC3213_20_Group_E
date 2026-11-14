import { logClientError } from '../utils/clientLog';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../context/api';
import { useAuth } from '../context/UserAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
    const auth = useAuth();
    const [params] = useSearchParams();
    const token = params.get('token');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        if (!token || loading || success) return;
        setError('');
        if ([...password].length < 15 || new TextEncoder().encode(password).length > 72) return setError('Password must be at least 15 characters and at most 72 UTF-8 bytes.');
        if (password !== confirm) return setError('Passwords do not match.');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', { token, newPassword: password });
            auth?.setUserData?.(null);
            try {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_data');
            } catch {
                logClientError('cached_admin_session_clear_failed');
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
                            <div className="relative">
                                <Input id="new-password" type={showPassword ? 'text' : 'password'} className="pr-12" autoComplete="new-password" required minLength={15} value={password} onChange={e => setPassword(e.target.value)} />
                                <button type="button" aria-label={showPassword ? 'Hide new password' : 'Show new password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-slate-500 hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-600">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div></div>
                        <div><label htmlFor="confirm-password" className="block text-sm font-medium mb-2">Confirm password</label>
                            <div className="relative">
                                <Input id="confirm-password" type={showConfirm ? 'text' : 'password'} className="pr-12" autoComplete="new-password" required minLength={15} value={confirm} onChange={e => setConfirm(e.target.value)} />
                                <button type="button" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={showConfirm} onClick={() => setShowConfirm(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-slate-500 hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-600">
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div></div>
                        <Button type="submit" disabled={!token || loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">{loading ? 'Resetting…' : 'Reset password'}</Button>
                    </form>
                )}
                <Link to="/login" className="block text-center text-sm text-emerald-600 mt-6">Back to sign in</Link>
            </section>
        </main>
    );
}
