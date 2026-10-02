import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchUsers, banUser, unbanUser, updateUserRole, fetchRoleRequests, approveRoleRequest, rejectRoleRequest } from "../api/adminApi";
import "../styles/admin-global.css";
import { 
  Users, Search, ShieldCheck, ShieldAlert, UserX, UserCheck, Mail, Calendar, Shield, X, AlertTriangle, ArrowUpRight, CheckCircle, XCircle
} from "lucide-react";

const BanModal = ({ user, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal max-w-md">
        <div className="admin-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="admin-card-title">Restrict User Access</h3>
          </div>
          <button type="button" className="admin-modal-close" onClick={onCancel}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-300 mb-4">
          Ban <strong className="text-white">{user?.name}</strong> ({user?.email})? This will immediately revoke their JWT credentials and terminate active sessions.
        </p>
        <div className="admin-form-group">
          <label className="admin-form-label">Ban Reason</label>
          <textarea
            className="admin-form-control"
            rows={3}
            placeholder="e.g. Fraudulent listing attempts, policy violation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
          >
            Confirm Ban
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [banTarget, setBanTarget] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [activeSection, setActiveSection] = useState("users");
  const [roleRequests, setRoleRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [roleChangeSelections, setRoleChangeSelections] = useState({});
  const [roleChanging, setRoleChanging] = useState({});

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadUsers = () => {
    fetchUsers({ role: roleFilter !== "all" ? roleFilter : undefined })
      .then((d) => { if (d?.users) setUsers(d.users); })
      .catch((err) => { toast.error("Failed to load users"); console.error(err); });
  };

  const loadRoleRequests = () => {
    setRequestsLoading(true);
    fetchRoleRequests("pending")
      .then((d) => setRoleRequests(d?.requests || []))
      .catch(() => showToast("Failed to load role requests", "error"))
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);
  useEffect(() => { if (activeSection === "requests") loadRoleRequests(); }, [activeSection]);

  const handleBan = async (reason) => {
    if (!banTarget) return;
    try {
      await banUser(banTarget.id, reason);
      setUsers((prev) => prev.map((u) => (u.id === banTarget.id ? { ...u, is_banned: true, status: "Banned" } : u)));
      setBanTarget(null);
      showToast("User banned successfully.");
    } catch { showToast("Failed to ban user.", "error"); }
  };

  const handleUnban = async (id) => {
    try {
      await unbanUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_banned: false, status: "Active" } : u)));
      showToast("User access restored.");
    } catch { showToast("Failed to restore user access.", "error"); }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!newRole) return;
    setRoleChanging((prev) => ({ ...prev, [userId]: true }));
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setRoleChangeSelections((prev) => ({ ...prev, [userId]: "" }));
      showToast(`Role updated to ${newRole} successfully.`);
    } catch { showToast("Failed to update role.", "error"); }
    finally { setRoleChanging((prev) => ({ ...prev, [userId]: false })); }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await approveRoleRequest(requestId);
      setRoleRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast("Role request approved. User is now a Seller.");
    } catch { showToast("Failed to approve request.", "error"); }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectRoleRequest(requestId);
      setRoleRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast("Role request rejected.");
    } catch { showToast("Failed to reject request.", "error"); }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toastMsg.type}`}><span>{toastMsg.msg}</span></div>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1>User &amp; Role Management</h1>
          <p>Oversee registered accounts, verify credentials, and manage role-based permissions</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex-wrap">
          {[
            { id: "all", label: "All Users" },
            { id: "BUYER", label: "Buyers" },
            { id: "SELLER", label: "Sellers" },
            { id: "AGENT", label: "Agents" },
            { id: "ADMIN", label: "Admins" },
          ].map((tab) => (
            <button key={tab.id} type="button"
              onClick={() => { setRoleFilter(tab.id); setActiveSection("users"); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeSection === "users" && roleFilter === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >{tab.label}</button>
          ))}
          <button type="button" onClick={() => setActiveSection("requests")}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === "requests" ? "bg-amber-500 text-white shadow-md" : "text-amber-400 border border-amber-500/30 hover:bg-amber-500/10"
            }`}
          >
            <ArrowUpRight className="w-3 h-3" /> Role Requests
            {roleRequests.length > 0 && activeSection !== "requests" && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">{roleRequests.length}</span>
            )}
          </button>
        </div>
      </div>

      {activeSection === "users" && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="admin-search-bar w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input type="text" placeholder="Search by name, email or role..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Users: {filteredUsers.length}</span>
          </div>

          <div className="admin-data-table-wrap">
            <table className="admin-data-table">
              <thead><tr><th>User Account</th><th>System Role</th><th>Status</th><th>Joined Date</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {filteredUsers.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">No users found.</td></tr>}
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm">{u.name?.[0]?.toUpperCase() || "U"}</div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /><span>{u.email}</span></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30' :
                        u.role === 'AGENT' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' :
                        u.role === 'SELLER' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent'
                      }`}>{u.role}</span>
                    </td>
                    <td><span className={`admin-badge ${u.is_banned ? 'admin-badge-banned' : 'admin-badge-active'}`}>{u.is_banned ? 'Banned' : 'Active'}</span></td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{u.created_at ? new Date(u.created_at).toLocaleDateString('en-LK') : '-'}</td>
                    <td className="text-right">
                      {u.role !== 'ADMIN' && (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {!u.is_banned && (
                            <div className="flex items-center gap-1">
                              <select value={roleChangeSelections[u.id] || ''}
                                onChange={(e) => setRoleChangeSelections((prev) => ({ ...prev, [u.id]: e.target.value }))}
                                className="text-xs bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:border-blue-500">
                                <option value="">Change Role...</option>
                                {['BUYER','SELLER'].filter(r => r !== u.role).map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                              {roleChangeSelections[u.id] && (
                                <button type="button" disabled={roleChanging[u.id]}
                                  onClick={() => handleRoleChange(u.id, roleChangeSelections[u.id])}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer">
                                  {roleChanging[u.id] ? '...' : 'Apply'}
                                </button>
                              )}
                            </div>
                          )}
                          {u.is_banned ? (
                            <button type="button" onClick={() => handleUnban(u.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition font-bold text-xs cursor-pointer">Unban</button>
                          ) : (
                            <button type="button" onClick={() => setBanTarget(u)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-600 hover:text-white transition font-bold text-xs cursor-pointer">Ban</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeSection === "requests" && (
        <div className="admin-card">
          <div className="admin-card-header mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
              <h3 className="admin-card-title">Pending Role Upgrade Requests</h3>
            </div>
            <span className="text-xs text-slate-400">Buyers requesting to become Sellers</span>
          </div>
          {requestsLoading && <div className="text-center py-10 text-slate-400 text-sm">Loading requests...</div>}
          {!requestsLoading && roleRequests.length === 0 && (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">No pending role upgrade requests.</div>
          )}
          {!requestsLoading && roleRequests.length > 0 && (
            <div className="space-y-3">
              {roleRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">{req.user?.name?.[0]?.toUpperCase() || "U"}</div>
                    <div>
                      <div className="font-bold text-white text-sm">{req.user?.name}</div>
                      <div className="text-xs text-slate-400">{req.user?.email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Current: <span className="text-slate-300 font-semibold">{req.user?.role}</span>
                        {" \u2192 "}
                        Requested: <span className="text-amber-400 font-semibold">{req.requested_role}</span>
                        {" \u00B7 "}
                        {new Date(req.created_at).toLocaleDateString("en-LK")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleApproveRequest(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition font-bold text-xs cursor-pointer">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button type="button" onClick={() => handleRejectRequest(req.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-600 hover:text-white transition font-bold text-xs cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {banTarget && <BanModal user={banTarget} onConfirm={handleBan} onCancel={() => setBanTarget(null)} />}
    </div>
  );
};

export default UsersPage;
