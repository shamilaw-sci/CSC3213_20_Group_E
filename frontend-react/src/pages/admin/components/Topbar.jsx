import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchDashboardStats } from "../api/adminApi";
import { useAdminTheme } from "../context/AdminThemeContext";
import { Bell, Search } from "lucide-react";

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
  const { isDark } = useAdminTheme();
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
    <header className={`h-20 px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 transition-colors ${isDark ? "bg-[#1e293b]/90" : "bg-white/80"}`}>
      
      {/* Left: Title */}
      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
        <p className="text-xs font-bold text-gray-500">{subtitle}</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        
        {/* Search */}
        <div className={`hidden md:flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all ${isDark ? "bg-[#0f172a]" : "bg-gray-50"}`}>
            <Search className="w-4 h-4 text-gray-400" />
            <input aria-label="Accessible interactive control" 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm text-gray-700 w-48"
            />
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* Date & System Status */}
        <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-bold text-gray-900">{now}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">System Online</span>
            </div>
        </div>

        {/* Notifications */}
        <div className="relative cursor-pointer">
            <div className={`p-2.5 text-gray-600 rounded-full transition-colors ${isDark ? "bg-[#0f172a] hover:bg-[#1e293b]" : "bg-gray-50 hover:bg-gray-100"}`}>
                <Bell className="w-5 h-5" />
            </div>
            {pendingCount > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md border-2 ${isDark ? "border-[#1e293b]" : "border-white"}`}>
                    {pendingCount}
                </span>
            )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;
