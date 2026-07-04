import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/global.css";

const AdminLayout = () => (
  <div className="admin-layout">
    <Sidebar />
    <div className="main-content">
      <Topbar />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
