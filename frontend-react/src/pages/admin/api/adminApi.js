// Base API configuration for Thirasara Property Admin Panel
// Backend: Node.js + Express on port 5000; Go microservice on port 8080

const envUrl = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`;
const BASE_URL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─── Auth ───────────────────────────────────────────────────────────────────
export const adminLogin = (email, password) =>
  fetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export const fetchDashboardStats = () =>
  fetch(`${BASE_URL}/admin/dashboard/stats`, { headers: getHeaders() }).then(handleResponse);

export const fetchRevenueData = (period = "monthly") =>
  fetch(`${BASE_URL}/admin/dashboard/revenue?period=${period}`, { headers: getHeaders() }).then(handleResponse);

export const fetchUserGrowth = () =>
  fetch(`${BASE_URL}/admin/dashboard/user-growth`, { headers: getHeaders() }).then(handleResponse);

// ─── Listings Management (FR-REQ-5.6, ADM-001, ADM-002) ─────────────────────
export const fetchListings = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return fetch(`${BASE_URL}/admin/listings?${query}`, { headers: getHeaders() }).then(handleResponse);
};

export const approveListing = (listingId) =>
  fetch(`${BASE_URL}/admin/listings/${listingId}/approve`, {
    method: "PATCH",
    headers: getHeaders(),
  }).then(handleResponse);

export const rejectListing = (listingId, reason) =>
  fetch(`${BASE_URL}/admin/listings/${listingId}/reject`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  }).then(handleResponse);

export const deleteListing = (listingId) =>
  fetch(`${BASE_URL}/admin/listings/${listingId}`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then(handleResponse);

export const fetchListingById = (listingId) =>
  fetch(`${BASE_URL}/admin/listings/${listingId}`, { headers: getHeaders() }).then(handleResponse);

export const fetchConversations = () =>
  fetch(`${BASE_URL}/conversations`, { headers: getHeaders() }).then(handleResponse);

export const fetchConversationMessages = (conversationId) =>
  fetch(`${BASE_URL}/conversations/${conversationId}/messages`, { headers: getHeaders() }).then(handleResponse);

export const sendConversationMessage = (conversationId, body, attachment) => {
  const formData = new FormData();
  formData.append("body", body);
  if (attachment) formData.append("attachment", attachment);

  return fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}` },
    body: formData,
  }).then(handleResponse);
};

// ─── User Management (ADM-003, ADM-004) ─────────────────────────────────────
export const fetchUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/users?${query}`, { headers: getHeaders() }).then(handleResponse);
};

export const fetchUserById = (userId) =>
  fetch(`${BASE_URL}/admin/users/${userId}`, { headers: getHeaders() }).then(handleResponse);

export const fetchPendingAgents = () =>
  fetch(`${BASE_URL}/admin/pending-agents`, { headers: getHeaders() }).then(handleResponse);

export const banUser = (userId, reason) =>
  fetch(`${BASE_URL}/admin/users/${userId}/ban`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  }).then(handleResponse);

export const unbanUser = (userId) =>
  fetch(`${BASE_URL}/admin/users/${userId}/unban`, {
    method: "PATCH",
    headers: getHeaders(),
  }).then(handleResponse);

export const updateUserRole = (userId, role, reason = null) =>
  fetch(`${BASE_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ role, reason }),
  }).then(handleResponse);

// ─── Analytics (FR-REQ-5.7, ADM-006) ────────────────────────────────────────
export const fetchAnalytics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/analytics?${query}`, { headers: getHeaders() }).then(handleResponse);
};

export const fetchSearchHeatmap = () =>
  fetch(`${BASE_URL}/admin/analytics/heatmap`, { headers: getHeaders() }).then(handleResponse);

// ─── Reports (ADM-005, ADM-012) ──────────────────────────────────────────────
export const fetchTransactionHistory = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/reports/transactions?${query}`, { headers: getHeaders() }).then(handleResponse);
};

export const exportReport = async (type, filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/admin/reports/export/${type}?${query}`, {
    headers: { ...getHeaders(), Accept: "application/octet-stream" },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thirasara-${type}-report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ─── Audit Logs (ADM-008, SEC-010) ───────────────────────────────────────────
export const fetchAuditLogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/admin/audit-logs?${query}`, { headers: getHeaders() }).then(handleResponse);
};

// ─── Settings / Configuration (ADM-007) ──────────────────────────────────────
export const fetchSettings = () =>
  fetch(`${BASE_URL}/admin/settings`, { headers: getHeaders() }).then(handleResponse);

export const updateSettings = (settings) =>
  fetch(`${BASE_URL}/admin/settings`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(settings),
  }).then(handleResponse);

// ─── Listing Boosts / Promotions (ADM-010) ───────────────────────────────────
export const fetchBoosts = () =>
  fetch(`${BASE_URL}/admin/boosts`, { headers: getHeaders() }).then(handleResponse);

export const toggleBoost = (listingId, enabled) =>
  fetch(`${BASE_URL}/admin/boosts/${listingId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ enabled }),
  }).then(handleResponse);

// ─── Reported Content (ADM-011) ───────────────────────────────────────────────
export const fetchReportedContent = () =>
  fetch(`${BASE_URL}/admin/reported`, { headers: getHeaders() }).then(handleResponse);

export const resolveReport = (reportId, action) =>
  fetch(`${BASE_URL}/admin/reported/${reportId}/resolve`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ action }),
  }).then(handleResponse);
