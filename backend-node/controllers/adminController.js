const { issueSessionToken } = require('../utils/sessionToken');
const bcrypt = require('bcryptjs');
const adminMfa = require('../utils/adminMfa');
const adminRepository = require('../repositories/adminRepository');
const { sendListingStatusEmail } = require('../utils/emailService');
const { checkSavedSearchMatches } = require('./savedSearchController');

const login = async(req, res, next) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== 'string' || typeof password !== 'string' || password.length > 1024) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        const { data: adminUser, error } = await adminRepository.getAdminUserByEmail(email);

        if (error || !adminUser) {
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        const isMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        let mfa = {};
        if (adminMfa.enabled()) {
            mfa = await adminMfa.authenticate(adminUser, req.body);
            if (mfa.rejected) return res.status(401).json({ message: 'Invalid or already used verification code' });
            if (!mfa.verified) return res.status(200).json({ ...mfa, mfaRequired: true });
        }
        const token = issueSessionToken({ ...adminUser, role: 'ADMIN' }, { extraClaims: { email, admin_mfa: adminMfa.enabled() } });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        return res.status(200).json({
            message: "Login successful",
            token,
            recoveryCodes: mfa.recoveryCodes,
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

const { getSearchHeatmap } = require('./searchDemandController');

const { getTransactions, exportReport } = require('./admin/adminReportController');

const getAuditLogs = async(req, res, next) => {
    try {
        const { data, error } = await require('../config/supabase').from('admin_audit_events')
            .select('id, actor_id, actor, action, target, ip, severity, created_at')
            .order('created_at', { ascending: false }).limit(500);
        if (error) throw error;
        res.status(200).json({ logs: (data || []).map(row => ({ ...row, timestamp: row.created_at })), limit: 500 });
    } catch (error) {
        next(error);
    }
};

const { getSettings, updateSettings } = require('./admin/adminSettingsController');

const { getBoosts, toggleBoost } = require('./admin/adminPromotionController');
const { getReportedContent, resolveReport } = require('./admin/listingReportController');

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
