import React, { createContext, useState, useEffect, useContext } from "react";
import { Outlet } from "react-router-dom";
import { verifyAdminSession } from "../api/adminApi";

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
};

export const AdminAuthProvider = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminSession = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        if (isMounted) {
          setAdmin(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Verify token against backend database (prevents client-side localStorage spoofing)
        const res = await verifyAdminSession();
        if (isMounted && res && res.valid) {
          setAdmin(res.admin);
          try {
            localStorage.setItem("admin_data", JSON.stringify(res.admin));
          } catch (e) {
            console.error("Storage error:", e);
          }
        }
      } catch (err) {
        console.error("Admin session verification failed:", err.message || err);
        // Clean up invalid or expired credentials
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_data");
        if (isMounted) {
          setAdmin(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (token, adminData) => {
    localStorage.setItem("admin_token", token);
    try {
      localStorage.setItem("admin_data", JSON.stringify(adminData));
    } catch (e) {
      console.error("Storage write error:", e);
    }
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, loading, login, logout }}>
      <Outlet />
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
