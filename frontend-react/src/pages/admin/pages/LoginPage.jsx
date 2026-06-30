import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminLogin } from "../api/adminApi";
import "../styles/admin-global.css";
import "../styles/admin-login.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      login(data.token, data.admin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg">
        <div className="admin-login-bg-grid" />
      </div>

      <div className="admin-login-card">
        {/* Brand */}
        <div className="admin-login-brand">
          <div className="admin-login-brand-icon">T</div>
          <div>
            <h1 className="admin-login-brand-name">Thirasara Property</h1>
            <p className="admin-login-brand-sub">Admin Control Panel</p>
          </div>
        </div>

        <div className="admin-login-divider" />

        <h2 className="admin-login-heading">Sign In</h2>
        <p className="admin-login-desc">Enter your administrator credentials to continue.</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Email Address</label>
            <input
              type="email"
              className="admin-form-control"
              placeholder="admin@thirasara.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <input
              type="password"
              className="admin-form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <button type="submit" className="admin-btn admin-btn-primary admin-btn-lg admin-login-submit" disabled={loading}>
            {loading ? <span className="admin-spinner" /> : null}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="admin-login-note">
          Administrator access only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
