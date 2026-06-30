import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Sidebar.css";

const NAV_ITEMS = [
  { path: "/dashboard",   icon: "⊞",  label: "Dashboard" },
  { path: "/listings",    icon: "🏠",  label: "Listings" },
  { path: "/users",       icon: "👥",  label: "Users" },
  { path: "/analytics",   icon: "📊",  label: "Analytics" },
  { path: "/reports",     icon: "📄",  label: "Reports" },
  { path: "/audit-logs",  icon: "📋",  label: "Audit Logs" },
  { path: "/settings",    icon: "⚙",   label: "Settings" },
];

const Sidebar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">T</div>
        <div className="brand-text">
          <span className="brand-name">Thirasara</span>
          <span className="brand-sub">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Main Menu</span>
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Admin Profile */}
      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">
            {admin?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="admin-info">
            <span className="admin-name">{admin?.name || "Administrator"}</span>
            <span className="admin-role">Super Admin</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          ⎋
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
