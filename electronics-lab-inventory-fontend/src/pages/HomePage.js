import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import { 
  MdStorage, MdBarChart, MdTrendingUp, MdNotifications, MdWarning, MdArchive,
  MdAttachMoney, MdInput, MdSettingsApplications, MdHistory, MdLightbulbOutline,
  MdErrorOutline, MdPriorityHigh, MdArrowForward,
  MdPeople, MdRefresh, MdGetApp, MdBalance, MdAdd  // Add these new imports
} from 'react-icons/md';


import {
  LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, ResponsiveContainer
} from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import api from '../utils/api';

const HomePage = () => {
  const { user } = useContext(AuthContext);

  const [overviewData, setOverviewData] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [topComponents, setTopComponents] = useState([]);
  const [notificationSummary, setNotificationSummary] = useState(null);
  const [userActivityData, setUserActivityData] = useState(null);
  const [systemStatsData, setSystemStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Smart Assessment State
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [assessmentText, setAssessmentText] = useState("");
  const [assessmentError, setAssessmentError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [
          overviewRes, monthlyStatsRes, dailyTrendsRes, topComponentsRes,
          notificationSummaryRes, userActivityRes, systemStatsRes
        ] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/monthly-stats?months=6'),
          api.get('/dashboard/daily-trends?days=7'),
          api.get('/dashboard/top-components?type=usage&limit=5'),
          api.get('/notifications/stats'),
          api.get('/dashboard/user-activity'),
          api.get('/dashboard/system-stats'),
        ]);
        setOverviewData(overviewRes.data.data);
        setMonthlyStats(monthlyStatsRes.data.data);
        setDailyTrends(dailyTrendsRes.data.data);
        setTopComponents(topComponentsRes.data.data);
        setNotificationSummary(notificationSummaryRes.data.data);
        setUserActivityData(userActivityRes.data.data);
        setSystemStatsData(systemStatsRes.data.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please check your connection or permissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (value) =>
    `INR ${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }

  // AI Smart Assessment workflow
  const handleSmartAssessment = async () => {
    setAssessmentOpen(true);
    setAssessmentError(null);
    setAssessmentText("");
    setAssessing(true);
    try {
      // Gather dashboard data for Gemini
      const smartInput = {
        overview: overviewData,
        monthlyStats,
        dailyTrends,
        topComponents,
        notifications: notificationSummary,
        inventoryReportTime: new Date().toISOString(),
      };
      const prompt = `
You are an inventory management AI assistant. Analyze the following lab inventory data and list:
- The current situation
- Critical/Urgent issues first (reorder, risks, shortages)
- Warnings/Attention needed next (monitor/consider)
- Positive/healthy/perfect messages last (ok or no action)
Format each suggestion as a new line (bulleted if possible), no markdown bolds, avoid asterisks.
Data:
${JSON.stringify(smartInput, null, 2)}
      `;
      const res = await api.post('/gemini-assessment', { prompt });
      setAssessmentText(
        res.data.output?.trim() || (typeof res.data === "string" ? res.data : "No AI response.")
      );
    } catch (err) {
      setAssessmentError("Failed to retrieve assessment. Please try again.");
    }
    setAssessing(false);
  };

  // Beautiful AI Response (header, critical, warning, healthy)
  function renderAssessment(text) {
    if (!text) return null;
    let lines = text
      .replace(/\*\*/g, '')
      .replace(/^(\*|-)\s+/gm, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length);

    let situation = '';
    const criticals = [], warnings = [], perfect = [];
    lines.forEach((l, idx) => {
      if (idx === 0 && !/^-|^\d+\./.test(l) && l.length <= 120 && /situation|status|overview|currently|inventory/i.test(l)) {
        situation = l;
        return;
      }
      if (/critical|urgent|immediately|reorder|shortage|risk|alert|out\s*of\s*stock|depleted|stockout/i.test(l)) {
        criticals.push(l);
      } else if (/consider|monitor|potential|attention|watch|review|worth/i.test(l)) {
        warnings.push(l);
      } else {
        perfect.push(l);
      }
    });

    return (
      <div>
        {situation && <div className="assessment-title">{situation}</div>}
        {criticals.length > 0 && (
          <>
            <div className="assessment-section-label">🔴 Critical/Urgent</div>
            <ul className="assessment-ul">
              {criticals.map((line, i) =>
                <li className="assessment-list-item assessment-highlight" key={`crit-${i}`}>{line}</li>
              )}
            </ul>
          </>
        )}
        {warnings.length > 0 && (
          <>
            <div className="assessment-section-label">🟠 Needs Attention</div>
            <ul className="assessment-ul">
              {warnings.map((line, i) =>
                <li className="assessment-list-item assessment-warn" key={`warn-${i}`}>{line}</li>
              )}
            </ul>
          </>
        )}
        {perfect.length > 0 && (
          <>
            <div className="assessment-section-label">🟢 Healthy/No Action Needed</div>
            <ul className="assessment-ul">
              {perfect.map((line, i) =>
                <li className="assessment-list-item" key={`perf-${i}`}>{line}</li>
              )}
            </ul>
          </>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-root">
        <Sidebar />
        <div className="dashboard-main-area">
          <Navbar />
          <div className="homepage-loading">Loading dashboard data...</div>
        </div>
        <DashboardCSS />
        <SmartAssessmentCSS />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-root">
        <Sidebar />
        <div className="dashboard-main-area">
          <Navbar />
          <div className="homepage-error">{error}</div>
        </div>
        <DashboardCSS />
        <SmartAssessmentCSS />
      </div>
    );
  }

  // Greeting and profile pic logic
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();
  const userName = user?.name || "User";
  const profileImgUrl = user?.profilePicUrl;

  return (
    <div className="dashboard-root">
      <Sidebar />
      <div className="dashboard-main-area">
        <Navbar />
        <main className="homepage-content">
          <div className="homepage-header user-header-flex">
            <div className="user-greeting-info">
              <div className="profile-pic-bg">
                {profileImgUrl ?
                  <img src={profileImgUrl} alt={userName + " profile"} className="profile-pic-img" />
                  :
                  <div className="profile-pic-initials" aria-label={userName}>
                    {getInitials(userName)}
                  </div>
                }
              </div>
              <div>
                <div className="greeting-line">
                  {greeting}, <span className="user-highlight">{userName}</span>
                </div>
                <div className="sub-line">Welcome to your dashboard</div>
              </div>
            </div>
            {/* === SMART ASSESSMENT BUTTON === */}
            <div>
              <button className="smart-assessment-btn" onClick={handleSmartAssessment}>
                <MdLightbulbOutline style={{ verticalAlign: "-3px", fontSize: "1.3em", marginRight: 7, color:"gold" }} />
                Smart Assessment
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Cards */}
            <DashboardCard title="Total Components" value={overviewData?.totalComponents || 0} icon={<MdStorage />} color="blue" />
            <DashboardCard title="Total Quantity" value={overviewData?.totalQuantity || 0} icon={<MdStorage />} color="green" />
            <DashboardCard title="Low Stock Alerts" value={overviewData?.lowStockCount || 0} icon={<MdWarning />} color="red" />
            <DashboardCard title="Old Stock" value={overviewData?.oldStockCount || 0} icon={<MdArchive />} color="orange" />
            <DashboardCard title="Total Inventory Value" value={formatCurrency(overviewData?.totalInventoryValue)} icon={<MdAttachMoney />} color="purple" />
            <DashboardCard title="Today's Inward" value={overviewData?.totalInward || 0} icon={<MdInput />} color="teal" />

            {/* Enhanced Notifications Section */}
            <div className="dashboard-section notification-summary-card">
              <div className="notification-header">
                <h2 className="section-title">
                  <div className="title-icon-container">
                    <MdNotifications className="notification-title-icon" />
                  </div>
                  Notifications
                </h2>
                <div className="notification-actions">
                  <button className="view-all-btn">View All</button>
                  <button className="mark-read-btn">Mark All Read</button>
                </div>
              </div>

              {/* Notification Stats Grid */}
              <div className="notification-stats-grid">
                <div className="stat-card total">
                  <div className="stat-icon">
                    <MdNotifications />
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{notificationSummary?.total || 0}</span>
                    <span className="stat-label">Total</span>
                  </div>
                </div>
                
                <div className="stat-card unread">
                  <div className="stat-icon">
                    <div className="unread-dot"></div>
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{notificationSummary?.unread || 0}</span>
                    <span className="stat-label">Unread</span>
                  </div>
                </div>
                
                <div className="stat-card action-required">
                  <div className="stat-icon">
                    <MdWarning />
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{notificationSummary?.actionRequired || 0}</span>
                    <span className="stat-label">Action Required</span>
                  </div>
                </div>
                
                <div className="stat-card critical">
                  <div className="stat-icon">
                    <MdErrorOutline />
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{notificationSummary?.critical || 0}</span>
                    <span className="stat-label">Critical</span>
                  </div>
                </div>
                
                <div className="stat-card high-priority">
                  <div className="stat-icon">
                    <MdErrorOutline />
                  </div>
                  <div className="stat-content">
                    <span className="stat-number">{notificationSummary?.high || 0}</span>
                    <span className="stat-label">High Priority</span>
                  </div>
                </div>
              </div>

              {/* Critical Notifications */}
              {notificationSummary?.criticalNotifications?.length > 0 && (
                <div className="critical-notifications-section">
                  <div className="critical-header">
                    <MdErrorOutline className="critical-icon" />
                    <h3>Recent Critical Notifications</h3>
                    <span className="critical-count">{notificationSummary.criticalNotifications.length}</span>
                  </div>
                  <div className="critical-notifications-list">
                    {notificationSummary.criticalNotifications.slice(0, 3).map((notif, index) => (
                      <div key={notif._id} className="critical-notification-item">
                        <div className="critical-item-indicator"></div>
                        <div className="critical-item-content">
                          <div className="critical-item-header">
                            <span className="critical-item-title">{notif.title}</span>
                            <span className="critical-item-time">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <div className="critical-item-message">{notif.message}</div>
                          {notif.relatedComponent && (
                            <div className="critical-item-component">
                              <span>Component: {notif.relatedComponent.partNumber}</span>
                            </div>
                          )}
                        </div>
                        <button className="critical-item-action">
                          <MdArrowForward />
                        </button>
                      </div>
                    ))}
                    {notificationSummary.criticalNotifications.length > 3 && (
                      <div className="view-more-critical">
                        <button className="view-more-btn">
                          View {notificationSummary.criticalNotifications.length - 3} more critical notifications
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Notifications State */}
              {(!notificationSummary || notificationSummary.total === 0) && (
                <div className="no-notifications">
                  <div className="no-notifications-icon">
                    <MdNotifications />
                  </div>
                  <div className="no-notifications-text">
                    <h4>All caught up!</h4>
                    <p>No new notifications at the moment.</p>
                  </div>
                </div>
              )}
            </div>

{/* Move the CSS outside the component - Add this after your dashboard-grid closing tag */}
<style jsx>{`
  .notification-summary-card {
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
  }

  .notification-summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  .title-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-right: 12px;
  }

  .notification-title-icon {
    color: white;
    font-size: 1.2rem;
  }

  .notification-actions {
    display: flex;
    gap: 8px;
  }

  .view-all-btn, .mark-read-btn {
    padding: 6px 12px;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-all-btn:hover {
    background: #f8fafc;
    border-color: #667eea;
    color: #667eea;
  }

  .mark-read-btn:hover {
    background: #f0f9ff;
    border-color: #0ea5e9;
    color: #0ea5e9;
  }

  .notification-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .stat-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .stat-card.total {
    border-left: 4px solid #6b7280;
  }

  .stat-card.unread {
    border-left: 4px solid #3b82f6;
  }

  .stat-card.action-required {
    border-left: 4px solid #f59e0b;
  }

  .stat-card.critical {
    border-left: 4px solid #ef4444;
  }

  .stat-card.high-priority {
    border-left: 4px solid #8b5cf6;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    font-size: 1.2rem;
  }

  .stat-card.total .stat-icon {
    background: #6b728015;
    color: #6b7280;
  }

  .stat-card.unread .stat-icon {
    background: #3b82f615;
    color: #3b82f6;
  }

  .stat-card.action-required .stat-icon {
    background: #f59e0b15;
    color: #f59e0b;
  }

  .stat-card.critical .stat-icon {
    background: #ef444415;
    color: #ef4444;
  }

  .stat-card.high-priority .stat-icon {
    background: #8b5cf615;
    color: #8b5cf6;
  }

  .unread-dot {
    width: 12px;
    height: 12px;
    background: #3b82f6;
    border-radius: 50%;
    position: relative;
  }

  .unread-dot::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid #3b82f6;
    border-radius: 50%;
    opacity: 0.3;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.1;
    }
    100% {
      transform: scale(1);
      opacity: 0.3;
    }
  }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }

  .critical-notifications-section {
    background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
    border: 1px solid #fecaca;
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
  }

  .critical-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .critical-icon {
    color: #ef4444;
    font-size: 1.3rem;
  }

  .critical-header h3 {
    color: #dc2626;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
  }

  .critical-count {
    background: #ef4444;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    min-width: 20px;
    text-align: center;
  }

  .critical-notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .critical-notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: white;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
  }

  .critical-notification-item:hover {
    border-color: #ef4444;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
  }

  .critical-item-indicator {
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;
  }

  .critical-item-content {
    flex: 1;
    min-width: 0;
  }

  .critical-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
  }

  .critical-item-title {
    font-weight: 600;
    color: #dc2626;
    font-size: 0.95rem;
  }

  .critical-item-time {
    font-size: 0.8rem;
    color: #6b7280;
    flex-shrink: 0;
    margin-left: 12px;
  }

  .critical-item-message {
    color: #374151;
    font-size: 0.9rem;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .critical-item-component {
    font-size: 0.8rem;
    color: #6b7280;
    background: #f9fafb;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .critical-item-action {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .critical-item-action:hover {
    background: #f3f4f6;
    color: #ef4444;
  }

  .view-more-critical {
    margin-top: 8px;
  }

  .view-more-btn {
    width: 100%;
    background: none;
    border: 1px dashed #fca5a5;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-more-btn:hover {
    background: #fef2f2;
    border-color: #ef4444;
  }

  .no-notifications {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
  }

  .no-notifications-icon {
    width: 64px;
    height: 64px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    font-size: 2rem;
    color: #9ca3af;
  }

  .no-notifications-text h4 {
    color: #374151;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  .no-notifications-text p {
    color: #6b7280;
    font-size: 0.95rem;
    margin: 0;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .notification-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .notification-actions {
      align-self: stretch;
    }

    .view-all-btn, .mark-read-btn {
      flex: 1;
    }

    .notification-stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .stat-card {
      padding: 12px;
    }

    .critical-item-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .critical-item-time {
      margin-left: 0;
    }
  }

  @media (max-width: 480px) {
    .notification-stats-grid {
      grid-template-columns: 1fr;
    }

    .critical-notifications-section {
      padding: 16px;
    }
  }
`}</style>



{/* Enhanced Chart: Monthly Transactions */}
<div className="dashboard-section monthly-stats-enhanced">
  <div className="chart-header">
    <div className="chart-title-section">
      <div className="chart-icon-container">
        <MdBarChart className="chart-title-icon" />
      </div>
      <div className="chart-title-content">
        <h2 className="chart-title">Monthly Transaction Overview</h2>
        <p className="chart-subtitle">Last 6 months performance</p>
      </div>
    </div>
    <div className="chart-actions">
      <div className="chart-legend-compact">
        <div className="legend-item">
          <div className="legend-dot inward"></div>
          <span>Inward</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot outward"></div>
          <span>Outward</span>
        </div>
      </div>
      <button className="chart-export-btn">
        <MdGetApp />
      </button>
    </div>
  </div>

  <div className="chart-content">
    {monthlyStats.length > 0 ? (
      <>
        {/* Quick Stats Summary */}
        <div className="chart-summary">
          <div className="summary-stat">
            <span className="summary-number">
              {monthlyStats.reduce((sum, month) => sum + (month.inwardQuantity || 0), 0).toLocaleString()}
            </span>
            <span className="summary-label">Total Inward</span>
          </div>
          <div className="summary-stat">
            <span className="summary-number">
              {monthlyStats.reduce((sum, month) => sum + (month.outwardQuantity || 0), 0).toLocaleString()}
            </span>
            <span className="summary-label">Total Outward</span>
          </div>
          <div className="summary-stat">
            <span className="summary-number">
              {Math.round(monthlyStats.reduce((sum, month) => sum + (month.inwardQuantity || 0), 0) / monthlyStats.length).toLocaleString()}
            </span>
            <span className="summary-label">Avg Monthly</span>
          </div>
        </div>

        {/* Enhanced Chart Container */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart 
              data={monthlyStats} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value.toLocaleString()} units`, 
                  name === 'inwardQuantity' ? 'Inward' : 'Outward'
                ]}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="inwardQuantity" 
                name="Inward" 
                fill="#667eea"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="outwardQuantity" 
                name="Outward" 
                fill="#3dc47e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Insights */}
        <div className="chart-insights">
          <div className="insight-item">
            <div className="insight-icon trend-up">
              <MdTrendingUp />
            </div>
            <div className="insight-content">
              <span className="insight-title">Peak Month</span>
              <span className="insight-value">
                {monthlyStats.reduce((prev, current) => 
                  (prev.inwardQuantity + prev.outwardQuantity) > (current.inwardQuantity + current.outwardQuantity) ? prev : current
                ).monthName}
              </span>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon balance">
              <MdBalance />
            </div>
            <div className="insight-content">
              <span className="insight-title">Net Flow</span>
              <span className="insight-value">
                {(monthlyStats.reduce((sum, month) => sum + (month.inwardQuantity || 0), 0) - 
                  monthlyStats.reduce((sum, month) => sum + (month.outwardQuantity || 0), 0)).toLocaleString()} units
              </span>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="no-data-state">
        <div className="no-data-icon">
          <MdBarChart />
        </div>
        <div className="no-data-content">
          <h4>No Transaction Data</h4>
          <p>Monthly transaction data will appear here once transactions are recorded.</p>
          <button className="add-data-btn">
            <MdAdd /> Add Transaction
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Enhanced Inline CSS */}
  <style jsx>{`
    .monthly-stats-enhanced {
      background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .monthly-stats-enhanced:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .monthly-stats-enhanced::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #3dc47e 100%);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    .chart-title-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chart-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .chart-title-icon {
      color: white;
      font-size: 1.4rem;
    }

    .chart-title-content {
      display: flex;
      flex-direction: column;
    }

    .chart-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }

    .chart-subtitle {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0;
      font-weight: 500;
    }

    .chart-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chart-legend-compact {
      display: flex;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-dot.inward {
      background: #667eea;
    }

    .legend-dot.outward {
      background: #3dc47e;
    }

    .chart-export-btn {
      width: 36px;
      height: 36px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }

    .chart-export-btn:hover {
      background: #e2e8f0;
      color: #667eea;
    }

    .chart-content {
      position: relative;
    }

    .chart-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .summary-stat {
      text-align: center;
      padding: 8px;
    }

    .summary-number {
      display: block;
      font-size: 1.4rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .summary-label {
      font-size: 0.8rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #f1f5f9;
      margin-bottom: 20px;
    }

    .chart-insights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .insight-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      transition: all 0.2s ease;
    }

    .insight-item:hover {
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .insight-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .insight-icon.trend-up {
      background: #10b98115;
      color: #10b981;
    }

    .insight-icon.balance {
      background: #667eea15;
      color: #667eea;
    }

    .insight-content {
      display: flex;
      flex-direction: column;
    }

    .insight-title {
      font-size: 0.8rem;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .insight-value {
      font-size: 1rem;
      color: #1f2937;
      font-weight: 600;
      margin-top: 2px;
    }

    .no-data-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .no-data-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 2.2rem;
      color: #9ca3af;
    }

    .no-data-content h4 {
      color: #374151;
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .no-data-content p {
      color: #6b7280;
      font-size: 1rem;
      margin: 0 0 20px 0;
      max-width: 300px;
    }

    .add-data-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .add-data-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .chart-actions {
        align-self: stretch;
        justify-content: space-between;
      }

      .chart-summary {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 12px;
      }

      .summary-number {
        font-size: 1.2rem;
      }

      .chart-insights {
        grid-template-columns: 1fr;
      }

      .chart-title-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .chart-icon-container {
        width: 40px;
        height: 40px;
      }

      .chart-title-icon {
        font-size: 1.2rem;
      }
    }

    @media (max-width: 480px) {
      .monthly-stats-enhanced {
        padding: 16px;
      }

      .chart-summary {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .legend-item {
        font-size: 0.8rem;
      }

      .chart-container {
        padding: 12px;
      }
    }

    /* Loading animation for chart */
    @keyframes chartLoad {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .chart-container {
      animation: chartLoad 0.5s ease-out;
    }
  `}</style>
