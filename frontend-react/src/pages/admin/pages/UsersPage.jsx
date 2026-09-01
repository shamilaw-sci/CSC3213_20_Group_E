import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchUsers, banUser, unbanUser, updateUserRole } from "../api/adminApi";
import "../styles/admin-global.css";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  Mail, 
  Calendar, 
  Shield, 
  X,
  AlertTriangle 
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

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadUsers = () => {
    fetchUsers({ role: roleFilter !== "all" ? roleFilter : undefined })
      .then((d) => { if (d?.users) setUsers(d.users); })
      .catch((err) => { toast.error("Failed to load users"); console.error(err); });
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleBan = async (reason) => {
    if (!banTarget) return;
    try {
      await banUser(banTarget.id, reason);
      setUsers((prev) =>
        prev.map((u) => (u.id === banTarget.id ? { ...u, is_banned: true, status: "Banned" } : u))
      );
      setBanTarget(null);
      showToast("User banned successfully.");
    } catch {
      showToast("Failed to ban user.", "error");
    }
  };

  const handleUnban = async (id) => {
    try {
      await unbanUser(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_banned: false, status: "Active" } : u))
      );
      showToast("User access restored.");
    } catch {
      showToast("Failed to restore user access.", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="admin-toast-container">
          <div className={`admin-toast ${toastMsg.type}`}>
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>User & Role Management</h1>
          <p>Oversee registered accounts, verify credentials, and manage role-based permissions</p>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          {[
            { id: "all", label: "All Users" },
            { id: "BUYER", label: "Buyers" },
            { id: "SELLER", label: "Sellers" },
            { id: "AGENT", label: "Agents" },
            { id: "ADMIN", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                roleFilter === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="admin-search-bar w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          Total Users: {filteredUsers.length}
        </span>
      </div>

      {/* Data Table */}
      <div className="admin-data-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>User Account</th>
              <th>System Role</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  No users found.
                </td>
              </tr>
            )}
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm">
                      {u.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                    u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    u.role === 'AGENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    u.role === 'SELLER' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`admin-badge ${u.is_banned ? 'admin-badge-banned' : 'admin-badge-active'}`}>
                    {u.is_banned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="text-xs text-slate-400">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("en-LK") : "-"}
                </td>
                <td className="text-right">
                  {u.role !== 'ADMIN' && (
                    u.is_banned ? (
                      <button
                        type="button"
                        onClick={() => handleUnban(u.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition font-bold text-xs cursor-pointer"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBanTarget(u)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-600 hover:text-white transition font-bold text-xs cursor-pointer"
                      >
                        Ban
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ban Modal */}
      {banTarget && (
        <BanModal
          user={banTarget}
          onConfirm={handleBan}
          onCancel={() => setBanTarget(null)}
        />
      )}

    </div>
  );
};

export default UsersPage;
