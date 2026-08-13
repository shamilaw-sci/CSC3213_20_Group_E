import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAdminTheme } from "../context/AdminThemeContext";
import "../styles/admin-global.css";

const AdminLayout = () => {
  const { isDark } = useAdminTheme();

  return (
    <div className={`flex min-h-screen font-sans text-gray-900 transition-colors ${isDark ? "dark bg-[#0f172a] text-gray-100" : "bg-white"}`}>
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden relative">
        <Topbar />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
