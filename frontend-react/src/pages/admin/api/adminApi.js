/**
 * Admin API Client — Thirasara Property Admin Panel
 *
 * Uses a dedicated Axios instance with:
 *  - Shared baseURL from VITE_API_URL environment variable
 *  - Automatic Bearer token injection from localStorage via request interceptor
 *
 * All exported function NAMES and SIGNATURES are unchanged — admin pages
 * (DashboardPage, ListingsPage, UsersPage, etc.) import these directly
 * and require no modification.
 *
 * To add a new admin API call, add a new exported function at the bottom
 * of the relevant section. Do NOT call fetch() directly in this file.
 */
import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const adminApi = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
});

// Automatically attach admin Bearer token to every request.
// Token is stored in localStorage as 'admin_token' upon admin login.
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize response: unwrap .data so callers get the payload directly.
const unwrap = (promise) => promise.then((res) => res.data);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const adminLogin = (email, password) =>
  unwrap(adminApi.post('/admin/login', { email, password }));

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const fetchDashboardStats = () =>
  unwrap(adminApi.get('/admin/dashboard/stats'));

export const fetchRevenueData = (period = 'monthly') =>
  unwrap(adminApi.get('/admin/dashboard/revenue', { params: { period } }));

export const fetchUserGrowth = () =>
  unwrap(adminApi.get('/admin/dashboard/user-growth'));

// ─── Listings Management ──────────────────────────────────────────────────────
export const fetchListings = (params = {}) =>
  unwrap(adminApi.get('/admin/listings', { params }));

export const approveListing = (listingId) =>
  unwrap(adminApi.patch(`/admin/listings/${listingId}/approve`));

export const rejectListing = (listingId, reason) =>
  unwrap(adminApi.patch(`/admin/listings/${listingId}/reject`, { reason }));

export const deleteListing = (listingId) =>
  unwrap(adminApi.delete(`/admin/listings/${listingId}`));

export const fetchListingById = (listingId) =>
  unwrap(adminApi.get(`/admin/listings/${listingId}`));

export const fetchConversations = () =>
  unwrap(adminApi.get('/conversations'));

export const fetchConversationMessages = (conversationId) =>
  unwrap(adminApi.get(`/conversations/${conversationId}/messages`));

export const sendConversationMessage = (conversationId, body, attachment) => {
  const formData = new FormData();
  formData.append('body', body);
  if (attachment) formData.append('attachment', attachment);
  return unwrap(
    adminApi.post(`/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
};

// ─── User Management ──────────────────────────────────────────────────────────
export const fetchUsers = (params = {}) =>
  unwrap(adminApi.get('/admin/users', { params }));

export const fetchUserById = (userId) =>
  unwrap(adminApi.get(`/admin/users/${userId}`));

export const fetchPendingAgents = () =>
  unwrap(adminApi.get('/admin/pending-agents'));

export const banUser = (userId, reason) =>
  unwrap(adminApi.patch(`/admin/users/${userId}/ban`, { reason }));

export const unbanUser = (userId) =>
  unwrap(adminApi.patch(`/admin/users/${userId}/unban`));

export const updateUserRole = (userId, role, reason = null) =>
  unwrap(adminApi.patch(`/admin/users/${userId}/role`, { role, reason }));

// ─── Analytics ────────────────────────────────────────────────────────────────
export const fetchAnalytics = (params = {}) =>
  unwrap(adminApi.get('/admin/analytics', { params }));

export const fetchSearchHeatmap = () =>
  unwrap(adminApi.get('/admin/analytics/heatmap'));

// ─── Reports ──────────────────────────────────────────────────────────────────
export const fetchTransactionHistory = (params = {}) =>
  unwrap(adminApi.get('/admin/reports/transactions', { params }));

export const exportReport = async (type, filters = {}) => {
  const res = await adminApi.get(`/admin/reports/export/${type}`, {
    params: filters,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `thirasara-${type}-report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const fetchAuditLogs = (params = {}) =>
  unwrap(adminApi.get('/admin/audit-logs', { params }));

// ─── Settings / Configuration ─────────────────────────────────────────────────
export const fetchSettings = () =>
  unwrap(adminApi.get('/admin/settings'));

export const updateSettings = (settings) =>
  unwrap(adminApi.put('/admin/settings', settings));

// ─── Listing Boosts / Promotions ──────────────────────────────────────────────
export const fetchBoosts = () =>
  unwrap(adminApi.get('/admin/boosts'));

export const toggleBoost = (listingId, enabled) =>
  unwrap(adminApi.patch(`/admin/boosts/${listingId}`, { enabled }));

// ─── Reported Content ─────────────────────────────────────────────────────────
export const fetchReportedContent = () =>
  unwrap(adminApi.get('/admin/reported'));

export const resolveReport = (reportId, action) =>
  unwrap(adminApi.patch(`/admin/reported/${reportId}/resolve`, { action }));
