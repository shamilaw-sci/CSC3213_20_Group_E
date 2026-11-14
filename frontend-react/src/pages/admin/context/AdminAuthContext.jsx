import { logClientError } from '../../../utils/clientLog';
import React, { createContext, useState, useEffect, useContext } from "react";
import { Outlet } from "react-router-dom";
import { verifyAdminSession, adminLogout } from "../api/adminApi";

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
            logClientError('admin_profile_cache_write_failed');
          }
        }
      } catch (err) {
        logClientError('admin_session_verification_failed');
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
      logClientError('admin_login_cache_write_failed');
    }
    setAdmin(adminData);
  };

  const logout = async () => {
    // Keep the session visible if the server could not clear its HttpOnly cookie.
    await adminLogout();
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