</div>


            {/* Chart: Daily Usage Trends */}
            <div className="dashboard-section chart-card daily-trends-card">
              <h2 className="section-title"><MdTrendingUp /> Daily Usage Trends (Last 7 Days)</h2>
              <div className="chart-placeholder">
                {dailyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} units`} />
                      <Legend />
                      <Line type="monotone" dataKey="inwardQuantity" name="Inward" stroke="var(--primary-blue)" strokeWidth={2} />
                      <Line type="monotone" dataKey="outwardQuantity" name="Outward" stroke="var(--success-green)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data-message">No daily usage trend data available.</p>
                )}
              </div>
            </div>

            {/* Top Components */}
            <div className="dashboard-section top-components-card">
              <h2 className="section-title"><MdStorage /> Top 5 Components by Usage</h2>
              {topComponents.length > 0 ? (
                <ul className="top-components-list">
                  {topComponents.map(comp => (
                    <li key={comp._id || comp.component?._id} className="component-item">
                      <span className="component-name">{comp.component?.componentName || 'N/A'}</span>
                      <span className="component-part-number">({comp.component?.partNumber || 'N/A'})</span>
                      <span className="component-quantity">Used: {comp.totalQuantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data-message">No top components data available.</p>
              )}
            </div>

            {/* User Activity */}
            <div className="dashboard-section user-activity-card">
              <h2 className="section-title"><MdHistory /> User Activity</h2>
              {userActivityData ? (
                <div className="user-activity-content">
                  <h3>Transaction Activity</h3>
                  {userActivityData.userActivity.length > 0 ? (
                    <ul className="activity-list">
                      {userActivityData.userActivity.map(activity => (
                        <li key={activity._id} className="activity-item">
                          <strong>{activity.userName} ({activity.userRole})</strong><br />
                          Inward: {activity.inwardTransactions}, Outward: {activity.outwardTransactions} transactions.<br />
                          Total Handled: {activity.totalQuantityHandled} units ({formatCurrency(activity.totalValueHandled)})
                        </li>
                      ))}
                    </ul>
                  ) : <p className="no-data-message">No user transaction activity found.</p>}
                  <h3 style={{marginTop: '1rem'}}>Recently Active Users</h3>
                  {userActivityData.recentlyActiveUsers.length > 0 ? (
                    <ul className="activity-list">
                      {userActivityData.recentlyActiveUsers.map(user => (
                        <li key={user._id} className="activity-item">
                          <strong>{user.name} ({user.role})</strong> - Last Login: {new Date(user.lastLogin).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="no-data-message">No recently active users found.</p>}
                </div>
              ) : <p className="no-data-message">User activity data not available (Admin Only).</p>}
            </div>

            {/* System Stats */}
            <div className="dashboard-section system-stats-card">
              <h2 className="section-title"><MdSettingsApplications /> System Statistics</h2>
              {systemStatsData ? (
                <div className="system-stats-content">
                  <h3>Users</h3>
                  <ul className="stats-list">
                    <li>Total<span>{systemStatsData.users.total}</span></li>
                    <li>Active<span>{systemStatsData.users.active}</span></li>
                    <li>Inactive<span>{systemStatsData.users.inactive}</span></li>
                  </ul>
                  <h3>Components</h3>
                  <ul className="stats-list">
                    <li>Total<span>{systemStatsData.components.total}</span></li>
                    <li>Active<span>{systemStatsData.components.active}</span></li>
                    <li>Obsolete<span>{systemStatsData.components.obsolete}</span></li>
                  </ul>
                  <h3>Storage by Category</h3>
                  {systemStatsData.storageByCategory.length > 0 ? (
                    <ul className="stats-list category-storage">
                      {systemStatsData.storageByCategory.map(cat => (
                        <li key={cat._id}>
                          <strong>{cat._id || 'Uncategorized'}:</strong> {cat.totalQuantity} units ({formatCurrency(cat.totalValue)})
                        </li>
                      ))}
                    </ul>
                  ) : <p className="no-data-message">No category data.</p>}
                </div>
              ) : <p className="no-data-message">System statistics not available (Admin Only).</p>}
            </div>
          </div>

          {/* === SMART ASSESSMENT MODAL === */}
          {assessmentOpen && (
            <div className="smart-assessment-modal-bg" onClick={() => setAssessmentOpen(false)}>
              <div className="smart-assessment-modal" onClick={e => e.stopPropagation()}>
                <div className="smart-assessment-modal-header">
                  <MdLightbulbOutline color="gold" style={{marginRight:8, fontSize:"1.5em"}}/>
                  Smart Inventory Assessment
                  <span className="smart-assessment-close" onClick={()=>setAssessmentOpen(false)}>&times;</span>
                </div>
                <div className="smart-assessment-modal-body">
                  {assessing && (
                    <div className="assessment-loader">
                      <span className="dot-anim">• • •</span> Analyzing your inventory with Gemini AI...
                    </div>
                  )}
                  {!assessing && assessmentError && (
                    <div className="assessment-error">{assessmentError}</div>
                  )}
                  {!assessing && !assessmentError && assessmentText && (
                    <div className="assessment-report-beautify">
                      {renderAssessment(assessmentText)}
                    </div>
                  )}
                  {!assessing && !assessmentError && !assessmentText && (
                    <div className="assessment-info">No assessment available.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <DashboardCSS />
      <SmartAssessmentCSS />
    </div>
  );
};

function DashboardCSS() {
  return (
    <style>{`
