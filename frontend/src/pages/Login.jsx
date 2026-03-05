import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setServerError('');
    try {
      const result = await loginUser({ email: formData.email, password: formData.password });
      // Support both response shapes: result.data.token OR result.data.data.token
      const payload = result.data.data ?? result.data;
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      navigate('/homeUser');        // ← matches App.jsx route
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="brand-section">
          <Link to="/" className="brand-link">
            <h1 className="brand-title">
              <span className="brand-primary">Khana</span>{' '}
              <span className="brand-secondary">Sanskriti</span>
            </h1>
          </Link>
          <p className="brand-subtitle">Welcome back! Please login to your account.</p>
        </div>

        <div className="form-card">
          <h2 className="form-title">Login</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            {serverError && <div className="server-error-banner">{serverError}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="your@email.com" disabled={loading}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password" id="password" name="password"
                value={formData.password} onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••" disabled={loading}
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" />
                <span className="checkbox-text">Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          <p className="footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="footer-link">Sign up</Link>
          </p>
        </div>

        <div className="back-home">
          <Link to="/" className="back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;