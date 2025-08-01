// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MdEmail, 
  MdLock, 
  MdVisibility, 
  MdVisibilityOff,
  MdError,
  MdArrowForward,
  MdScience
} from 'react-icons/md';
import AuthContext from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/app');
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred during login.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-pattern"></div>
        <div className="bg-gradient"></div>
      </div>
      
      <div className="login-wrapper">
        <div className="login-content">
          {/* Left side - Centered Login Card */}
          <div className="login-section">
            <div className="login-card">
              {/* Header */}
              <div className="login-header">
                <div className="logo-section">
                  <div className="logo-icon">
                    <MdScience />
                  </div>
                  <div className="logo-text">
                    <h1>ElectroFlow</h1>
                    <p>Laboratory Information Management System</p>
                  </div>
                </div>
                <div className="login-title">
                  <h2>Welcome Back</h2>
                  <p>Sign in to access your laboratory dashboard</p>
                </div>
              </div>

              {/* Alert Message */}
              {error && (
                <div className="alert alert-error">
                  <MdError />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <MdEmail className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <MdLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <label className="remember-me">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" className="login-button" disabled={isLoading}>
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <MdArrowForward />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="login-footer">
                <p>Don't have an account? <Link to="/register">Create one here</Link></p>
              </div>
            </div>
          </div>

          {/* Right side - Information Panel */}
          <div className="info-panel">
            <div className="info-content">
              <div className="welcome-icon">
                <MdScience />
              </div>
              <h3>Welcome to ElectroFlow</h3>
              <p>Your comprehensive laboratory information management solution</p>
              
              <div className="features-list">
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <div>
                    <h4>Inventory Management</h4>
                    <p>Track and manage laboratory inventory in real-time</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔬</div>
                  <div>
                    <h4>Sample Tracking</h4>
                    <p>Monitor samples throughout their lifecycle</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📈</div>
                  <div>
                    <h4>Analytics & Reports</h4>
                    <p>Generate comprehensive reports and insights</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔒</div>
                  <div>
                    <h4>Secure & Compliant</h4>
                    <p>Enterprise-grade security and compliance</p>
                  </div>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Active Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Samples Tracked</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
