import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchDashboardStats, fetchRoleRequests, fetchPendingAgents } from "../api/adminApi";
import { useTheme } from "../../../context/ThemeProvider";
import { Bell, Search, CheckCircle2, Clock, MessageSquare, ArrowRight, ShieldCheck, X, Sun, Moon } from "lucide-react";

const PAGE_TITLES = {
  "/admin/dashboard": { title: "Executive Dashboard", subtitle: "Live platform vitals, deed verifications & revenue analytics" },
  "/admin/listings": { title: "Listings & Spatial Moderation", subtitle: "Inspect PostGIS polygons, deeds, and approve properties" },
  "/admin/users": { title: "User & Role Management", subtitle: "Manage verified buyers, sellers, and system roles" },
  "/admin/agent-approvals": { title: "Agent Credentials & Licensing", subtitle: "Verify real estate agent credentials and approvals" },
  "/admin/analytics": { title: "Intelligence & Analytics", subtitle: "Search demand heatmaps, conversion rates & growth velocity" },
  "/admin/messages": { title: "Administrative Messaging Hub", subtitle: "Audit platform conversations, inquiries & dispute resolution" },
  "/admin/reports": { title: "Financial & Revenue Audit", subtitle: "Listing fees, transactions, and commission records" },
  "/admin/audit-logs": { title: "Security & Audit Trail", subtitle: "Immutable system activity log & security telemetry" },
  "/admin/settings": { title: "System Parameters & Config", subtitle: "Platform rules, fee structures & API integrations" },
};

const Topbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isDark, changeTheme } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);
  const [roleCount, setRoleCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const actionCount = pendingCount + roleCount + agentCount;
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef(null);

  const { title, subtitle } = PAGE_TITLES[pathname] || { title: "Admin Portal", subtitle: "Super Admin Command Center" };
  
  const now = new Date().toLocaleDateString("en-LK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loadStats = () => {
    fetchDashboardStats()
      .then((data) => setPendingCount(data.pendingApproval || 0))
      .catch(() => setPendingCount(0));
    fetchRoleRequests('pending')
      .then(data => setRoleCount(data.requests?.length || 0))
      .catch(() => {});
    fetchPendingAgents()
      .then(data => setAgentCount(data.agents?.length || 0))
      .catch(() => {});
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/listings?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleClearNotifs = () => {
    setPendingCount(0);
    setIsNotifOpen(false);
  };

  const toggleTheme = () => {
    changeTheme(isDark ? "light" : "dark");
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      
      {/* Left: Title & Subtitle */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 sm:gap-5">
        
        {/* Global Admin Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings, users..." 
                className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-900 dark:text-white w-48 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
        </form>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        {/* Date & Live System Status */}
        <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{now}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">System Online</span>
            </div>
        </div>

        {/* Quick Theme Toggle Button */}
        <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl transition-all duration-200 cursor-pointer border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {/* Interactive Notification Center */}
        <div className="relative" ref={notifRef}>
            <button
                type="button"
                onClick={() => { loadStats(); setIsNotifOpen(!isNotifOpen); }}
                className={`p-2.5 rounded-2xl transition-all duration-200 cursor-pointer relative border ${
                    isNotifOpen 
                        ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/50 ring-2 ring-blue-500/30' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {actionCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center rounded-full shadow-md border-2 border-white dark:border-slate-900 animate-pulse">
                        {actionCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown Popover */}
            {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Popover Header */}
                    <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Admin Queue & Alerts</h4>
                            {actionCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                    {actionCount} Action{actionCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsNotifOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Notification Items List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
                        {agentCount > 0 && (
                            <button type="button" className="w-full p-3.5 text-left rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 text-sm font-bold text-blue-600 dark:text-blue-400"
                                onClick={() => { setIsNotifOpen(false); navigate('/admin/agent-approvals'); }}>
                                {agentCount} agent application{agentCount === 1 ? '' : 's'} awaiting review
                            </button>
                        )}
                        {roleCount > 0 && (
                            <button type="button" className="w-full p-3.5 text-left rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 text-sm font-bold text-amber-600 dark:text-amber-400"
                                onClick={() => { setIsNotifOpen(false); navigate('/admin/users?section=requests'); }}>
                                {roleCount} seller upgrade request{roleCount === 1 ? '' : 's'} awaiting review
                            </button>
                        )}
                        
                        {/* 1. Pending Property Approvals */}
                        {pendingCount > 0 ? (
                            <div 
                                onClick={() => {
                                    setIsNotifOpen(false);
                                    navigate("/admin/listings?status=pending");
                                }}
                                className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition cursor-pointer flex gap-3 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">Deed Review Required</span>
                                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">Action Required</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5 line-clamp-1">
                                        {pendingCount} properties are awaiting deed & boundary verification.
                                    </p>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1.5 group-hover:translate-x-0.5 transition-transform">
                                        <span>Inspect & Approve</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">All Properties Moderated</span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        No pending listings waiting for verification.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 2. System Security Check */}
                        <div 
                            onClick={() => {
                                setIsNotifOpen(false);
                                navigate("/admin/audit-logs");
                            }}
                            className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition cursor-pointer flex gap-3 group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Security & Audit Health</span>
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">Verified</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                                    RBAC guards, JWT protection, and immutable logs active.
                                </p>
                            </div>
                        </div>

                        {/* 3. Communication Hub */}
                        <div 
                            onClick={() => {
                                setIsNotifOpen(false);
                                navigate("/admin/messages");
                            }}
                            className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition cursor-pointer flex gap-3 group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Inquiries & Messages</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                                    Monitor conversations between buyers and sellers.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Popover Footer */}
                    <div className="p-3 px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
                        <button
                            type="button"
                            onClick={handleClearNotifs}
                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                            Mark all as read
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsNotifOpen(false);
                                navigate("/admin/listings");
                            }}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                            View All Queue &rarr;
                        </button>
                    </div>

                </div>
            )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;