/* ========== CSS VARIABLES ========== */
:root {
  --primary-blue: #667eea;
  --primary-blue-light: #667eea15;
  --primary-blue-dark: #5a67d8;
  --success-green: #3dc47e;
  --success-green-light: #3dc47e15;
  --danger-red: #e53e3e;
  --danger-red-light: #e53e3e15;
  --warning-orange: #fd7e14;
  --warning-orange-light: #fd7e1415;
  --purple: #9f7aea;
  --purple-light: #9f7aea15;
  --teal: #38b2ac;
  --teal-light: #38b2ac15;
  
  /* Background Colors */
  --main-bg: #fafbfc;
  --card-bg: #ffffff;
  --card-hover-bg: #f8fafc;
  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
  
  /* Text Colors */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 12px 40px rgba(0, 0, 0, 0.12);
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
  --transition-bounce: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ========== GLOBAL STYLES ========== */
* {
  box-sizing: border-box;
}

body, #root, .dashboard-root {
  min-height: 100vh;
  height: 100vh;
  background: var(--main-bg);
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ========== LAYOUT COMPONENTS ========== */
.dashboard-root {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.dashboard-main-area {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 0;
  height: 100vh;
  background: var(--main-bg);
  overflow: hidden;
  position: relative;
}

.homepage-content {
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg) var(--spacing-xl);
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* ========== HEADER COMPONENTS ========== */
.user-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: var(--transition-normal);
}

.user-header-flex:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.user-greeting-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.profile-pic-bg {
  min-width: 56px;
  min-height: 56px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-blue) 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  border: 3px solid #ffffff;
  transition: var(--transition-bounce);
  position: relative;
}

