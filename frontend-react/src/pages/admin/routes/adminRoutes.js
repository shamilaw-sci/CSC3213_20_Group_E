// ============================================================
// Thirasara Property — Admin API Routes (Node.js / Express)
// File: routes/adminRoutes.js
// Middleware: verifyToken, requireAdmin (JWT-based, FR-REQ-5.1)
// ============================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// All admin routes require a valid Admin JWT
router.use(verifyToken, requireAdmin);

// ─── Auth ────────────────────────────────────────────────────
// POST /api/admin/login  — Admin-only login (cannot self-register)
router.post("/login", adminController.login);

// ─── Dashboard Stats (FR-REQ-5.7) ────────────────────────────
router.get("/dashboard/stats",      adminController.getDashboardStats);
router.get("/dashboard/revenue",    adminController.getRevenueData);
router.get("/dashboard/user-growth",adminController.getUserGrowth);

// ─── Listings (ADM-001, ADM-002, FR-REQ-5.6) ─────────────────
// GET    /api/admin/listings         — list all with filters
// GET    /api/admin/listings/:id     — single listing detail
// PATCH  /api/admin/listings/:id/approve
// PATCH  /api/admin/listings/:id/reject  (body: { reason })
// DELETE /api/admin/listings/:id
router.get(   "/listings",              adminController.getListings);
router.get(   "/listings/:id",          adminController.getListingById);
router.patch( "/listings/:id/approve",  adminController.approveListing);
router.patch( "/listings/:id/reject",   adminController.rejectListing);
router.delete("/listings/:id",          adminController.deleteListing);

// ─── Users (ADM-003, ADM-004) ────────────────────────────────
router.get(  "/users",          adminController.getUsers);
router.get(  "/users/:id",      adminController.getUserById);
router.patch("/users/:id/ban",  adminController.banUser);
router.patch("/users/:id/unban",adminController.unbanUser);
router.patch("/users/:id/role", adminController.updateUserRole);

// ─── Analytics (ADM-006, FR-REQ-5.7) ─────────────────────────
router.get("/analytics",         adminController.getAnalytics);
router.get("/analytics/heatmap", adminController.getSearchHeatmap);

// ─── Reports & Exports (ADM-005, ADM-012) ────────────────────
router.get("/reports/transactions",      adminController.getTransactions);
router.get("/reports/export/:type",      adminController.exportReport);

// ─── Audit Logs (ADM-008, SEC-010) ───────────────────────────
router.get("/audit-logs", adminController.getAuditLogs);

// ─── Settings / Configuration (ADM-007) ──────────────────────
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

// ─── Listing Boosts (ADM-010) ─────────────────────────────────
router.get(  "/boosts",        adminController.getBoosts);
router.patch("/boosts/:id",    adminController.toggleBoost);

// ─── Reported Content (ADM-011) ───────────────────────────────
router.get(  "/reported",              adminController.getReportedContent);
router.patch("/reported/:id/resolve",  adminController.resolveReport);

// ─── System Alerts (ADM-009) ─────────────────────────────────
router.get("/alerts", adminController.getSystemAlerts);

module.exports = router;
