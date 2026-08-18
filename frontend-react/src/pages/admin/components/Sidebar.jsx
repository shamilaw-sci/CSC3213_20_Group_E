import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { 
  LayoutDashboard, 
  List, 
  Users, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  ShieldAlert, 
  Settings,
  LogOut
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/listings", icon: List, label: "Listings" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/agent-approvals", icon: Users, label: "Agent Approvals" },
  { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/admin/messages", icon: MessageSquare, label: "Messages" },
  { path: "/admin/reports", icon: FileText, label: "Reports" },
  { path: "/admin/audit-logs", icon: ShieldAlert, label: "Audit Logs" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

const Sidebar = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed top-0 left-0 z-50">
      
      {/* Brand */}
      <div className="h-20 px-6 flex items-center border-b border-gray-100">
        <img
          src="/logo.jpeg"
          alt="Thirasara Property logo"
          className="w-10 h-10 object-cover rounded-xl shadow-md mr-3"
        />
        <div className="flex flex-col">
          <span className="font-black text-gray-900 tracking-tight leading-tight">Thirasara</span>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 px-2">Main Menu</span>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm
              ${isActive 
                ? "bg-blue-50 text-blue-700" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {admin?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block font-bold text-gray-900 text-sm truncate">{admin?.name || "Administrator"}</span>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Super Admin</span>
          </div>
          <button aria-label="Accessible interactive control" type="button" 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" 
            onClick={handleLogout} 
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