.profile-pic-bg:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.profile-pic-bg::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: var(--success-green);
  border: 2px solid white;
  border-radius: 50%;
}

.profile-pic-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-pic-initials {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.greeting-line {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  letter-spacing: -0.02em;
}

.user-highlight {
  color: var(--primary-blue);
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-blue) 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sub-line {
  color: var(--text-secondary);
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 500;
}

/* ========== DASHBOARD GRID ========== */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.dashboard-section {
  background: var(--card-bg);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--border-color);
  margin-bottom: 0;
  min-width: 0;
  overflow: hidden;
  transition: var(--transition-bounce);
  position: relative;
}

.dashboard-section:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-hover);
}

.dashboard-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-blue) 0%, var(--success-green) 50%, var(--warning-orange) 100%);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.02em;
}

.section-title svg {
  font-size: 1.4rem;
  color: var(--primary-blue);
}

/* ========== CHART SECTIONS ========== */
.chart-card,
.monthly-stats-card,
.daily-trends-card,
.chart-section {
  grid-column: 1 / -1;
  width: 100%;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: var(--transition-bounce);
  overflow: hidden;
  position: relative;
}

.chart-card:hover,
.monthly-stats-card:hover,
.daily-trends-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.chart-card::before,
.monthly-stats-card::before,
.daily-trends-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, var(--primary-blue) 0%, var(--success-green) 100%);
}

