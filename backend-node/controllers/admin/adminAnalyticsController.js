const adminRepository = require('../../repositories/adminRepository');

const getDashboardStats = async(req, res, next) => {
    try {
        const [
            { count: usersCount },
            { count: propertiesCount },
            { count: activeListingsCount },
            { count: pendingListingsCount },
            { count: rejectedListingsCount },
            { count: buyerCount },
            { count: sellerCount },
            { data: transactions },
            { data: propertiesData }
        ] = await adminRepository.getDashboardStats();

        const totalRevenue = (transactions || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        const typesMap = {};
        (propertiesData || []).forEach(p => {
            const t = p.type || 'Other';
            typesMap[t] = (typesMap[t] || 0) + 1;
        });
        const listingTypes = Object.entries(typesMap).map(([label, value]) => ({ label, value }));

        res.status(200).json({
            totalListings: propertiesCount || 0,
            totalUsers: usersCount || 0,
            totalProperties: propertiesCount || 0,
            activeListings: activeListingsCount || 0,
            pendingApproval: pendingListingsCount || 0,
            rejectedListings: rejectedListingsCount || 0,
            buyerCount: buyerCount || 0,
            sellerCount: sellerCount || 0,
            revenue: totalRevenue,
            listingTypes
        });
    } catch (error) {
        next(error);
    }
};

const monthKey = value => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit' }).formatToParts(new Date(value));
    return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
};
const recentMonths = () => {
    const [year, month] = monthKey(new Date()).split('-').map(Number);
    return Array.from({ length: 6 }, (_, index) => {
        const d = new Date(Date.UTC(year, month - 6 + index, 1));
        return { key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en-LK', { timeZone: 'UTC', month: 'short', year: 'numeric' }) };
    });
};
const getRevenueData = async(req, res, next) => {
    try {
        const rows = await adminRepository.getSuccessfulTransactions();
        const grouped = {};
        for (const row of rows || []) {
            if (!row.created_at || !Number.isFinite(new Date(row.created_at).getTime())) continue;
            const key = monthKey(row.created_at);
            grouped[key] = (grouped[key] || 0) + Number(row.amount || 0);
        }
        res.status(200).json({ data: recentMonths().map(({ key, label }) => ({ label, value: grouped[key] || 0 })), timezone: 'Asia/Colombo' });
    } catch (error) { next(error); }
};
const getUserGrowth = async(req, res, next) => {
    try {
        const rows = await adminRepository.getAllUsersCreatedAt();
        const months = recentMonths();
        const grouped = {};
        let cumulative = 0;
        for (const row of rows || []) {
            if (!row.created_at || !Number.isFinite(new Date(row.created_at).getTime())) continue;
            const key = monthKey(row.created_at);
            if (key < months[0].key) cumulative++;
            else grouped[key] = (grouped[key] || 0) + 1;
        }
        const data = months.map(({ key, label }) => { cumulative += grouped[key] || 0; return { label, users: cumulative }; });
        res.status(200).json({ data, timezone: 'Asia/Colombo' });
    } catch (error) { next(error); }
};

const getAnalytics = async(req, res, next) => {
    try {
        const { userCount, propertyCount } = await adminRepository.getAnalyticsCounts();
        res.status(200).json({
            analytics: [
                { metric: 'Total Users', value: userCount || 0 },
                { metric: 'Total Properties', value: propertyCount || 0 }
            ]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats, getRevenueData, getUserGrowth, getAnalytics };
