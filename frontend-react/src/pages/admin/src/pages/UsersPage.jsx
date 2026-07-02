import React, { useState, useEffect } from "react";
import { fetchUsers, banUser, unbanUser, updateUserRole } from "../api/adminApi";
import "../styles/global.css";

const MOCK_USERS = [
  { _id: "u1", name: "Chaminda Perera", email: "chaminda@mail.com", role: "Seller", status: "Active", joinDate: "2026-01-10", listings: 3, location: "Kandy" },
  { _id: "u2", name: "Nimal Silva", email: "nimal@mail.com", role: "Buyer", status: "Active", joinDate: "2026-02-05", listings: 0, location: "Colombo" },
  { _id: "u3", name: "Yasith Fernando", email: "yasith@mail.com", role: "Seller", status: "Banned", joinDate: "2025-11-20", listings: 1, location: "Gampaha" },
  { _id: "u4", name: "Priya Kumari", email: "priya@mail.com", role: "Buyer", status: "Active", joinDate: "2026-03-14", listings: 0, location: "Matara" },
  { _id: "u5", name: "Bandula Ratne", email: "bandula@mail.com", role: "Seller", status: "Active", joinDate: "2025-12-01", listings: 5, location: "Anuradhapura" },
  { _id: "u6", name: "Kavindi Jayawardena", email: "kavindi@mail.com", role: "Buyer", status: "Active", joinDate: "2026-04-02", listings: 0, location: "Negombo" },
  { _id: "u7", name: "Saman Herath", email: "saman@mail.com", role: "Seller", status: "Active", joinDate: "2026-01-25", listings: 2, location: "Badulla" },
];

const BanModal = ({ user, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="card-title">Ban User</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16 }}>
          Ban <strong style={{ color: "var(--text-primary)" }}>{user?.name}</strong> ({user?.email})?
          This will restrict their access immediately.
        </p>
        <div className="form-group">
          <label htmlFor="sn0ahd" className="form-label">Reason for Ban</label>
          <textarea aria-label="Accessible interactive control"
            className="form-control"
            rows={3}
            placeholder="State the reason for banning this user…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
          >
            Ban User
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [banTarget, setBanTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchUsers({ role: roleFilter !== "all" ? roleFilter : undefined })
      .then((d) => { if (d?.users?.length) setUsers(d.users); })
      .catch(() => {});
  }, [roleFilter]);

  const handleBan = async (reason) => {
    const id = banTarget._id;
    try {
      await banUser(id, reason);
      setUsers((p) => p.map((u) => (u._id === id ? { ...u, status: "Banned" } : u)));
      showToast(`${banTarget.name} has been banned.`);
    } catch {
      showToast("Failed to ban user.", "error");
    } finally {
      setBanTarget(null);
    }
  };

  const handleUnban = async (user) => {
    try {
      await unbanUser(user._id);
      setUsers((p) => p.map((u) => (u._id === user._id ? { ...u, status: "Active" } : u)));
      showToast(`${user.name} has been unbanned.`);
    } catch {
      showToast("Failed to unban user.", "error");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((p) => p.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      showToast("Role updated.");
    } catch {
      showToast("Failed to update role.", "error");
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter;
    const matchStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter;
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.location?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>View, manage roles, and control user access</p>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{filtered.length} users</div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <span style={{ color: "var(--text-muted)" }}>🔍</span>
          <input
            placeholder="Search by name, email, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>

        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sellers</div>
          <div className="stat-value" style={{ color: "var(--gold)" }}>
            {users.filter((u) => u.role === "Seller").length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Banned</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {users.filter((u) => u.status === "Banned").length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Location</th>
                <th>Listings</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <h3>No users found</h3>
                      <p>Try a different search or filter.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: u.status === "Banned" ? "var(--danger-dim)" : "var(--gold-dim)",
                        color: u.status === "Banned" ? "var(--danger)" : "var(--gold)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "0.85rem"
                      }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="filter-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                    >
                      <option>Buyer</option>
                      <option>Seller</option>
                    </select>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{u.location}</td>
                  <td style={{ fontSize: "0.875rem", textAlign: "center" }}>{u.listings}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{u.joinDate}</td>
                  <td>
                    <span className={`badge badge-${u.status === "Active" ? "approved" : "banned"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    {u.status === "Active" ? (
                      <button className="btn btn-danger btn-sm" onClick={() => setBanTarget(u)}>
                        🚫 Ban
                      </button>
                    ) : (
                      <button className="btn btn-success btn-sm" onClick={() => handleUnban(u)}>
                        ✓ Unban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {banTarget && (
        <BanModal user={banTarget} onConfirm={handleBan} onCancel={() => setBanTarget(null)} />
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
