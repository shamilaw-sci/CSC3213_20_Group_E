import { useEffect, useState } from 'react';
import api from '../../context/api';

const SellerRequestNotice = ({ userId }) => {
    const [result, setResult] = useState(null);
    useEffect(() => {
        let active = true;
        if (userId) {
            api.get('/auth/request-role-upgrade').then(({ data }) => {
                if (active) setResult({ userId, status: data.request?.status });
            }).catch(() => {
                if (active) setResult({ userId, status: null });
            });
        }
        return () => { active = false; };
    }, [userId]);

    if (!userId || result?.userId !== userId || result.status !== 'rejected') return null;
    return (
        <p role="status" className="mb-6 rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            Your Seller upgrade request was rejected. You can submit a new request from Buyer Hub → Become a Seller.
        </p>
    );
};

export default SellerRequestNotice;
