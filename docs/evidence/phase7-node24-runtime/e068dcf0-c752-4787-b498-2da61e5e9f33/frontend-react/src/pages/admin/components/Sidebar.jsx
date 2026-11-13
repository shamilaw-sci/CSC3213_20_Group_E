import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { fetchDashboardStats } from "../api/adminApi";
import toast from "react-hot-toast";
import { 
  LayoutDashboard, 
  List, 
  Users, 
  UserCheck, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  ShieldAlert, 
  Settings,
  LogOut,
  Globe
} from "lucide-react";

const Sidebar = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [pendingListings, setPendingListings] = useState(0);

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => setPendingListings(data.pendingApproval || 0))
      .catch(() => setPendingListings(0));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };

  const navItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { 
      path: "/admin/listings", 
      icon: List, 
      label: "Listings",
      badge: pendingListings > 0 ? pendingListings : null,
      badgeColor: "bg-amber-500 text-slate-950 font-black"
    },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/agent-approvals", icon: UserCheck, label: "Agent Approvals" },
    { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/admin/messages", icon: MessageSquare, label: "Messages" },
    { path: "/admin/inquiries", icon: MessageSquare, label: "Inquiries" },
    { path: "/admin/reports", icon: FileText, label: "Reports" },
    { path: "/admin/audit-logs", icon: ShieldAlert, label: "Audit Logs" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/90 flex flex-col h-screen fixed top-0 left-0 z-50 shadow-md dark:shadow-2xl transition-colors duration-200">
      
      {/* Brand & Logo */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25 border border-blue-400/30">
            T
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 dark:text-white tracking-tight leading-tight text-base">Thirasara</span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Admin Console</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Executive Menu
        </div>
        
        {navItems.map(({ path, icon: Icon, label, badge, badgeColor }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-200 font-bold text-sm
              ${isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-extrabold" 
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`} />
                  <span>{label}</span>
                </div>
                {badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white text-blue-900 font-black" : badgeColor}`}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-4 px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Public Portal
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition font-bold text-sm"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-400" />
            <span>Public Website</span>
          </div>
          <span className="text-[10px] text-slate-400">↗</span>
        </a>
      </nav>

      {/* Admin Profile & Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
              {admin?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black text-slate-900 dark:text-white truncate">
                {admin?.name || "Super Admin"}
              </span>
              <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {admin?.email || "admin@thirasara.lk"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
