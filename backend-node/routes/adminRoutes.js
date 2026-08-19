const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// Dedicated rate limiter for admin login to prevent brute force attacks
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 failed/successful attempts per IP per 15 minutes
    message: { message: "Too many admin login attempts. Please try again after 15 minutes." }
});

// Admin login
router.post("/login", adminLoginLimiter, adminController.login);

// All routes below require admin auth
router.use(protect, adminController.requireAdmin);

// Verify admin session validity with database
router.get("/verify", adminController.verifyAdmin);

// ─── Dashboard Stats ────────────────────────────────────────
router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/dashboard/revenue", adminController.getRevenueData);
router.get("/dashboard/user-growth", adminController.getUserGrowth);

// ─── Listings Management ─────────────────────────────────────
router.get("/listings", adminController.getListings);
router.get("/listings/:id", adminController.getListingById);
router.patch("/listings/:id/approve", adminController.approveListing);
router.patch("/listings/:id/reject", adminController.rejectListing);
router.delete("/listings/:id", adminController.deleteListing);

// ─── Users Management ────────────────────────────────────────
router.get("/users", adminController.getUsers);
router.get("/pending-agents", adminController.getPendingAgents);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/ban", adminController.banUser);
router.patch("/users/:id/unban", adminController.unbanUser);
router.patch("/users/:id/role", adminController.updateUserRole);

// ─── Analytics ───────────────────────────────────────────────
router.get("/analytics", adminController.getAnalytics);
router.get("/analytics/heatmap", adminController.getSearchHeatmap);

// ─── Reports & Exports ───────────────────────────────────────
router.get("/reports/transactions", adminController.getTransactions);
router.get("/reports/export/:type", adminController.exportReport);

// ─── Audit Logs ──────────────────────────────────────────────
router.get("/audit-logs", adminController.getAuditLogs);

// ─── Settings ────────────────────────────────────────────────
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

// ─── Boosts ──────────────────────────────────────────────────
router.get("/boosts", adminController.getBoosts);
router.patch("/boosts/:id", adminController.toggleBoost);

// ─── Reported Content ────────────────────────────────────────
router.get("/reported", adminController.getReportedContent);
router.patch("/reported/:id/resolve", adminController.resolveReport);

module.exports = router;
