import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from '../api/authService';
import './Login.css';

export default function Signup() {
  const navigate = useNavigate();
  const [formData,    setFormData]    = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState('');
  const [loading,     setLoading]     = useState(false);

  const validate = (data) => {
    const e = {};
    if (!data.name.trim())
      e.name = 'Full name is required';
    else if (data.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';

    if (!data.email.trim())
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      e.email = 'Enter a valid email address';

    if (!data.password)
      e.password = 'Password is required';
    else if (data.password.length < 6)
      e.password = 'Password must be at least 6 characters';
    else if (!/[A-Z]/.test(data.password))
      e.password = 'Password must contain at least one uppercase letter';
    else if (!/[0-9]/.test(data.password))
      e.password = 'Password must contain at least one number';

    if (!data.confirmPassword)
      e.confirmPassword = 'Please confirm your password';
    else if (data.password !== data.confirmPassword)
      e.confirmPassword = 'Passwords do not match';

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    // Re-validate confirmPassword live when password field changes
    if (name === 'password' && errors.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: value !== next.confirmPassword ? 'Passwords do not match' : ''
      }));
    }
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
      const result  = await signupUser({ name: formData.name.trim(), email: formData.email, password: formData.password });
      const payload = result.data?.data ?? result.data;
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user',  JSON.stringify(payload.user));

      // ── Redirect to intended page if user was sent here mid-flow ──
      const redirect = sessionStorage.getItem('redirectAfterAuth');
      if (redirect) {
        sessionStorage.removeItem('redirectAfterAuth');
        navigate(redirect);
      } else {
        navigate('/homeUser');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const fe = {};
        err.response.data.errors.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
      } else {
        setServerError(err.response?.data?.message || 'Signup failed. Please try again.');
      }
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
          <p className="auth-brand-sub">Create your account to join the community.</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">Sign Up</h2>

          {serverError && (
            <div className="auth-server-error">⚠ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            <div className="auth-field">
              <label htmlFor="name" className="auth-label">Full Name</label>
              <input
                type="text" id="name" name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Your full name"
                disabled={loading}
              />
              {errors.name && <p className="auth-field-error">⚠ {errors.name}</p>}
            </div>

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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password
                ? <p className="auth-field-error">⚠ {errors.password}</p>
                : <p className="auth-hint">Min 6 chars · 1 uppercase · 1 number</p>
              }
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
              <input
                type="password" id="confirmPassword" name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`auth-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.confirmPassword && <p className="auth-field-error">⚠ {errors.confirmPassword}</p>}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Login</Link>
          </p>
        </div>

        <div className="auth-back">
          <Link to="/" className="auth-back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}