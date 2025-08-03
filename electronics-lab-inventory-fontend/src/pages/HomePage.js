import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import { 
  MdStorage, MdBarChart, MdTrendingUp, MdNotifications, MdWarning, MdArchive,
  MdAttachMoney, MdInput, MdSettingsApplications, MdHistory, MdLightbulbOutline,
  MdErrorOutline, MdPriorityHigh, MdArrowForward, MdPeople, MdRefresh, MdGetApp, 
  MdBalance, MdAdd, MdViewList, MdCode, MdCategory, MdInfo, MdInventory, MdTimeline,
  MdSwapHoriz, MdArrowDownward, MdArrowUpward, MdAccessTime, MdSchedule, MdLock, MdSecurity
} from 'react-icons/md';
import { useNavigate } from "react-router-dom";


import {
  LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, ResponsiveContainer,AreaChart,
  Area,
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
  const [alertsData, setAlertsData] = useState(null);


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
      
      // Base API calls that all dashboard users can access
      const baseApiCalls = [
        api.get('/dashboard/overview'),
        api.get('/dashboard/monthly-stats?months=6'),
        api.get('/dashboard/daily-trends?days=7'),
        api.get('/dashboard/top-components?type=usage&limit=5'),
        api.get('/notifications/stats'), // This might need to be checked too
        api.get('/dashboard/alerts') // Added the alerts endpoint
      ];

      // Admin-only API calls
      const adminApiCalls = [];
      
      // Check if current user is admin before adding admin-only endpoints
      if (user && user.role === 'Admin') {
        adminApiCalls.push(
          api.get('/dashboard/user-activity'),
          api.get('/dashboard/system-stats')
        );
      }

      // Combine all API calls
      const allApiCalls = [...baseApiCalls, ...adminApiCalls];
      
      const responses = await Promise.all(allApiCalls);
      
      // Extract responses for base calls (always present)
      const [
        overviewRes,
        monthlyStatsRes,
        dailyTrendsRes,
        topComponentsRes,
        notificationSummaryRes,
        alertsRes
      ] = responses;

      // Set the base data
      setOverviewData(overviewRes.data.data);
      setMonthlyStats(monthlyStatsRes.data.data);
      setDailyTrends(dailyTrendsRes.data.data);
      setTopComponents(topComponentsRes.data.data);
      setNotificationSummary(notificationSummaryRes.data.data);
      setAlertsData(alertsRes.data.data); // Assuming you have this state

      // Set admin data only if user is admin
      if (user && user.role === 'Admin' && adminApiCalls.length > 0) {
        const adminResponses = responses.slice(baseApiCalls.length);
        const [userActivityRes, systemStatsRes] = adminResponses;
        
        setUserActivityData(userActivityRes.data.data);
        setSystemStatsData(systemStatsRes.data.data);
      } else {
        // Clear admin data for non-admin users
        setUserActivityData(null);
        setSystemStatsData(null);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, [user]); // Add user as dependency to re-fetch when user changes


  const navigate = useNavigate();
  // Format currency for IN
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




          </div>
          

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
            <div className="dashboard-section daily-trends-enhanced">
      <div className="section-header">
        <div className="section-title">
          <MdTrendingUp style={{ marginRight: 8 }} />
          Daily Usage Trends (Last 7 Days)
        </div>
      </div>
      <div className="section-content">
        {dailyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={dailyTrends}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="colorOutward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3dc47e" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#3dc47e" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [
                  `${value.toLocaleString()} units`,
                  name === "inwardQuantity" ? "Inward" : "Outward",
                ]}
                labelStyle={{ color: "#374151", fontWeight: 600 }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,.06)",
                  fontWeight: 500,
                }}
              />
              <Legend iconType="rect" />
              <Area
                type="monotone"
                dataKey="inwardQuantity"
                name="Inward"
                stroke="#667eea"
                fill="url(#colorInward)"
                strokeWidth={2}
                dot={{ r: 4, fill: "#667eea", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="outwardQuantity"
                name="Outward"
                stroke="#3dc47e"
                fill="url(#colorOutward)"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3dc47e", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-trends">
            <p className="no-data-message">No daily usage trend data available.</p>
          </div>
        )}
      </div>
      {/* Inline CSS */}
      <style>{`
        .daily-trends-enhanced {
          background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          position: relative;
          transition: box-shadow 0.3s;
        }
        .daily-trends-enhanced:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.10);
        }
        .section-header {
          padding: 24px 24px 20px 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
        }
        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          display: flex;
          align-items: center;
          letter-spacing: -0.01em;
        }
        .section-content {
          padding: 24px 24px 20px 24px;
        }
        .no-data-trends {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 55px 0;
        }
        .no-data-message {
          color: #888;
          font-size: 1rem;
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          border-radius: 8px;
          padding: 28px 16px;
        }
        @media (max-width: 900px) {
          .section-content, .section-header { padding: 16px; }
        }
        @media (max-width: 600px) {
          .section-content, .section-header { padding: 9px; }
        }
      `}</style>
            </div>

            {/*Top 5: Components*/}
            <div className="dashboard-section top-components-enhanced">
  <div className="top-components-header">
    <div className="header-content">
      <div className="title-icon-wrapper">
        <MdStorage className="section-icon" />
      </div>
      <div className="title-content">
        <h2 className="section-title">Top 5 Components by Usage</h2>
        <p className="section-subtitle">Most frequently used components this month</p>
      </div>
    </div>
    <div className="header-actions">
      

      <button
        className="view-all-btn"
        onClick={() => navigate("/inventory")}
      >
        <MdViewList />
        <span>View All</span>
      </button>

      <button className="export-btn">
        <MdGetApp />
      </button>
    </div>
  </div>

  <div className="components-content">
    {topComponents.length > 0 ? (
      <>
        {/* Quick Stats */}
        <div className="usage-summary">
          <div className="summary-item">
            <span className="summary-number">
              {topComponents.reduce((sum, comp) => sum + comp.totalQuantity, 0).toLocaleString()}
            </span>
            <span className="summary-label">Total Usage</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{topComponents.length}</span>
            <span className="summary-label">Top Components</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">
              {Math.round(topComponents.reduce((sum, comp) => sum + comp.totalQuantity, 0) / topComponents.length)}
            </span>
            <span className="summary-label">Avg Usage</span>
          </div>
        </div>

        {/* Enhanced Components List */}
        <div className="components-list">
          {topComponents.map((comp, index) => {
            const maxUsage = Math.max(...topComponents.map(c => c.totalQuantity));
            const usagePercentage = (comp.totalQuantity / maxUsage) * 100;
            return (
              <div key={comp._id || comp.component?._id} className="component-card">
                <div className="component-rank">
                  <div className={`rank-badge rank-${index + 1}`}>
                    #{index + 1}
                  </div>
                </div>
                <div className="component-info">
                  <div className="component-details">
                    <div className="component-name">
                      {comp.component?.componentName || 'N/A'}
                    </div>
                    <div className="component-meta">
                      <span className="part-number">
                        <MdCode />
                        {comp.component?.partNumber || 'N/A'}
                      </span>
                      <span className="component-category">
                        <MdCategory />
                        {comp.component?.category || 'Electronics'}
                      </span>
                    </div>
                  </div>
                  <div className="usage-info">
                    <div className="usage-stats">
                      <span className="usage-number">{comp.totalQuantity.toLocaleString()}</span>
                      <span className="usage-label">units used</span>
                    </div>
                    <div className="usage-bar-container">
                      <div className="usage-bar">
                        <div
                          className="usage-fill"
                          style={{
                            width: `${usagePercentage}%`,
                            background: `hsl(${200 + index * 30}, 70%, 50%)`,
                          }}
                        ></div>
                      </div>
                      <span className="usage-percentage">{Math.round(usagePercentage)}%</span>
                    </div>
                  </div>
                </div>
                <div className="component-actions">
                  <button className="action-btn details-btn" title="View Details">
                    <MdInfo />
                  </button>
                  <button className="action-btn trend-btn" title="View Trends">
                    <MdTrendingUp />
                  </button>
                  <button className="action-btn inventory-btn" title="Check Inventory">
                    <MdInventory />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Usage Insights */}
        <div className="usage-insights">
          <div className="insight-card">
            <div className="insight-icon high-usage">
              <MdTrendingUp />
            </div>
            <div className="insight-content">
              <span className="insight-title">Highest Usage</span>
              <span className="insight-value">
                {topComponents[0]?.component?.componentName || 'N/A'}
              </span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon consistent">
              <MdTimeline />
            </div>
            <div className="insight-content">
              <span className="insight-title">Most Consistent</span>
              <span className="insight-value">
                {topComponents[Math.floor(topComponents.length / 2)]?.component?.componentName || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="no-data-state">
        <div className="no-data-illustration">
          <MdStorage className="no-data-icon" />
          <div className="no-data-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>
        <div className="no-data-content">
          <h3>No Usage Data Available</h3>
          <p>Component usage statistics will appear here once transactions are recorded in the system.</p>
          <button className="start-tracking-btn">
            <MdAdd />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Inline CSS for Top Components */}
  <style>{`
    .top-components-enhanced {
      background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      padding: 0;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .top-components-enhanced:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    .top-components-enhanced::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #3dc47e 50%, #fd7e14 100%);
    }
    .top-components-header {
      padding: 24px 24px 20px 24px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .title-icon-wrapper {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    .section-icon { color: white; font-size: 1.5rem; }
    .title-content { display: flex; flex-direction: column; }
    .section-title { font-size: 1.4rem; font-weight: 700; color: #1f2937; margin: 0 0 4px 0; letter-spacing: -0.02em; }
    .section-subtitle { font-size: 0.9rem; color: #6b7280; margin: 0; font-weight: 500; }
    .header-actions { display: flex; gap: 8px; }
    .view-all-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px;
      background: #667eea; color: white; border: none;
      border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .view-all-btn:hover { background: #5a67d8; transform: translateY(-1px);}
    .export-btn {
      width: 36px; height: 36px; background: #f1f5f9;
      border: 1px solid #e2e8f0; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #64748b; transition: all 0.2s;
    }
    .export-btn:hover { background: #e2e8f0; color: #667eea;}
    .components-content { padding: 24px; }
    .usage-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px; margin-bottom: 24px; padding: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px; border: 1px solid #e2e8f0;
    }
    .summary-item { text-align: center; padding: 8px; }
    .summary-number { display: block; font-size: 1.6rem; font-weight: 800; color: #1f2937; margin-bottom: 4px; }
    .summary-label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .components-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .component-card {
      display: flex; align-items: center; padding: 20px; background: white;
      border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.3s;
      position: relative; overflow: hidden;
    }
    .component-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: #cbd5e1;}
    .component-card::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
      background: linear-gradient(180deg, #667eea 0%, #3dc47e 100%);
      opacity: 0; transition: opacity 0.3s;
    }
    .component-card:hover::before { opacity: 1;}
    .component-rank { margin-right: 20px;}
    .rank-badge {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.9rem; color: white; position: relative;
    }
    .rank-badge.rank-1 { background: linear-gradient(135deg, #ffd700, #ffed4e); color: #1f2937; box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);}
    .rank-badge.rank-2 { background: linear-gradient(135deg, #c0c0c0, #e5e5e5); color: #1f2937; box-shadow: 0 4px 12px rgba(192,192,192,0.4);}
    .rank-badge.rank-3 { background: linear-gradient(135deg, #cd7f32, #daa520); box-shadow: 0 4px 12px rgba(205,127,50,0.4);}
    .rank-badge.rank-4, .rank-badge.rank-5 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 12px rgba(102,126,234,0.3);
    }
    .component-info { flex: 1; display: flex; justify-content: space-between; align-items: center; margin-right: 16px;}
    .component-details { flex: 1;}
    .component-name { font-size: 1.1rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; line-height: 1.3;}
    .component-meta { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
    .part-number, .component-category {
      display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: #6b7280; font-weight: 500;
    }
    .part-number svg, .component-category svg { font-size: 1rem;}
    .usage-info { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; min-width: 140px;}
    .usage-stats { text-align: right;}
    .usage-number { font-size: 1.4rem; font-weight: 800; color: #1f2937; display: block; line-height: 1.2;}
    .usage-label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;}
    .usage-bar-container { display: flex; align-items: center; gap: 8px; width: 100%;}
    .usage-bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;}
    .usage-fill {
      height: 100%; border-radius: 4px; transition: width 0.8s; position: relative;
    }
    .usage-fill::after {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%);}
    }
    .usage-percentage { font-size: 0.8rem; font-weight: 600; color: #6b7280; min-width: 32px;}
    .component-actions { display: flex; gap: 6px;}
    .action-btn { width: 32px; height: 32px; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 1rem;}
    .details-btn { background: #dbeafe; color: #1d4ed8;}
    .details-btn:hover { background: #bfdbfe;}
    .trend-btn { background: #dcfce7; color: #16a34a;}
    .trend-btn:hover { background: #bbf7d0;}
    .inventory-btn { background: #fef3c7; color: #d97706;}
    .inventory-btn:hover { background: #fde68a;}
    .usage-insights { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;}
    .insight-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; transition: all 0.2s;}
    .insight-card:hover { border-color: #cbd5e1; transform: translateY(-1px);}
    .insight-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;}
    .insight-icon.high-usage { background: #dbeafe; color: #1d4ed8;}
    .insight-icon.consistent { background: #dcfce7; color: #16a34a;}
    .insight-content { display: flex; flex-direction: column;}
    .insight-title { font-size: 0.8rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .insight-value { font-size: 1rem; color: #1f2937; font-weight: 700; margin-top: 2px;}
    .no-data-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
    .no-data-illustration { position: relative; margin-bottom: 24px;}
    .no-data-icon { font-size: 4rem; color: #9ca3af; z-index: 2; position: relative;}
    .no-data-content h3 { color: #374151; font-size: 1.3rem; font-weight: 700; margin: 0 0 8px 0;}
    .no-data-content p { color: #6b7280; font-size: 1rem; margin: 0 0 24px 0; max-width: 400px; line-height: 1.5;}
    .start-tracking-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 1rem;}
    .start-tracking-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(102,126,234,0.3);}
    @media (max-width: 768px) {
      .top-components-header { flex-direction: column; align-items: flex-start; gap: 16px; padding: 20px; }
      .header-actions { align-self: stretch; justify-content: space-between;}
      .view-all-btn { flex: 1; justify-content: center;}
      .component-card { flex-direction: column; align-items: flex-start; gap: 16px; padding: 16px;}
      .component-info { width: 100%; flex-direction: column; align-items: flex-start; gap: 12px;}
      .usage-info { width: 100%; align-items: flex-start;}
      .usage-stats { text-align: left;}
      .component-actions { align-self: flex-end; }
      .usage-summary { grid-template-columns: repeat(2, 1fr);}
      .usage-insights { grid-template-columns: 1fr;}
    }
    @media (max-width: 480px) {
      .components-content { padding: 16px;}
      .usage-summary { grid-template-columns: 1fr; text-align: center;}
      .component-meta { flex-direction: column; align-items: flex-start; gap: 8px;}
    }
  `}</style>
            </div>


            {/* Enhanced User Activity - Admin Only */}
{user && user.role === 'Admin' && (
  <div className="dashboard-section user-activity-enhanced">
    <div className="user-activity-header">
      <div className="header-content">
        <div className="title-icon-wrapper">
          <MdHistory className="section-icon" />
        </div>
        <div className="title-content">
          <h2 className="section-title">User Activity</h2>
          <p className="section-subtitle">Team performance and engagement metrics</p>
        </div>
      </div>
      <div className="header-actions">
        <div className="activity-filter">
          <button className="filter-btn active" data-filter="all">All</button>
          <button className="filter-btn" data-filter="today">Today</button>
          <button className="filter-btn" data-filter="week">Week</button>
        </div>
        <button className="export-btn">
          <MdGetApp />
        </button>
      </div>
    </div>

    <div className="activity-content">
      {userActivityData ? (
        <>
          {/* Activity Overview Stats */}
          <div className="activity-overview">
            <div className="overview-stat">
              <div className="stat-icon transactions">
                <MdSwapHoriz />
              </div>
              <div className="stat-content">
                <span className="stat-number">
                  {userActivityData.userActivity.reduce((sum, activity) => 
                    sum + activity.inwardTransactions + activity.outwardTransactions, 0
                  ).toLocaleString()}
                </span>
                <span className="stat-label">Total Transactions</span>
              </div>
            </div>
            
            <div className="overview-stat">
              <div className="stat-icon active-users">
                <MdPeople />
              </div>
              <div className="stat-content">
                <span className="stat-number">{userActivityData.recentlyActiveUsers.length}</span>
                <span className="stat-label">Active Users</span>
              </div>
            </div>
            
            <div className="overview-stat">
              <div className="stat-icon total-value">
                <MdAttachMoney />
              </div>
              <div className="stat-content">
                <span className="stat-number">
                  {formatCurrency(userActivityData.userActivity.reduce((sum, activity) => 
                    sum + (activity.totalValueHandled || 0), 0
                  ))}
                </span>
                <span className="stat-label">Total Value</span>
              </div>
            </div>
          </div>

          {/* Transaction Activity Section */}
          <div className="activity-section">
            <div className="section-header">
              <div className="section-title-group">
                <MdBarChart className="section-icon-small" />
                <h3>Transaction Activity</h3>
              </div>
              <span className="activity-count">{userActivityData.userActivity.length} users</span>
            </div>
            
            {userActivityData.userActivity.length > 0 ? (
              <div className="transaction-cards">
                {userActivityData.userActivity.map((activity, index) => {
                  const totalTransactions = activity.inwardTransactions + activity.outwardTransactions;
                  const inwardPercentage = totalTransactions ? (activity.inwardTransactions / totalTransactions) * 100 : 0;
                  const outwardPercentage = totalTransactions ? (activity.outwardTransactions / totalTransactions) * 100 : 0;
                  
                  return (
                    <div key={activity._id} className="transaction-card">
                      <div className="card-header">
                        <div className="user-profile">
                          <div className="user-avatar">
                            <span className="avatar-text">
                              {activity.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                            <div className="status-indicator active"></div>
                          </div>
                          <div className="user-info">
                            <span className="user-name">{activity.userName}</span>
                            <span className="user-role">{activity.userRole}</span>
                          </div>
                        </div>
                        <div className="performance-badge">
                          <MdTrendingUp />
                          <span>
                            {index === 0 ? 'Top' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="transaction-stats">
                        <div className="stat-row">
                          <div className="stat-item inward">
                            <div className="stat-icon">
                              <MdArrowDownward />
                            </div>
                            <div className="stat-details">
                              <span className="stat-number">{activity.inwardTransactions}</span>
                              <span className="stat-label">Inward</span>
                            </div>
                            <div className="stat-percentage">{Math.round(inwardPercentage)}%</div>
                          </div>
                          
                          <div className="stat-item outward">
                            <div className="stat-icon">
                              <MdArrowUpward />
                            </div>
                            <div className="stat-details">
                              <span className="stat-number">{activity.outwardTransactions}</span>
                              <span className="stat-label">Outward</span>
                            </div>
                            <div className="stat-percentage">{Math.round(outwardPercentage)}%</div>
                          </div>
                        </div>
                        
                        <div className="transaction-bar">
                          <div className="bar-fill inward-fill" style={{width: `${inwardPercentage}%`}}></div>
                          <div className="bar-fill outward-fill" style={{width: `${outwardPercentage}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="summary-stats">
                        <div className="summary-item">
                          <span className="summary-label">Total Units</span>
                          <span className="summary-value">{activity.totalQuantityHandled?.toLocaleString() || 0}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Total Value</span>
                          <span className="summary-value">{formatCurrency(activity.totalValueHandled || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-data-message">No user transaction activity found.</div>
            )}
          </div>

          {/* Recently Active Users Section */}
          <div className="activity-section">
            <div className="section-header">
              <div className="section-title-group">
                <MdAccessTime className="section-icon-small" />
                <h3>Recently Active Users</h3>
              </div>
              <span className="activity-count">{userActivityData.recentlyActiveUsers.length} online</span>
            </div>
            
            {userActivityData.recentlyActiveUsers.length > 0 ? (
              <div className="recent-users-grid">
                {userActivityData.recentlyActiveUsers.map(user => {
                  const lastLogin = new Date(user.lastLogin);
                  const now = new Date();
                  const diffInMinutes = Math.floor((now - lastLogin) / (1000 * 60));
                  const timeAgo = diffInMinutes < 60 ? 
                    `${diffInMinutes}m ago` : 
                    diffInMinutes < 1440 ? 
                    `${Math.floor(diffInMinutes / 60)}h ago` : 
                    `${Math.floor(diffInMinutes / 1440)}d ago`;
                  
                  return (
                    <div key={user._id} className="recent-user-card">
                      <div className="user-card-header">
                        <div className="user-avatar-large">
                          <span className="avatar-text">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                          <div className={`status-indicator ${diffInMinutes < 30 ? 'online' : 'away'}`}></div>
                        </div>
                        <div className="user-details">
                          <span className="user-name-large">{user.name}</span>
                          <span className="user-role-badge">{user.role}</span>
                        </div>
                      </div>
                      
                      <div className="user-activity-info">
                        <div className="activity-time">
                          <MdSchedule />
                          <span>Last seen {timeAgo}</span>
                        </div>
                        <div className="login-details">
                          <span className="login-date">{lastLogin.toLocaleDateString()}</span>
                          <span className="login-time">{lastLogin.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-data-message">No recently active users found.</div>
            )}
          </div>
        </>
      ) : (
        <div className="no-data-state">
          <div className="no-data-illustration">
            <MdHistory className="no-data-icon" />
            <div className="access-denied-badge">
              <MdLock />
            </div>
          </div>
          <div className="no-data-content">
            <h3>Loading User Activity...</h3>
            <p>Fetching user activity and performance metrics.</p>
          </div>
        </div>
      )}
    </div>

    {/* Enhanced Inline CSS */}
    <style>{`
      .user-activity-enhanced {
        background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        border-radius: 16px;
        padding: 0;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .user-activity-enhanced:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .user-activity-enhanced::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #3dc47e 100%);
      }

      /* Header Styles */
      .user-activity-header {
        padding: 24px 24px 20px 24px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .title-icon-wrapper {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .section-icon {
        color: white;
        font-size: 1.5rem;
      }

      .title-content {
        display: flex;
        flex-direction: column;
      }

      .section-title {
        font-size: 1.4rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 4px 0;
        letter-spacing: -0.02em;
      }

      .section-subtitle {
        font-size: 0.9rem;
        color: #6b7280;
        margin: 0;
        font-weight: 500;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .activity-filter {
        display: flex;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 2px;
      }

      .filter-btn {
        padding: 6px 12px;
        background: transparent;
        border: none;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #6b7280;
      }

      .filter-btn.active {
        background: #667eea;
        color: white;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
      }

      .filter-btn:not(.active):hover {
        background: #f8fafc;
        color: #374151;
      }

      .export-btn {
        width: 36px;
        height: 36px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s ease;
      }

      .export-btn:hover {
        background: #e2e8f0;
        color: #667eea;
      }

      /* Content Styles */
      .activity-content {
        padding: 24px;
      }

      /* Activity Overview */
      .activity-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
        padding: 20px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .overview-stat {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: white;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
      }

      .overview-stat:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
      }

      .stat-icon.transactions {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .stat-icon.active-users {
        background: #dcfce7;
        color: #16a34a;
      }

      .stat-icon.total-value {
        background: #fef3c7;
        color: #d97706;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-number {
        font-size: 1.6rem;
        font-weight: 800;
        color: #1f2937;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 0.8rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      /* Activity Sections */
      .activity-section {
        margin-bottom: 32px;
      }

      .activity-section:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-icon-small {
        font-size: 1.2rem;
        color: #667eea;
      }

      .section-header h3 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }

      .activity-count {
        font-size: 0.85rem;
        color: #6b7280;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 600;
      }

      /* Transaction Cards */
      .transaction-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
      }

      .transaction-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .transaction-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        border-color: #cbd5e1;
      }

      .transaction-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #667eea 0%, #3dc47e 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .transaction-card:hover::before {
        opacity: 1;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-avatar {
        position: relative;
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .avatar-text {
        color: white;
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: 0.5px;
      }

      .status-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        border: 2px solid white;
        border-radius: 50%;
      }

      .status-indicator.active {
        background: #10b981;
      }

      .status-indicator.online {
        background: #10b981;
        animation: pulse-online 2s infinite;
      }

      .status-indicator.away {
        background: #f59e0b;
      }

      @keyframes pulse-online {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }

      .user-info {
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-weight: 700;
        color: #1f2937;
        font-size: 1rem;
        line-height: 1.2;
      }

      .user-role {
        font-size: 0.85rem;
        color: #6b7280;
        text-transform: capitalize;
        font-weight: 500;
      }

      .performance-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        color: #16a34a;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
      }

      /* Transaction Stats */
      .transaction-stats {
        margin-bottom: 16px;
      }

      .stat-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .stat-item.inward {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      }

      .stat-item.outward {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      }

      .stat-item .stat-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
      }

      .stat-item.inward .stat-icon {
        background: #1d4ed8;
        color: white;
      }

      .stat-item.outward .stat-icon {
        background: #16a34a;
        color: white;
      }

      .stat-details {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .stat-details .stat-number {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1f2937;
        line-height: 1.2;
      }

      .stat-details .stat-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .stat-percentage {
        font-size: 0.8rem;
        font-weight: 600;
        color: #374151;
      }

      .transaction-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        display: flex;
      }

      .bar-fill {
        height: 100%;
        transition: width 0.8s ease;
      }

      .inward-fill {
        background: linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%);
      }

      .outward-fill {
        background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
      }

      /* Summary Stats */
      .summary-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid #f1f5f9;
      }

      .summary-item {
        text-align: center;
      }

      .summary-label {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .summary-value {
        font-size: 1rem;
        font-weight: 700;
        color: #1f2937;
      }

      /* Recent Users Grid */
      .recent-users-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .recent-user-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;
      }

      .recent-user-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        border-color: #cbd5e1;
      }

      .user-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .user-avatar-large {
        position: relative;
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .user-details {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .user-name-large {
        font-weight: 700;
        color: #1f2937;
        font-size: 0.95rem;
        line-height: 1.2;
      }

      .user-role-badge {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: capitalize;
        font-weight: 500;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        width: fit-content;
        margin-top: 2px;
      }

      .user-activity-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .activity-time {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #6b7280;
        font-weight: 500;
      }

      .activity-time svg {
        font-size: 1rem;
      }

      .login-details {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: #9ca3af;
      }

      .login-date {
        font-weight: 500;
      }

      .login-time {
        font-weight: 600;
      }

      /* No Data State */
      .no-data-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
      }

      .no-data-illustration {
        position: relative;
        margin-bottom: 24px;
      }

      .no-data-icon {
        font-size: 4rem;
        color: #d1d5db;
        z-index: 1;
        position: relative;
      }

      .access-denied-badge {
        position: absolute;
        bottom: -8px;
        right: -8px;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1rem;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }

      .no-data-content h3 {
        color: #374151;
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0 0 8px 0;
      }

      .no-data-content p {
        color: #6b7280;
        font-size: 1rem;
        margin: 0 0 24px 0;
        max-width: 400px;
        line-height: 1.5;
      }

      .no-data-message {
        text-align: center;
        color: #6b7280;
        font-style: italic;
        padding: 20px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px dashed #d1d5db;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .user-activity-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
        }

        .header-actions {
          align-self: stretch;
          justify-content: space-between;
        }

        .activity-filter {
          flex: 1;
        }

        .filter-btn {
          flex: 1;
          text-align: center;
        }

        .activity-overview {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px;
        }

        .transaction-cards {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .recent-users-grid {
          grid-template-columns: 1fr;
        }

        .stat-row {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .summary-stats {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }

      @media (max-width: 480px) {
        .activity-content {
          padding: 16px;
        }

        .activity-overview {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .transaction-card {
          padding: 16px;
        }

        .section-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .activity-count {
          align-self: stretch;
          text-align: center;
        }
      }
    `}</style>
  </div>
)}

{/* System Stats - Admin Only */}
{user && user.role === 'Admin' && (
  <div className="dashboard-section system-stats-enhanced">
    <div className="system-stats-header">
      <div className="header-content">
        <div className="title-icon-wrapper">
          <MdSettingsApplications className="section-icon" />
        </div>
        <div className="title-content">
          <h2 className="section-title">System Statistics</h2>
          <p className="section-subtitle">Overview of users, inventory, and utilization</p>
        </div>
      </div>
    </div>

    <div className="stats-content">
      {systemStatsData ? (
        <>
          {/* Quick Grid Summary */}
          <div className="stats-overview-grid">
            <div className="stat-card users">
              <span className="stat-card-title">Users</span>
              <div className="stat-figures">
                <div>
                  <span className="stat-num">{systemStatsData.users.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div>
                  <span className="stat-num success">{systemStatsData.users.active}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div>
                  <span className="stat-num muted">{systemStatsData.users.inactive}</span>
                  <span className="stat-label">Inactive</span>
                </div>
              </div>
            </div>
            <div className="stat-card components">
              <span className="stat-card-title">Components</span>
              <div className="stat-figures">
                <div>
                  <span className="stat-num">{systemStatsData.components.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div>
                  <span className="stat-num success">{systemStatsData.components.active}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div>
                  <span className="stat-num warning">{systemStatsData.components.obsolete}</span>
                  <span className="stat-label">Obsolete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Storage by Category */}
          <div className="category-section">
            <div className="category-section-header">
              <h3>Storage by Category</h3>
            </div>
            {systemStatsData.storageByCategory.length > 0 ? (
              <ul className="category-bar-list">
                {systemStatsData.storageByCategory.map((cat, i) => {
                  const maxQty = Math.max(...systemStatsData.storageByCategory.map(c => c.totalQuantity));
                  const percent = Math.round(100 * (cat.totalQuantity / (maxQty || 1)));
                  // Use color cycling for bars
                  const barColor = `hsl(${200 + i*38}, 66%, 53%)`;
                  return (
                    <li className="category-bar-row" key={cat._id}>
                      <span className="cat-label">
                        <span className="cat-dot" style={{ background: barColor }}></span>
                        <strong>{cat._id || 'Uncategorized'}</strong>
                      </span>
                      <div className="cat-bar-track">
                        <div className="cat-bar-fill" style={{ width: `${percent}%`, background: barColor }} />
                      </div>
                      <span className="cat-bar-percent">
                        {cat.totalQuantity} units
                      </span>
                      <span className="cat-bar-value">
                        ({formatCurrency ? formatCurrency(cat.totalValue) : cat.totalValue.toLocaleString()})
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="no-data-message">No category data.</div>
            )}
          </div>
        </>
      ) : (
        <div className="no-data-message">Loading system statistics...</div>
      )}
    </div>

    {/* --- Modern Inline CSS --- */}
    <style>{`
      .system-stats-enhanced {
        background: linear-gradient(135deg, #fff 0%, #fafbfc 100%);
        border: 1.5px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.05);
        padding: 0;
        overflow: hidden;
        position: relative;
        margin-bottom: 10px;
      }
      .system-stats-header {
        padding: 24px 24px 18px 24px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .title-icon-wrapper {
        width: 48px; height: 48px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px #667eea33;
      }
      .section-icon { color: white; font-size: 1.5rem; }
      .title-content { display: flex; flex-direction: column; }
      .section-title { font-size: 1.3rem; font-weight: 700; color: #1f2937; margin: 0; }
      .section-subtitle { font-size: 0.92rem; color: #6b7280; margin: 4px 0 0 0; font-weight: 500;}

      .stats-content { padding: 24px; }

      /* Stats overview grid */
      .stats-overview-grid {
        display: flex;
        gap: 22px;
        margin-bottom: 36px;
        flex-wrap: wrap;
      }
      .stat-card {
        flex: 1 1 260px;
        min-width: 220px;
        background: #fff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 2px 9px #667eea17;
        display: flex; flex-direction: column; padding: 20px; gap: 1px;
      }

      .stat-card.users .stat-card-title { color: #4651b4 }
      .stat-card.components .stat-card-title { color: #3dc468 }
      .stat-card-title {
        font-size: 1.09rem;
        letter-spacing: 0.6px;
        font-weight: 800;
        margin-bottom: 3px;
      }
      .stat-figures { display: flex; flex-direction: row; gap: 21px; margin-top: 2px;}
      .stat-num { font-size: 1.58rem; font-weight: 700; color: #2a2c40; }
      .stat-num.success { color: #16a34a; }
      .stat-num.warning { color: #fd9800; }
      .stat-num.muted { color: #748093; }
      .stat-label { font-size: 0.81rem; color: #8ca6c0; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;}
      .stat-figures div { text-align: center; border-right: 1px solid #e7e7ea; padding: 0 11px;}
      .stat-figures div:last-child { border-right: none; }

      /* Category storage section */
      .category-section { margin-top: 18px; background: #fff; border-radius: 12px; box-shadow: 0 2px 9px #8398a017; padding: 18px 14px 13px 14px; border: 1px solid #ececec;}
      .category-section-header h3 { margin: 0 0 13px 0; color: #34425b; font-size: 1.12rem; font-weight: 700; letter-spacing: 0.1px; }
      .category-bar-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 13px;}
      .category-bar-row {
        display: flex; align-items: center; gap: 13px; margin-bottom: 0;
        flex-wrap: wrap;
      }
      .cat-label {
        min-width: 125px;
        font-size: 1em;
        color: #34426f;
        font-weight: 600;
        display: flex; align-items: center; gap: 8px;
      }
      .cat-dot {
        display: inline-block;
        width: 13px; height: 13px;
        border-radius: 60%;
        border: 2.2px solid #fff;
        margin-right: 2px;
        box-shadow: 0 0.5px 3px rgba(0,0,0,0.05)
      }
      .cat-bar-track { background: #f0f4fa; width: 100%; height: 13px; border-radius: 7px; overflow: hidden; position: relative; margin: 0 3px;}
      .cat-bar-fill {
        height: 100%;
        border-radius: 7px;
        min-width: 4%;
        transition: width 0.6s;
        max-width: 100%;
        box-shadow: 0 1px 6px #8aeaff25 inset;
      }
      .cat-bar-percent {
        min-width: 82px;
        font-size: .99em;
        color: #283040;
        font-weight: 500;
      }
      .cat-bar-value {
        font-size: 0.96em;
        color: #535e7c;
        padding-left: 0px;
        font-weight: 500;
        flex-shrink: 0;

      }
      .no-data-message {
        font-size: 1.02em;
        line-height: 1.8;
        background: #f5f7fa;
        border: 1.3px dashed #e4e8f3;
        border-radius: 9px;
        color: #7a8499;
        padding: 21px 0;
        text-align: center;
        margin-top: 12px;
      }

      @media (max-width: 900px) {
        .stats-content { padding: 12px 0; }
        .stats-overview-grid { flex-direction: column; gap: 16px;}
        .stat-card { padding: 13px 7px; }
        .category-section { padding: 10px 5px 7px 8px;}
        .cat-label { min-width: 80px;}
      }
      @media (max-width: 600px) {
        .section-title, .title-content h2 { font-size: 1.1rem; }
        .cat-label { min-width: 52px; font-size: 0.92rem;}
        .stats-content { padding: 5px 2px; }
      }
    `}</style>
  </div>
)}



            

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
                      <span className="dot-anim">• • •</span> Analyzing your inventory with AI...
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
  --spacing-sm: 10px;
  --spacing-md: 18px;
  --spacing-lg: 30px;
  --spacing-xl: 44px;

  /* Section/Gaps */
  --section-gap: 34px;

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

@media (max-width: 1200px) {
  .homepage-content {
    padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
  }
}
@media (max-width: 900px) {
  .homepage-content {
    padding: var(--spacing-md) 4vw var(--spacing-sm) 4vw;
  }
}
@media (max-width: 600px) {
  .homepage-content {
    padding: var(--spacing-md) 3vw var(--spacing-sm) 3vw;
  }
}


/* ========== SECTION SPACING/ALIGNMENT ========== */
.dashboard-grid,
.full-width-chart-section,
.full-width-section {
  margin-bottom: var(--section-gap);
}

/* Remove gap after last dashboard section */
.dashboard-grid:last-child,
.full-width-chart-section:last-child,
.full-width-section:last-child {
  margin-bottom: 0 !important;
}

/* If you stack several full-width-sections, keep spacing between */
.full-width-chart-section + .full-width-chart-section,
.full-width-section + .full-width-section {
  margin-top: var(--section-gap);
}

/* Add consistent vertical rhythm above AND below full-width sections */
.dashboard-grid + .full-width-chart-section,
.dashboard-section + .full-width-chart-section,
.full-width-chart-section + .dashboard-grid,
.full-width-section + .dashboard-grid,
.dashboard-section + .full-width-section {
  margin-top: var(--section-gap);
}
.full-width-chart-section + .dashboard-section,
.full-width-section + .dashboard-section {
  margin-top: var(--section-gap);
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
}

/* ========== CARDS/SECTIONS ========== */
.dashboard-section {
  background: var(--card-bg);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
  min-width: 0;
  overflow: hidden;
  transition: var(--transition-bounce);
  position: relative;
}

.dashboard-section:not(:last-child) {
  margin-bottom: var(--spacing-lg);
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

/* ========== CHART SECTIONS (For legacy) ========== */
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

.chart-card:not(:last-child),
.monthly-stats-card:not(:last-child),
.daily-trends-card:not(:last-child),
.chart-section:not(:last-child) {
  margin-bottom: var(--section-gap);
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

/* ========== FULL WIDTH CHART SECTION ========== */
.full-width-chart-section {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: var(--main-bg, #fafbfc);
  padding: 0;
  margin-bottom: var(--section-gap);
}
.full-width-chart-section:last-child {
  margin-bottom: 0;
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

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.homepage-error { color: var(--danger-red); }

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
}
@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
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

/* ========== SECTION VERTICAL GAP FIXES ========== */
.dashboard-grid + .full-width-chart-section,
.full-width-chart-section + .dashboard-grid,
.full-width-chart-section + .full-width-section,
.dashboard-grid + .full-width-section {
  margin-top: var(--section-gap);
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
.homepage-content::-webkit-scrollbar { width: 6px; }
.homepage-content::-webkit-scrollbar-track { background: transparent; }
.homepage-content::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px;}
.homepage-content::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }
  `}</style>
  );
}


function SmartAssessmentCSS() {
  return (
    <style>{`
/* ========================================= */
/* ===== SMART ASSESSMENT MODAL STYLES ===== */
/* ========================================= */

/* Using global variables defined in src/index.css and App.css for consistency */
/* --primary-blue, --light-blue, --text-dark, --text-light, --bg-light, --bg-white, --border-light, --shadow-light */
/* Additionally: --primary, --danger, --success, --warning from App.css root */

/* ========== SMART ASSESSMENT BUTTON ========== */
.smart-assessment-btn {
  /* Colors & Background */
  background: linear-gradient(135deg, #FFD700 0%, #FFED4E 100%); /* Gold/Yellow gradient for prominence */
  color: #2d3748; /* Dark text for contrast on yellow */
  border: none;
  
  /* Spacing & Layout */
  padding: 12px 24px 12px 20px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px; /* Space between icon and text */
  position: relative; /* For shimmer effect */
  overflow: hidden; /* For shimmer effect */
  margin-left: 20px; /* Using explicit px for clarity if --spacing-lg isn't defined globally */

  /* Typography */
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* Subtle text shadow */

  /* Interactivity & Transitions */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth transition */
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.25); /* Initial shadow */
}

/* Shimmer effect for button */
.smart-assessment-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease; /* Smooth shimmer movement */
}

.smart-assessment-btn:hover::before {
  left: 100%; /* Move shimmer across */
}

.smart-assessment-btn:hover {
  box-shadow: 0 6px 24px rgba(255, 215, 0, 0.4); /* Enhanced shadow on hover */
  transform: translateY(-2px); /* Slight lift effect */
  filter: brightness(1.05); /* Slightly brighter on hover */
}

.smart-assessment-btn:active {
  transform: translateY(0); /* Press down effect */
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3); /* Reduced shadow on active */
}

/* ========== MODAL BACKGROUND ========== */
.smart-assessment-modal-bg {
  position: fixed; /* Fixed position for overlay */
  z-index: 9999; /* Ensure it's on top of everything */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5); /* Slightly darker overlay for better contrast */
  backdrop-filter: blur(5px); /* Stronger blur for modern look */
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modalBgFadeIn 0.3s ease-out forwards; /* Keep final state */
}

@keyframes modalBgFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(5px);
  }
}

/* ========== MODAL CONTAINER ========== */
.smart-assessment-modal {
  background: linear-gradient(135deg, var(--bg-white) 0%, #FAFAFC 100%); /* White to very light grey gradient */
  padding: 28px 32px 24px 32px; /* Consistent padding */
  border-radius: 20px; /* Significantly rounded corners for modern modal */
  min-width: 450px; /* Slightly larger min-width */
  max-width: 90vw;
  max-height: 85vh;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2); /* Deeper shadow for modal */
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; /* Smooth entry animation */
  border: 1px solid rgba(255, 255, 255, 0.4); /* Softer white border */
  position: relative;
  overflow: hidden; /* Hide any overflow from content/header */
}

.smart-assessment-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px; /* Thicker accent line */
  background: linear-gradient(90deg, #FFD700 0%, var(--primary-blue) 50%, var(--success) 100%); /* Vibrant gradient accent */
  z-index: 1; /* Ensure it's above internal content */
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-30px); /* Slightly more pronounced slide-in */
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ========== MODAL HEADER ========== */
.smart-assessment-modal-header {
  font-size: 1.4rem; /* Slightly larger header font */
  font-weight: 700;
  color: var(--text-dark); /* Darker text for header */
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px; /* More space below header */
  padding-bottom: 15px; /* More space for bottom border */
  border-bottom: 2px solid var(--border-light); /* Consistent border style */
  letter-spacing: -0.02em;
}

.smart-assessment-modal-header svg {
  margin-right: 12px; /* More space for icon */
  font-size: 1.6rem; /* Larger icon */
  color: #FFD700; /* Icon color matching button accent */
  filter: drop-shadow(0 3px 6px rgba(255, 215, 0, 0.4)); /* Stronger drop shadow for icon */
}

.smart-assessment-close {
  font-size: 2rem; /* Larger close icon */
  cursor: pointer;
  margin-left: 25px; /* More space from title */
  color: var(--text-light); /* Lighter grey for subtle appearance */
  font-weight: 400;
  transition: all 0.3s ease;
  width: 40px; /* Larger hit area */
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* Circular close button */
  background: transparent;
  flex-shrink: 0; /* Prevent shrinking */
}

.smart-assessment-close:hover {
  color: var(--danger); /* Red on hover */
  background: #FEF2F2; /* Light red background on hover */
  transform: scale(1.15); /* More pronounced hover scale */
}

/* ========== MODAL BODY ========== */
.smart-assessment-modal-body {
  flex: 1;
  overflow-y: auto; /* Enable scrolling for content */
  min-height: 100px;
  font-size: 1rem; /* Base font size, slightly adjusted */
  line-height: 1.7; /* Increased line height for readability */
  padding-right: 10px; /* Space for scrollbar */
  color: var(--text-dark); /* Consistent text color */
}

.smart-assessment-modal-body::-webkit-scrollbar {
  width: 8px; /* Slightly wider scrollbar */
}

.smart-assessment-modal-body::-webkit-scrollbar-track {
  background: var(--bg-light); /* Light background for track */
  border-radius: 4px;
}

.smart-assessment-modal-body::-webkit-scrollbar-thumb {
  background: #CBD5E1; /* Light grey thumb */
  border-radius: 4px;
}

.smart-assessment-modal-body::-webkit-scrollbar-thumb:hover {
  background: #94A3B8; /* Darker grey on hover */
}

/* ========== LOADING STATE ========== */
.assessment-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px; /* More vertical padding */
  color: var(--primary-blue); /* Consistent blue */
  text-align: center;
  font-weight: 600;
  font-size: 1.15rem; /* Slightly larger font */
  gap: 18px; /* More space between elements */
}

.assessment-loader::before {
  content: '';
  width: 50px; /* Larger spinner */
  height: 50px;
  border: 4px solid rgba(102, 126, 234, 0.2); /* Thicker border with blue tint */
  border-top: 4px solid var(--primary-blue); /* Primary blue top border */
  border-radius: 50%;
  animation: assessmentSpin 1s linear infinite;
}

@keyframes assessmentSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dot-anim {
  letter-spacing: 4px; /* More pronounced dot spacing */
  font-size: 1.4rem; /* Larger dots */
  animation: dotBlink 1.5s ease-in-out infinite;
  color: #FFD700; /* Gold color for dots */
  font-weight: 700;
}

@keyframes dotBlink {
  0%, 20% { opacity: 0.3; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0.3; }
}

/* ========== ERROR STATE ========== */
.assessment-error {
  color: var(--danger); /* Consistent red color */
  background: linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%); /* Light red gradient */
  border: 1px solid #FECACA; /* Red border */
  border-radius: 12px; /* Consistent border radius */
  text-align: center;
  padding: 24px 20px; /* More padding */
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.15); /* Stronger error shadow */
  font-size: 1rem;
}

/* ========== SUCCESS STATE (Assessment Report) ========== */
.assessment-report-beautify {
  background: linear-gradient(135deg, #FFFBEB 0%, #FDF3C7 100%); /* Light yellow/orange gradient */
  border: 1px solid #FDE68A; /* Orange border */
  border-radius: 18px; /* More rounded corners */
  padding: 28px 24px 20px 32px; /* Adjusted padding */
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15); /* Stronger success shadow */
  position: relative;
}

.assessment-report-beautify::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #FFD700 0%, #F59E0B 100%); /* Gold to orange gradient stripe */
  border-radius: 18px 0 0 18px; /* Matches container border-radius */
}

.assessment-title {
  font-weight: 700;
  color: #1F2937; /* Darker heading text */
  font-size: 1.4rem; /* Larger title */
  margin-bottom: 18px;
  text-align: left;
  letter-spacing: -0.02em;
  padding-bottom: 10px;
  border-bottom: 2px solid #FDE68A; /* Matching border color */
}

.assessment-section-label {
  font-weight: 700;
  font-size: 1.15rem; /* Slightly larger section labels */
  color: #374151; /* Darker text */
  margin: 24px 0 14px 0; /* More spacing */
  display: flex;
  align-items: center;
  gap: 10px; /* More space for icon */
  padding: 10px 15px; /* More padding */
  background: rgba(255, 255, 255, 0.7); /* Slightly more opaque background */
  border-radius: 10px; /* More rounded */
  border-left: 5px solid; /* Thicker left border */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* Subtle shadow on labels */
}

/* Dynamic border-left-color for labels */
.assessment-section-label:nth-of-type(1) { border-left-color: var(--danger); } /* Red */
.assessment-section-label:nth-of-type(2) { border-left-color: var(--warning); } /* Orange */
.assessment-section-label:nth-of-type(3) { border-left-color: var(--success); } /* Green */
/* Additional types could be added with more specific colors */

.assessment-ul {
  padding-left: 25px; /* Increased indent */
  margin: 0 0 18px 0;
  font-size: 1rem;
  list-style: none; /* Remove default bullets */
}

.assessment-list-item {
  margin: 0 0 14px 0; /* More space between list items */
  line-height: 1.7; /* Consistent line height */
  color: #374151; /* Darker text */
  font-size: 1rem;
  letter-spacing: 0.01em;
  padding: 10px 15px; /* More padding */
  border-radius: 10px; /* More rounded */
  transition: all 0.2s ease;
  position: relative;
  padding-left: 35px; /* Space for custom bullet */
  background: rgba(255, 255, 255, 0.5); /* Subtle background for items */
}

.assessment-list-item::before {
  content: '•';
  position: absolute;
  left: 15px; /* Adjusted position */
  color: #6b7280; /* Consistent bullet color */
  font-weight: 700;
  font-size: 1.3rem; /* Larger bullet */
}

.assessment-list-item:hover {
  background: rgba(255, 255, 255, 0.9); /* More opaque on hover */
  transform: translateX(5px); /* More pronounced slide effect */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08); /* Subtle shadow on hover */
}

.assessment-highlight {
  color: var(--danger); /* Consistent red */
  background: linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%); /* Light red gradient */
  border: 1px solid #FECACA; /* Red border */
  border-radius: 10px; /* More rounded */
  font-weight: 700;
  padding: 14px 18px; /* More padding */
  margin: 10px 0;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.15); /* Stronger shadow */
  line-height: 1.5;
}

.assessment-highlight::before {
  content: '⚠️';
  margin-right: 10px; /* More space for icon */
}

.assessment-warn {
  color: var(--warning); /* Consistent orange */
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); /* Light yellow/orange gradient */
  border: 1px solid #FDE68A; /* Orange border */
  border-radius: 10px; /* More rounded */
  font-weight: 600;
  padding: 14px 18px; /* More padding */
  margin: 10px 0;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15); /* Stronger shadow */
  line-height: 1.5;
}

.assessment-warn::before {
  content: '⚡';
  margin-right: 10px; /* More space for icon */
}

.assessment-info {
  color: var(--text-light); /* Lighter info text */
  text-align: center;
  margin-bottom: 25px; /* More space */
  font-style: italic;
  font-size: 1.05rem; /* Slightly larger */
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 900px) {
  .smart-assessment-btn {
    margin-left: 0;
    margin-top: 15px; /* More space */
    width: 100%;
    justify-content: center;
  }
  .smart-assessment-modal {
    min-width: unset; /* Allow shrinking */
    width: 95vw;
    margin: 20px;
    padding: 20px;
  }
}

@media (max-width: 600px) {
  .smart-assessment-modal {
    padding: 16px 18px 12px 18px; /* Reduced padding */
    border-radius: 16px; /* Slightly less rounded */
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  }
  
  .smart-assessment-modal-header {
    font-size: 1.2rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 10px;
  }
  
  .smart-assessment-close {
    position: absolute;
    top: 12px;
    right: 12px;
    margin: 0;
    width: 32px;
    height: 32px;
    font-size: 1.6rem;
  }
  
  .assessment-report-beautify {
    padding: 18px 14px 14px 24px;
    border-radius: 14px;
  }
  
  .assessment-title {
    font-size: 1.2rem;
    margin-bottom: 14px;
  }

  .assessment-section-label {
    font-size: 1.05rem;
    padding: 8px 10px;
    margin: 18px 0 10px 0;
  }
  
  .assessment-ul {
    padding-left: 18px;
  }

  .assessment-list-item {
    padding: 6px 10px 6px 28px;
    font-size: 0.95rem;
  }

  .assessment-list-item::before {
    left: 10px;
    font-size: 1.1rem;
  }

  .assessment-highlight, .assessment-warn {
    padding: 10px 12px;
    font-size: 0.95rem;
  }

  .assessment-loader {
    padding: 30px 10px;
    font-size: 1rem;
    gap: 12px;
  }

  .assessment-loader::before {
    width: 35px;
    height: 35px;
    border-width: 3px;
  }

  .dot-anim {
    font-size: 1.1rem;
  }
}

/* ========== PRINT STYLES ========== */
@media print {
  .smart-assessment-modal-bg {
    position: static;
    background: none;
    backdrop-filter: none;
    display: block;
  }
  
  .smart-assessment-modal {
    box-shadow: none;
    border: 1px solid #000;
    max-width: 100% !important;
    max-height: none !important;
    padding: 15px !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }
  
  .smart-assessment-close {
    display: none;
  }
  .smart-assessment-modal::before {
    height: 2px !important; /* Thinner line for print */
  }
  .smart-assessment-modal-body::-webkit-scrollbar {
    width: 0px; /* Hide scrollbar in print */
  }
}
`}</style>
  );
}


export default HomePage;
