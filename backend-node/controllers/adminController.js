const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminRepository = require('../repositories/adminRepository');
const { sendListingStatusEmail } = require('../utils/emailService');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { data: adminUser, error } = await adminRepository.getAdminUserByEmail(email);

        if (error || !adminUser) {
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        const isMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        const token = jwt.sign(
            { id: adminUser.id, email: email, role: 'ADMIN' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            admin: { id: adminUser.id, email, name: adminUser.name }
        });
    } catch (error) {
        next(error);
    }
};

const requireAdmin = (req, res, next) => {
    // req.user is populated by protect middleware from fresh DB lookup
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    req.admin = req.user;
    next();
};

const verifyAdmin = (req, res) => {
    res.status(200).json({
        valid: true,
        admin: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        }
    });
};

const getDashboardStats = async (req, res, next) => {
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

const getRevenueData = async (req, res, next) => {
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

const getUserGrowth = async (req, res, next) => {
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

const getListings = async (req, res, next) => {
    try {
        const listings = await adminRepository.getListings(req.query.status);
        res.status(200).json({ listings });
    } catch (error) {
        next(error);
    }
};

const getListingById = async (req, res, next) => {
    try {
        const listing = await adminRepository.getListingByIdWithTransactions(req.params.id);
        res.status(200).json({ listing });
    } catch (error) {
        console.error("Failed to get listing by ID:", error.message);
        next(error);
    }
};

const approveListing = async (req, res, next) => {
    try {
        const data = await adminRepository.updateListingStatus(req.params.id, {
            status: 'approved',
            rejection_reason: null
        });

        const sellerEmail = data?.seller?.email;
        const sellerName = data?.seller?.name || 'Seller';
        if (sellerEmail) {
            await sendListingStatusEmail(sellerEmail, sellerName, data.title, 'approved');
        }

        res.status(200).json({ message: "Listing approved successfully" });
    } catch (error) {
        next(error);
    }
};

const rejectListing = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const data = await adminRepository.updateListingStatus(req.params.id, {
            status: 'rejected',
            rejection_reason: reason
        });

        const sellerEmail = data?.seller?.email;
        const sellerName = data?.seller?.name || 'Seller';
        if (sellerEmail) {
            await sendListingStatusEmail(sellerEmail, sellerName, data.title, 'rejected', reason);
        }

        res.status(200).json({ message: "Listing rejected successfully" });
    } catch (error) {
        next(error);
    }
};

const deleteListing = async (req, res, next) => {
    try {
        await adminRepository.deleteListing(req.params.id);
        res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await adminRepository.getUsers(req.query.role);
        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
};

const getPendingAgents = async (req, res, next) => {
    try {
        const agents = await adminRepository.getPendingAgents();
        res.status(200).json({ agents });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await adminRepository.getUserById(req.params.id);
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

const banUser = async (req, res, next) => {
    try {
        await adminRepository.updateUserRole(req.params.id, 'BANNED', null);
        res.status(200).json({ message: "User banned successfully" });
    } catch (error) {
        next(error);
    }
};

const unbanUser = async (req, res, next) => {
    try {
        await adminRepository.updateUserRole(req.params.id, 'BUYER', null);
        res.status(200).json({ message: "User unbanned successfully" });
    } catch (error) {
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { role, reason } = req.body;
        if (!['BUYER', 'SELLER', 'ADMIN', 'BANNED', 'AGENT', 'PENDING_AGENT', 'REJECTED_AGENT'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        await adminRepository.updateUserRole(req.params.id, role, reason);
        res.status(200).json({ message: `User role updated to ${role}` });
    } catch (error) {
        console.error("updateUserRole error:", error);
        next(error);
    }
};

const getAnalytics = async (req, res, next) => {
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

const getSearchHeatmap = async (req, res, next) => {
    try {
        res.status(200).json({ heatmap: [] });
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const transactions = await adminRepository.getTransactionsDetailed();
        res.status(200).json({ transactions });
    } catch (error) {
        next(error);
    }
};

const exportReport = async (req, res, next) => {
    try {
        const { type } = req.params;
        if (!['transactions', 'users', 'listings'].includes(type)) {
            return res.status(400).json({ message: "Invalid report type" });
        }

        const { dataToExport, headers } = await adminRepository.getExportData(type);

        // Sanitize cells against CSV / Spreadsheet Formula Injection (M6 fix)
        const sanitizeCsvCell = (val) => {
            if (val === null || val === undefined) return '""';
            let str = String(val);
            // Prepend single quote if value starts with formula triggers (=, +, -, @, \t, \r)
            if (/^[=+\-@\t\r]/.test(str)) {
                str = "'" + str;
            }
            return `"${str.replace(/"/g, '""')}"`;
        };

        let csvContent = headers.join(',') + '\n';
        dataToExport.forEach(row => {
            const values = headers.map(header => sanitizeCsvCell(row[header]));
            csvContent += values.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=thirasara-${type}-report.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

const getAuditLogs = async (req, res, next) => {
    try {
        res.status(200).json({ logs: [] });
    } catch (error) {
        next(error);
    }
};

const getSettings = async (req, res, next) => {
    try {
        const data = await adminRepository.getPlatformSettings();
        
        const settings = {};
        if (data) {
            data.forEach(item => {
                settings[item.setting_key] = item.setting_value;
            });
        }
        if (!settings['listing_fee']) settings['listing_fee'] = '500';

        res.status(200).json({ settings });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const { listing_fee } = req.body;
        if (listing_fee) {
            await adminRepository.updatePlatformSetting('listing_fee', listing_fee);
        }
        res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
        next(error);
    }
};

const getBoosts = async (req, res, next) => {
    try {
        res.status(200).json({ boosts: [] });
    } catch (error) {
        next(error);
    }
};

const toggleBoost = async (req, res, next) => {
    try {
        res.status(200).json({ message: "Boost toggled" });
    } catch (error) {
        next(error);
    }
};

const getReportedContent = async (req, res, next) => {
    try {
        res.status(200).json({ reports: [] });
    } catch (error) {
        next(error);
    }
};

const resolveReport = async (req, res, next) => {
    try {
        res.status(200).json({ message: "Report resolved" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    verifyAdmin,
    requireAdmin,
    getDashboardStats,
    getRevenueData,
    getUserGrowth,
    getListings,
    getListingById,
    approveListing,
    rejectListing,
    deleteListing,
    getUsers,
    getPendingAgents,
    getUserById,
    banUser,
    unbanUser,
    updateUserRole,
    getAnalytics,
    getSearchHeatmap,
    getTransactions,
    exportReport,
    getAuditLogs,
    getSettings,
    updateSettings,
    getBoosts,
    toggleBoost,
    getReportedContent,
    resolveReport
};
