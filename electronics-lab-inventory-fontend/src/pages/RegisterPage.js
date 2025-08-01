// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MdPersonAdd, 
  MdEmail, 
  MdLock, 
  MdVisibility, 
  MdVisibilityOff,
  MdCheckCircle,
  MdError,
  MdArrowForward,
  MdScience
} from 'react-icons/md';
import api from '../utils/api';
import './RegisterPage.css';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/auth/register', {
        name,
        email,
        password
      });

      if (res.data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred during registration.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 25, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { strength: 50, label: 'Fair', color: '#f59e0b' };
    if (score <= 5) return { strength: 75, label: 'Good', color: '#3b82f6' };
    return { strength: 100, label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="register-container">
      <div className="register-background">
        <div className="bg-pattern"></div>
        <div className="bg-gradient"></div>
      </div>
      
      <div className="register-wrapper">
        <div className="register-content">
          {/* Left side - Register Form */}
          <div className="register-section">
            <div className="register-card">
              {/* Header */}
              <div className="register-header">
                <div className="logo-section">
                  <div className="logo-icon">
                    <MdScience />
                  </div>
                  <div className="logo-text">
                    <h1>ElectroFlow</h1>
                    <p>Laboratory Information Management System</p>
                  </div>
                </div>
                <div className="register-title">
                  <h2>Create Account</h2>
                  <p>Join our laboratory management platform</p>
                </div>
              </div>

              {/* Alert Messages */}
              {error && (
                <div className="alert alert-error">
                  <MdError />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <MdCheckCircle />
                  <span>{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <MdPersonAdd className="input-icon" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Create a strong password"
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
                  {password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill" 
                          style={{ width: `${passwordStrength.strength}%`, backgroundColor: passwordStrength.color }}
                        ></div>
                      </div>
                      <span className="strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <MdLock className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <span className="field-error">Passwords do not match</span>
                  )}
                </div>

                <button type="submit" className="register-button" disabled={isLoading}>
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <MdArrowForward />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="register-footer">
                <p>Already have an account? <Link to="/login">Sign in here</Link></p>
                <div className="terms-text">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </div>
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

export default RegisterPage;