/* ========== LOADING & ERROR STATES ========== */
.dashboard-loading,
.homepage-loading,
.homepage-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: var(--primary-blue);
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  gap: var(--spacing-md);
}

.homepage-loading::before {
  content: '';
  width: 40px;
  height: 40px;
  border: 3px solid var(--primary-blue-light);
  border-top: 3px solid var(--primary-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.homepage-error {
  color: var(--danger-red);
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }
  
  .homepage-content {
    padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
  }
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .homepage-content {
    padding: var(--spacing-md) 4vw var(--spacing-sm) 4vw;
  }
  
  .user-header-flex {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-md);
  }
}

@media (max-width: 600px) {
  .homepage-content {
    padding: var(--spacing-md) 3vw var(--spacing-sm) 3vw;
  }
  
  .dashboard-section {
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm) var(--spacing-md);
  }
  
  .profile-pic-bg {
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
  }
  
  .user-header-flex {
    margin-bottom: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
  
  .greeting-line {
    font-size: 1.2rem;
  }
  
  .sub-line {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .dashboard-grid {
    gap: var(--spacing-sm);
  }
  
  .chart-card,
  .monthly-stats-card,
  .daily-trends-card {
    margin: 0 -var(--spacing-sm);
  }
}

/* ========== ACCESSIBILITY ========== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --main-bg: #111827;
    --card-bg: #1f2937;
    --card-hover-bg: #374151;
    --border-color: #374151;
    --border-hover: #4b5563;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-muted: #9ca3af;
  }
}

/* ========== SCROLL BAR STYLING ========== */
.homepage-content::-webkit-scrollbar {
  width: 6px;
}

.homepage-content::-webkit-scrollbar-track {
  background: transparent;
}

.homepage-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.homepage-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-hover);
}
`}</style>
  );
}

function SmartAssessmentCSS() {
  return (
    <style>{`
