import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchDashboardStats } from "../api/adminApi";
import "../styles/admin-topbar.css";

const PAGE_TITLES = {
  "/admin/dashboard": { title: "Dashboard", subtitle: "Welcome back, here's what's happening" },
  "/admin/listings": { title: "Listings", subtitle: "Manage and moderate property listings" },
  "/admin/users": { title: "Users", subtitle: "Manage registered buyers and sellers" },
  "/admin/analytics": { title: "Analytics", subtitle: "Search trends, heatmaps & engagement" },
  "/admin/messages": { title: "Messages", subtitle: "Reply to buyer, seller, and support chats" },
  "/admin/reports": { title: "Reports", subtitle: "Financial & transaction history" },
  "/admin/audit-logs": { title: "Audit Logs", subtitle: "System-wide action trail" },
  "/admin/settings": { title: "Settings", subtitle: "Platform configuration & parameters" },
};

const Topbar = () => {
  const { pathname } = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const { title, subtitle } = PAGE_TITLES[pathname] || { title: "Admin Panel", subtitle: "" };
  const now = new Date().toLocaleDateString("en-LK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchDashboardStats()
      .then((stats) => setPendingCount(stats.pendingApproval || 0))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <h2 className="admin-topbar-title">{title}</h2>
        <p className="admin-topbar-sub">{subtitle}</p>
      </div>
      <div className="admin-topbar-right">
        <span className="admin-topbar-date">{now}</span>
        <div className="admin-topbar-divider" />
        <div className="admin-system-badge">
          <span className="admin-system-dot" />
          System Online
        </div>
        {pendingCount > 0 && (
          <a href="/admin/listings" className="admin-system-badge" style={{ color: "var(--admin-warning)" }}>
            {pendingCount} Property to approval
          </a>
        )}
      </div>
    </header>
  );
};

export default Topbar;
