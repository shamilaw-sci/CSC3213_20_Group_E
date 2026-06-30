import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import "../styles/admin-sidebar.css";

const NAV_ITEMS = [
  { path: "/admin/dashboard", icon: "DB", label: "Dashboard" },
  { path: "/admin/listings", icon: "LS", label: "Listings" },
  { path: "/admin/users", icon: "US", label: "Users" },
  { path: "/admin/analytics", icon: "AN", label: "Analytics" },
  { path: "/admin/messages", icon: "MSG", label: "Messages" },
  { path: "/admin/reports", icon: "RP", label: "Reports" },
  { path: "/admin/audit-logs", icon: "AL", label: "Audit Logs" },
  { path: "/admin/settings", icon: "ST", label: "Settings" },
];

const Sidebar = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-brand-icon">T</div>
        <div className="admin-brand-text">
          <span className="admin-brand-name">Thirasara</span>
          <span className="admin-brand-sub">Admin Panel</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <span className="admin-nav-section-label">Main Menu</span>
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `admin-nav-item${isActive ? " active" : ""}`}
          >
            <span className="admin-nav-icon">{icon}</span>
            <span className="admin-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">
            {admin?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="admin-info">
            <span className="admin-name">{admin?.name || "Administrator"}</span>
            <span className="admin-role">Super Admin</span>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
          Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
