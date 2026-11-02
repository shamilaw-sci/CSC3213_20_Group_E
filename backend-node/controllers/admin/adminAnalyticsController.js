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

const getRevenueData = async(req, res, next) => {
    try {
        const transactions = await adminRepository.getSuccessfulTransactions();

        const grouped = {};
        (transactions || []).forEach(tx => {
            if (!tx.created_at) return;
            const date = new Date(tx.created_at);
            const month = date.toLocaleString('default', { month: 'short' });
            grouped[month] = (grouped[month] || 0) + Number(tx.amount || 0);
        });

        const months = [];
        const d = new Date();
        d.setMonth(d.getMonth() - 5);
        for (let i = 0; i < 6; i++) {
            const m = d.toLocaleString('default', { month: 'short' });
            months.push(m);
            if (!grouped[m]) grouped[m] = 0;
            d.setMonth(d.getMonth() + 1);
        }

        const formattedData = months.map(m => ({ label: m, value: grouped[m] }));

        res.status(200).json({ data: formattedData });
    } catch (error) {
        next(error);
    }
};

const getUserGrowth = async(req, res, next) => {
    try {
        const users = await adminRepository.getAllUsersCreatedAt();

        let cumulative = 0;
        const countsPerMonth = {};
        (users || []).forEach(u => {
            if (!u.created_at) return;
            const monthYear = new Date(u.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
            countsPerMonth[monthYear] = (countsPerMonth[monthYear] || 0) + 1;
        });

        const months = [];
        const d = new Date();
        d.setMonth(d.getMonth() - 5);

        (users || []).forEach(u => {
            if (!u.created_at) return;
            if (new Date(u.created_at) < d) {
                cumulative++;
            }
        });

        for (let i = 0; i < 6; i++) {
            const monthLabel = d.toLocaleString('default', { month: 'short' });
            const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });

            cumulative += (countsPerMonth[key] || 0);
            months.push({ label: monthLabel, users: cumulative });

            d.setMonth(d.getMonth() + 1);
        }

        res.status(200).json({ data: months });
    } catch (error) {
        next(error);
    }
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
