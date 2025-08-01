import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = ({ onNavigateToAuth }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setIsVisible(true);
  }, []);
  const handleSignIn = () => {
    navigate('/login');
  };

  const handleStartFreeTrial = () => {
    navigate('/register');
  };

  return (
    <div className="eim-landing-wrapper">
      {/* Navigation */}
      <nav className="eim-navbar">
        <div className="eim-nav-container">
          <div className="eim-brand">
            <div className="eim-brand-icon">
              <div className="eim-circuit-pattern">
                <div className="eim-circuit-dot"></div>
                <div className="eim-circuit-line"></div>
                <div className="eim-circuit-dot"></div>
              </div>
            </div>
            <span className="eim-brand-text">ElectroFlow</span>
          </div>
          <div className="eim-nav-menu">
            <a href="#features" className="eim-nav-link">Features</a>
            <a href="#solutions" className="eim-nav-link">Solutions</a>
            <a href="#pricing" className="eim-nav-link">Pricing</a>
             <button 
    className="eim-login-btn"
    onClick={handleSignIn} // Update this
  >
    Sign In
  </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="eim-hero">
        <div className="eim-hero-bg">
          <div className="eim-grid-pattern"></div>
          <div className="eim-floating-elements">
            <div className="eim-float-element eim-element-1">📊</div>
            <div className="eim-float-element eim-element-2">⚡</div>
            <div className="eim-float-element eim-element-3">🔧</div>
            <div className="eim-float-element eim-element-4">📈</div>
            <div className="eim-float-element eim-element-5">💾</div>
          </div>
        </div>
        <div className="eim-hero-container">
          <div className={`eim-hero-content ${isVisible ? 'eim-fade-in' : ''}`}>
            <div className="eim-hero-badge">
              <span className="eim-badge-dot"></span>
              Next-Gen Inventory Management
            </div>
            <h1 className="eim-hero-title">
              Streamline Your
              <span className="eim-text-gradient"> Electronics Inventory</span>
              <br />Like Never Before
            </h1>
            <p className="eim-hero-subtitle">
              Transform your electronics lab with AI-powered inventory tracking, 
              smart analytics, and seamless workflow automation. Reduce waste, 
              optimize stock levels, and accelerate your projects.
            </p>
            <div className="eim-hero-actions">
              <button 
    className="eim-cta-primary"
    onClick={handleStartFreeTrial} // Update this
  >
    <span className="eim-btn-text">Start Free Trial</span>
    <div className="eim-btn-shine"></div>
  </button>
              <button className="eim-cta-secondary">
                <span className="eim-play-icon">▶</span>
                Watch Demo
              </button>
            </div>
            <div className="eim-hero-social-proof">
              <span className="eim-proof-text">Trusted by 500+ electronics labs worldwide</span>
              <div className="eim-trust-badges">
                <div className="eim-trust-badge">ISO 9001</div>
                <div className="eim-trust-badge">GDPR</div>
                <div className="eim-trust-badge">SOC 2</div>
              </div>
            </div>
          </div>
          <div className={`eim-hero-visual ${isVisible ? 'eim-slide-in' : ''}`}>
            <div className="eim-dashboard-mockup">
              <div className="eim-mockup-header">
                <div className="eim-mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="eim-mockup-title">ElectroFlow Dashboard</div>
              </div>
              <div className="eim-mockup-content">
                <div className="eim-stats-row">
                  <div className="eim-stat-card">
                    <div className="eim-stat-icon">📦</div>
                    <div className="eim-stat-value">2,847</div>
                    <div className="eim-stat-label">Components</div>
                  </div>
                  <div className="eim-stat-card">
                    <div className="eim-stat-icon">⚠️</div>
                    <div className="eim-stat-value">23</div>
                    <div className="eim-stat-label">Low Stock</div>
                  </div>
                  <div className="eim-stat-card">
                    <div className="eim-stat-icon">📈</div>
                    <div className="eim-stat-value">94%</div>
                    <div className="eim-stat-label">Efficiency</div>
                  </div>
                </div>
                <div className="eim-chart-area">
                  <div className="eim-chart-bars">
                    <div className="eim-bar" style={{height: '60%'}}></div>
                    <div className="eim-bar" style={{height: '80%'}}></div>
                    <div className="eim-bar" style={{height: '45%'}}></div>
                    <div className="eim-bar" style={{height: '90%'}}></div>
                    <div className="eim-bar" style={{height: '70%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="eim-features">
        <div className="eim-container">
          <div className="eim-section-header">
            <div className="eim-section-badge">
              <span className="eim-badge-icon">✨</span>
              Features
            </div>
            <h2 className="eim-section-title">Everything You Need to Manage Your Inventory</h2>
            <p className="eim-section-desc">
              Powerful tools designed specifically for electronics laboratories and research facilities
            </p>
          </div>
          
          <div className="eim-features-grid">
            <div className="eim-feature-card">
              <div className="eim-feature-header">
                <div className="eim-feature-icon">
                  <span>🎯</span>
                  <div className="eim-icon-pulse"></div>
                </div>
                <h3>Smart Tracking</h3>
              </div>
              <p>Real-time component tracking with barcode scanning, automated alerts, and intelligent stock predictions powered by machine learning.</p>
              <div className="eim-feature-highlights">
                <span className="eim-highlight">• Barcode Integration</span>
                <span className="eim-highlight">• Predictive Analytics</span>
                <span className="eim-highlight">• Auto Reordering</span>
              </div>
            </div>

            <div className="eim-feature-card">
              <div className="eim-feature-header">
                <div className="eim-feature-icon">
                  <span>📊</span>
                </div>
                <h3>Advanced Analytics</h3>
              </div>
              <p>Comprehensive reporting with usage patterns, cost analysis, and performance metrics to optimize your inventory strategy.</p>
            </div>

            <div className="eim-feature-card">
              <div className="eim-feature-header">
                <div className="eim-feature-icon">
                  <span>🔄</span>
                </div>
                <h3>Workflow Automation</h3>
              </div>
              <p>Streamline your processes with automated workflows, approval systems, and seamless integration with existing tools.</p>
            </div>

            <div className="eim-feature-card">
              <div className="eim-feature-header">
                <div className="eim-feature-icon">
                  <span>🛡️</span>
                </div>
                <h3>Security & Compliance</h3>
              </div>
              <p>Enterprise-grade security with role-based access control, audit trails, and compliance with industry standards.</p>
            </div>

            <div className="eim-feature-card">
              <div className="eim-feature-header">
                <div className="eim-feature-icon">
                  <span>📱</span>
                </div>
                <h3>Mobile Access</h3>
              </div>
              <p>Access your inventory anywhere with our mobile-responsive interface and dedicated mobile app for on-the-go management.</p>
            </div>

            <div className="eim-feature-card">
              <div className="eim-feature-header">
                <div className="eim-feature-icon">
                  <span>🔗</span>
                </div>
                <h3>Seamless Integration</h3>
              </div>
              <p>Connect with your existing systems through our robust API and pre-built integrations with popular lab management tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="eim-solutions">
        <div className="eim-container">
          <div className="eim-solutions-content">
            <div className="eim-solutions-text">
              <div className="eim-section-badge">
                <span className="eim-badge-icon">💡</span>
                Solutions
              </div>
              <h2>Built for Modern Electronics Labs</h2>
              <p>Whether you're a research facility, manufacturing lab, or educational institution, ElectroFlow adapts to your unique needs.</p>
              
              <div className="eim-solution-items">
                <div className="eim-solution-item">
                  <div className="eim-solution-icon">🏭</div>
                  <div>
                    <h4>Manufacturing Labs</h4>
                    <p>Optimize production workflows and maintain quality standards</p>
                  </div>
                </div>
                <div className="eim-solution-item">
                  <div className="eim-solution-icon">🔬</div>
                  <div>
                    <h4>Research Facilities</h4>
                    <p>Track specialized components and manage research projects</p>
                  </div>
                </div>
                <div className="eim-solution-item">
                  <div className="eim-solution-icon">🎓</div>
                  <div>
                    <h4>Educational Institutions</h4>
                    <p>Manage student access and teaching lab inventories</p>
                  </div>
                </div>
              </div>

              <button 
    className="eim-solution-cta"
    onClick={handleStartFreeTrial} // Update this
  >
    Explore Solutions
  </button>
            </div>
            <div className="eim-solutions-visual">
              <div className="eim-visual-card">
                <div className="eim-card-header">
                  <span className="eim-card-title">Inventory Status</span>
                  <span className="eim-status-indicator"></span>
                </div>
                <div className="eim-inventory-list">
                  <div className="eim-inventory-item">
                    <span className="eim-item-name">Arduino Uno R3</span>
                    <span className="eim-item-status eim-status-good">In Stock (47)</span>
                  </div>
                  <div className="eim-inventory-item">
                    <span className="eim-item-name">Resistor 10kΩ</span>
                    <span className="eim-item-status eim-status-low">Low (12)</span>
                  </div>
                  <div className="eim-inventory-item">
                    <span className="eim-item-name">Capacitor 100μF</span>
                    <span className="eim-item-status eim-status-good">In Stock (89)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="eim-final-cta">
        <div className="eim-container">
          <div className="eim-cta-content">
            <h2>Ready to Transform Your Lab?</h2>
            <p>Join hundreds of labs already using ElectroFlow to streamline their inventory management.</p>
            <div className="eim-cta-actions">
               <button 
    className="eim-cta-main"
    onClick={handleStartFreeTrial} // Update this
  >
    Get Started Free
  </button>
              <span className="eim-cta-note">30-day free trial • No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="eim-footer">
        <div className="eim-container">
          <div className="eim-footer-content">
            <div className="eim-footer-brand">
              <div className="eim-brand">
                <div className="eim-brand-icon">
                  <div className="eim-circuit-pattern">
                    <div className="eim-circuit-dot"></div>
                    <div className="eim-circuit-line"></div>
                    <div className="eim-circuit-dot"></div>
                  </div>
                </div>
                <span className="eim-brand-text">ElectroFlow</span>
              </div>
              <p>The modern way to manage electronics inventory. Built for the future of lab management.</p>
            </div>
            <div className="eim-footer-links">
              <div className="eim-link-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#integrations">Integrations</a>
                <a href="#api">API</a>
              </div>
              <div className="eim-link-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#careers">Careers</a>
                <a href="#blog">Blog</a>
                <a href="#contact">Contact</a>
              </div>
              <div className="eim-link-column">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#docs">Documentation</a>
                <a href="#status">Status</a>
              </div>
            </div>
          </div>
          <div className="eim-footer-bottom">
            <p>&copy; 2024 ElectroFlow. All rights reserved.</p>
            <div className="eim-footer-legal">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
