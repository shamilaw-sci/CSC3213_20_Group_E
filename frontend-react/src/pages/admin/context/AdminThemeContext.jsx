import React, { createContext, useState, useEffect, useContext, useCallback } from "react";

const AdminThemeContext = createContext(null);

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) throw new Error("useAdminTheme must be used inside AdminThemeProvider");
  return context;
};

export const AdminThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("admin_theme") || "system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      setIsDark(theme === "dark" || (theme === "system" && mq.matches));
    };
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [theme]);

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("admin_theme", newTheme);
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme, isDark, changeTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export default AdminThemeContext;