/* ========== SMART ASSESSMENT BUTTON ========== */
.smart-assessment-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffe695 50%, #ffed4e 100%);
  color: #2d3748;
  border: none;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.25);
  font-weight: 700;
  font-size: 1.1rem;
  padding: 12px 24px 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  margin-left: var(--spacing-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.02em;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.smart-assessment-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.smart-assessment-btn:hover::before {
  left: 100%;
}

.smart-assessment-btn:hover {
  box-shadow: 0 6px 24px rgba(255, 215, 0, 0.4);
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.smart-assessment-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

/* ========== MODAL BACKGROUND ========== */
.smart-assessment-modal-bg {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modalBgFadeIn 0.3s ease-out;
}

@keyframes modalBgFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(4px);
  }
}

/* ========== MODAL CONTAINER ========== */
.smart-assessment-modal {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  padding: 24px 28px 20px 28px;
  border-radius: 20px;
  min-width: 400px;
  max-width: 90vw;
  max-height: 85vh;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.smart-assessment-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ffd700 0%, #667eea 50%, #3dc47e 100%);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ========== MODAL HEADER ========== */
.smart-assessment-modal-header {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
  letter-spacing: -0.02em;
}

.smart-assessment-modal-header svg {
  margin-right: 10px;
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
}

.smart-assessment-close {
  font-size: 1.8rem;
  cursor: pointer;
  margin-left: 20px;
  color: #9ca3af;
  font-weight: 400;
  transition: all 0.3s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: transparent;
}

.smart-assessment-close:hover {
  color: #ef4444;
  background: #fef2f2;
  transform: scale(1.1);
}

/* ========== MODAL BODY ========== */
.smart-assessment-modal-body {
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
  font-size: 1.1rem;
  line-height: 1.6;
  padding-right: 4px;
}

.smart-assessment-modal-body::-webkit-scrollbar {
  width: 6px;
}

.smart-assessment-modal-body::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 3px;
}

