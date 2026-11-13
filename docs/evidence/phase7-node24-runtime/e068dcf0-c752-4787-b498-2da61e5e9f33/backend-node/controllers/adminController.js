const { issueSessionToken } = require('../utils/sessionToken');
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

        const token = issueSessionToken({ ...adminUser, role: 'ADMIN' }, { extraClaims: { email } });

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

const { getTransactions, exportReport } = require('./admin/adminReportController');

const getAuditLogs = async(req, res, next) => {
    try {
        res.status(200).json({ logs: [] });
    } catch (error) {
        next(error);
    }
};

const { getSettings, updateSettings } = require('./admin/adminSettingsController');

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

const { getRoleRequests, approveRoleRequest, rejectRoleRequest } = require('./admin/adminRoleRequestController');

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
