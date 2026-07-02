import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchDashboardStats } from "../api/adminApi";
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
    <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
      
      {/* Left: Title */}
      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
        <p className="text-xs font-bold text-gray-500">{subtitle}</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input aria-label="Accessible interactive control" aria-label="Accessible interactive control" 
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
            <div className="p-2.5 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
            </div>
            {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md border-2 border-white">
                    {pendingCount}
                </span>
            )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;