.smart-assessment-modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.smart-assessment-modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ========== LOADING STATE ========== */
.assessment-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #667eea;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  gap: 16px;
}

.assessment-loader::before {
  content: '';
  width: 40px;
  height: 40px;
  border: 3px solid #667eea20;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: assessmentSpin 1s linear infinite;
}

@keyframes assessmentSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dot-anim {
  letter-spacing: 3px;
  font-size: 1.3rem;
  animation: dotBlink 1.5s ease-in-out infinite;
  color: #ffd700;
  font-weight: 700;
}

@keyframes dotBlink {
  0%, 20% { opacity: 0.3; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0.3; }
}

/* ========== ERROR STATE ========== */
.assessment-error {
  color: #dc2626;
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  text-align: center;
  padding: 20px 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
}

/* ========== SUCCESS STATE ========== */
.assessment-report-beautify {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: 16px;
  padding: 24px 20px 16px 28px;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.1);
  position: relative;
}

.assessment-report-beautify::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #ffd700 0%, #f59e0b 100%);
  border-radius: 16px 0 0 16px;
}

.assessment-title {
  font-weight: 700;
  color: #1f2937;
  font-size: 1.25rem;
  margin-bottom: 16px;
  text-align: left;
  letter-spacing: -0.02em;
  padding-bottom: 8px;
  border-bottom: 2px solid #fde68a;
}

