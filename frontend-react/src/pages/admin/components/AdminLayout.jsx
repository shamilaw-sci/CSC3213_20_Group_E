import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/admin-global.css";
import "../styles/admin-premium.css";

const AdminLayout = () => (
  <div className="admin-workspace flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
    <Sidebar />
    <div className="admin-workspace-body flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden relative bg-slate-50 dark:bg-slate-950">
      <Topbar />
      <main className="admin-workspace-main p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
