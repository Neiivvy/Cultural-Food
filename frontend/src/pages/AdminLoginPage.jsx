import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/foodService";
import "./AdminLoginPage.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Both fields are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await adminLogin(email.trim(), password);
      const { token, user } = res.data.data;
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser",  JSON.stringify(user));
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alog-page">
      <div className="alog-card">
        <div className="alog-brand">
          <span className="alog-brand-k">Khana</span>
          <span className="alog-brand-s"> Sanskriti</span>
        </div>
        <h1 className="alog-title">Admin Panel</h1>
        <p  className="alog-sub">Sign in with your admin credentials</p>

        {error && <div className="alog-error">⚠ {error}</div>}

        <form className="alog-form" onSubmit={handleSubmit} noValidate>
          <div className="alog-field">
            <label className="alog-label">Email</label>
            <input
              type="email" className="alog-input"
              placeholder="admin@example.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
              autoFocus
            />
          </div>
          <div className="alog-field">
            <label className="alog-label">Password</label>
            <input
              type="password" className="alog-input"
              placeholder="••••••••"
              value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
            />
          </div>
          <button type="submit" className="alog-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}