.assessment-section-label {
  font-weight: 700;
  font-size: 1.1rem;
  color: #374151;
  margin: 20px 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border-left: 4px solid;
}

.assessment-section-label:nth-of-type(1) { border-left-color: #ef4444; }
.assessment-section-label:nth-of-type(2) { border-left-color: #f59e0b; }
.assessment-section-label:nth-of-type(3) { border-left-color: #10b981; }

.assessment-ul {
  padding-left: 20px;
  margin: 0 0 16px 0;
  font-size: 1rem;
  list-style: none;
}

.assessment-list-item {
  margin: 0 0 12px 0;
  line-height: 1.6;
  color: #374151;
  font-size: 1rem;
  letter-spacing: 0.01em;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
  padding-left: 32px;
}

.assessment-list-item::before {
  content: '•';
  position: absolute;
  left: 12px;
  color: #6b7280;
  font-weight: 700;
  font-size: 1.2rem;
}

.assessment-list-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(4px);
}

.assessment-highlight {
  color: #dc2626;
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-weight: 700;
  padding: 12px 16px;
  margin: 8px 0;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
}

.assessment-highlight::before {
  content: '⚠️';
  margin-right: 8px;
}

.assessment-warn {
  color: #d97706;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-weight: 600;
  padding: 12px 16px;
  margin: 8px 0;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
}

.assessment-warn::before {
  content: '⚡';
  margin-right: 8px;
}

.assessment-info {
  color: #6b7280;
  text-align: center;
  margin-bottom: 20px;
  font-style: italic;
  font-size: 1.1rem;
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 900px) {
  .smart-assessment-btn {
    margin-left: 0;
    margin-top: 12px;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .smart-assessment-modal {
    min-width: 95vw;
    max-width: 95vw;
    padding: 16px 20px 12px 20px;
    margin: 20px;
  }
  
  .smart-assessment-modal-header {
    font-size: 1.1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .smart-assessment-close {
    position: absolute;
    top: 16px;
    right: 16px;
    margin: 0;
  }
  
  .assessment-report-beautify {
    padding: 16px 12px 12px 20px;
  }
  
  .assessment-list-item {
    padding: 6px 8px 6px 24px;
    font-size: 0.95rem;
  }
}

/* ========== ANIMATIONS ========== */
@keyframes shimmer {
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
}

.assessment-loader {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
}

/* ========== PRINT STYLES ========== */
@media print {
  .smart-assessment-modal-bg {
    position: static;
    background: none;
    backdrop-filter: none;
  }
  
  .smart-assessment-modal {
    box-shadow: none;
    border: 1px solid #000;
    max-width: 100%;
    max-height: none;
  }
  
  .smart-assessment-close {
    display: none;
  }
}
`}</style>
  );
}


export default HomePage;
