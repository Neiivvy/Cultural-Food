import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/authService';
import './Login.css';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData,    setFormData]    = useState({ email: '', password: '' });
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState('');
  const [loading,     setLoading]     = useState(false);

  const validate = (data) => {
    const e = {};
    if (!data.email.trim())
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      e.email = 'Enter a valid email address';
    if (!data.password)
      e.password = 'Password is required';
    else if (data.password.length < 6)
      e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const errs = validate(formData);
    if (errs[name]) setErrors(prev => ({ ...prev, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(formData);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setServerError('');
    try {
      const result  = await loginUser({ email: formData.email, password: formData.password });
      const payload = result.data?.data;
      if (!payload?.token) {
        setServerError('Invalid email or password.');
        return;
      }
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user',  JSON.stringify(payload.user));

      // ── Redirect to intended page if user was sent here mid-flow ──
      const redirect = sessionStorage.getItem('redirectAfterAuth');
      if (redirect) {
        sessionStorage.removeItem('redirectAfterAuth');
        navigate(redirect);
      } else {
      const from = location.state?.from || '/homeUser';
navigate(from, { replace: true });
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrap">

        <div className="auth-brand">
          <Link to="/" className="auth-brand-link">
            <h1 className="auth-brand-title">
              <span className="brand-p">Khana</span>
              <span className="brand-s"> Sanskriti</span>
            </h1>
          </Link>
          <p className="auth-brand-sub">Welcome back! Log in to your account.</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">Login</h2>

          {serverError && (
            <div className="auth-server-error">⚠ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email Address</label>
              <input
                type="email" id="email" name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                disabled={loading}
              />
              {errors.email && <p className="auth-field-error">⚠ {errors.email}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Password</label>
              <input
                type="password" id="password" name="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password && <p className="auth-field-error">⚠ {errors.password}</p>}
            </div>

            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Sign up</Link>
          </p>
        </div>

        <div className="auth-back">
          <Link to="/" className="auth-back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}