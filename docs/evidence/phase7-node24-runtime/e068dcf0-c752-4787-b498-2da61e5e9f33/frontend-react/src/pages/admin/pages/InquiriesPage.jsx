import { useEffect, useState } from 'react';
import { fetchInquiries } from '../api/adminApi';

export default function InquiriesPage() {
    const [page, setPage] = useState(1);
    const [refresh, setRefresh] = useState(0);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        fetchInquiries(page).then(data => {
            if (active) setResult(data);
        }).catch(() => {
            if (active) setError('Unable to load inquiries. Please try again.');
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [page, refresh]);
    const totalPages = Math.max(1, Math.ceil((result?.total || 0) / 20));

    return <section className="space-y-6 text-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between gap-4">
            <div><h1 className="text-3xl font-black">Inquiries</h1><p className="text-sm text-slate-500 mt-2">Messages submitted through the Home page contact form.</p></div>
            <button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50">Refresh</button>
        </div>
        {loading ? <p role="status">Loading inquiries…</p> : error ? <p role="alert" className="text-red-500">{error}</p> : <>
            {!result?.inquiries?.length && <p className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl">No inquiries yet.</p>}
            <div className="space-y-4">{result?.inquiries?.map(inquiry => <article key={inquiry.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h2 className="font-bold">{inquiry.first_name} {inquiry.last_name}</h2><a href={`mailto:${inquiry.email}`} className="text-sm text-blue-500 break-all">{inquiry.email}</a></div>
                    <time dateTime={inquiry.created_at} className="text-xs text-slate-500">{new Date(inquiry.created_at).toLocaleString()}</time>
                </div>
                <p className="mt-4 text-sm whitespace-pre-wrap break-words">{inquiry.message}</p>
            </article>)}</div>
            <nav aria-label="Inquiry pages" className="flex items-center justify-between gap-4">
                <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="px-4 py-2 border rounded-xl disabled:opacity-40">Previous</button>
                <span className="text-sm">Page {page} of {totalPages} · {result?.total || 0} inquiries</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)} className="px-4 py-2 border rounded-xl disabled:opacity-40">Next</button>
            </nav>
        </>}
    </section>;
}
