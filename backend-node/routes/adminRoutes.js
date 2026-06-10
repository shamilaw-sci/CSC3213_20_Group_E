const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// Admin login (no auth needed)
router.post("/login", adminController.login);

// All routes below require admin auth
router.use(protect, adminController.requireAdmin);

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
