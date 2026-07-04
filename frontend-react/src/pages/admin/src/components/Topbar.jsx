import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/Topbar.css";

const PAGE_TITLES = {
  "/dashboard":  { title: "Dashboard",   subtitle: "Welcome back, here's what's happening" },
  "/listings":   { title: "Listings",    subtitle: "Manage and moderate property listings" },
  "/users":      { title: "Users",       subtitle: "Manage registered buyers and sellers" },
  "/analytics":  { title: "Analytics",   subtitle: "Search trends, heatmaps & engagement" },
  "/reports":    { title: "Reports",     subtitle: "Financial & transaction history" },
  "/audit-logs": { title: "Audit Logs",  subtitle: "System-wide action trail" },
  "/settings":   { title: "Settings",    subtitle: "Platform configuration & parameters" },
};

const Topbar = () => {
  const { pathname } = useLocation();
  const { title, subtitle } = PAGE_TITLES[pathname] || { title: "Admin Panel", subtitle: "" };
  const now = new Date().toLocaleDateString("en-LK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{title}</h2>
        <p className="topbar-sub">{subtitle}</p>
      </div>
      <div className="topbar-right">
        <span className="topbar-date">{now}</span>
        <div className="topbar-divider" />
        <div className="system-badge">
          <span className="system-dot" />
          System Online
        </div>
      </div>
    </header>
  );
};

export default Topbar;
