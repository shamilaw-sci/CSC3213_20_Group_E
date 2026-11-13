const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminRepository = require('../repositories/adminRepository');
const { sendListingStatusEmail } = require('../utils/emailService');
const { checkSavedSearchMatches } = require('./savedSearchController');

const login = async(req, res, next) => {
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

        const token = jwt.sign({ id: adminUser.id, email: email, role: 'ADMIN' },
            process.env.JWT_SECRET, { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

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

const { getDashboardStats, getRevenueData, getUserGrowth, getAnalytics } = require('./admin/adminAnalyticsController');

const { getListings, getListingById, approveListing, rejectListing, deleteListing } = require('./admin/adminListingController');
const { getUsers, getPendingAgents, getUserById, banUser, unbanUser, updateUserRole } = require('./admin/adminUserController');

const getSearchHeatmap = async(req, res, next) => {
    try {
        res.status(200).json({ heatmap: [] });
    } catch (error) {
        next(error);
    }
};

const getTransactions = async(req, res, next) => {
    try {
        const transactions = await adminRepository.getTransactionsDetailed();
        res.status(200).json({ transactions });
    } catch (error) {
        next(error);
    }
};

const exportReport = async(req, res, next) => {
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

const getAuditLogs = async(req, res, next) => {
    try {
        res.status(200).json({ logs: [] });
    } catch (error) {
        next(error);
    }
};

const getSettings = async(req, res, next) => {
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

const updateSettings = async(req, res, next) => {
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

const getBoosts = async(req, res, next) => {
    try {
        res.status(200).json({ boosts: [] });
    } catch (error) {
        next(error);
    }
};

const toggleBoost = async(req, res, next) => {
    try {
        res.status(200).json({ message: "Boost toggled" });
    } catch (error) {
        next(error);
    }
};

const getReportedContent = async(req, res, next) => {
    try {
        res.status(200).json({ reports: [] });
    } catch (error) {
        next(error);
    }
};

const resolveReport = async(req, res, next) => {
    try {
        res.status(200).json({ message: "Report resolved" });
    } catch (error) {
        next(error);
    }
};

// ── Role Upgrade Request Controllers ─────────────────────────────────────────

const getRoleRequests = async(req, res, next) => {
    try {
        const { status } = req.query; // optional filter: pending | approved | rejected
        const requests = await adminRepository.getRoleRequests(status || 'pending');
        res.status(200).json({ requests });
    } catch (error) {
        next(error);
    }
};

const approveRoleRequest = async(req, res, next) => {
    try {
        const request = await adminRepository.getRoleRequestById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Role request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already resolved' });

        // Change the user's actual role
        await adminRepository.updateUserRole(request.user_id, request.requested_role, null);
        // Mark request resolved
        await adminRepository.resolveRoleRequest(req.params.id, 'approved');

        res.status(200).json({ message: `User upgraded to ${request.requested_role} successfully` });
    } catch (error) {
        next(error);
    }
};

const rejectRoleRequest = async(req, res, next) => {
    try {
        const request = await adminRepository.getRoleRequestById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Role request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already resolved' });

        await adminRepository.resolveRoleRequest(req.params.id, 'rejected');
        res.status(200).json({ message: 'Role request rejected' });
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
    resolveReport,
    getRoleRequests,
    approveRoleRequest,
    rejectRoleRequest
};
