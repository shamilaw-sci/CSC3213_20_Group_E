import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../context/api';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
    const [token] = useState(() => window.location.hash.slice(1));
    const [busy, setBusy] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(useLocation().state?.email || '');

    async function resend(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const { data } = await api.post('/auth/resend-verification', { email });
            setMessage(data.message);
        } catch {
            setError('Could not request another link. Try again later.');
        } finally {
            setBusy(false);
        }
    }

    async function verify() {
        setBusy(true);
        setError('');
        try {
            await api.post('/auth/verify-email', { token });
            window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
            setVerified(true);
        } catch {
            setError('Could not verify your email. Check the link or request a new one.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="mx-auto max-w-md space-y-4 px-6 py-16">
            <h1 className="text-3xl font-bold">Verify your email</h1>
            {verified && <p role="status">Email verified. You can now sign in.</p>}
            {token && !verified && (
                <Button type="button" disabled={busy || !token} onClick={verify}>
                    {busy ? 'Verifying…' : 'Confirm email'}
                </Button>
            )}
            {!verified && (
                <form onSubmit={resend} className="space-y-3">
                    {!token && <p>Check your inbox for a verification link.</p>}
                    <label className="block">
                        Email address
                        <input required type="email" value={email} onChange={event => setEmail(event.target.value)}
                            className="mt-1 block w-full rounded border bg-transparent px-3 py-2" />
                    </label>
                    <Button type="submit" variant="outline" disabled={busy}>Resend verification email</Button>
                </form>
            )}
            {message && <p role="status">{message}</p>}
            {error && <p role="alert">{error}</p>}
            <Link to="/login" className="block text-blue-600 underline">Back to Sign In</Link>
        </main>
    );
}
