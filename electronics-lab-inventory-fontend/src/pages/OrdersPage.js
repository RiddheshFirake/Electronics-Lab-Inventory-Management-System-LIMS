// src/pages/OrdersPage.js
import React, { useEffect, useState } from "react";
import {
  MdInput,
  MdOutput,
  MdHistory,
  MdArrowForward,
  MdAssignmentTurnedIn,
  MdErrorOutline,
  MdRefresh,
  MdFilterList,
  MdSearch,
  MdMoreVert,
  MdTrendingUp,
  MdTrendingDown,
  MdVisibility
} from "react-icons/md";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

const ORDERS_LIMIT = 10;

const OrdersPage = () => {
  const [inwardOrders, setInwardOrders] = useState([]);
  const [outwardOrders, setOutwardOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrdersData();
  }, [status]);

  const fetchOrdersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inwardRes, outwardRes, activityRes] = await Promise.all([
        api.get(`/orders/inward?limit=${ORDERS_LIMIT}&status=${status}`),
        api.get(`/orders/outward?limit=${ORDERS_LIMIT}&status=${status}`),
        api.get(`/orders/activity?limit=5`)
      ]);
      setInwardOrders(inwardRes.data.data || []);
      setOutwardOrders(outwardRes.data.data || []);
      setRecentActivity(activityRes.data.data || []);
    } catch (err) {
      setError("Failed to load orders. Please try again.");
    }
    setLoading(false);
  };

  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch {
      return ts;
    }
  };

  function statusBadge(statusVal) {
    if (!statusVal) return null;
    const statusConfig = {
      "Completed": { color: "#10b981", bg: "#dcfce7", icon: "✓" },
      "Pending": { color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
      "Cancelled": { color: "#ef4444", bg: "#fee2e2", icon: "✕" },
      "Rejected": { color: "#ef4444", bg: "#fee2e2", icon: "✕" },
      "Processing": { color: "#3b82f6", bg: "#dbeafe", icon: "⚡" }
    };
    
    const config = statusConfig[statusVal] || { color: "#6b7280", bg: "#f3f4f6", icon: "•" };
    
    return (
      <span className="status-badge" style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}20`
      }}>
        <span className="status-icon">{config.icon}</span>
        {statusVal}
      </span>
    );
  }

  const getOrderStats = () => {
    const totalInward = inwardOrders.length;
    const totalOutward = outwardOrders.length;
    const completedInward = inwardOrders.filter(o => o.status === "Completed").length;
    const completedOutward = outwardOrders.filter(o => o.status === "Completed").length;
    
    return { totalInward, totalOutward, completedInward, completedOutward };
  };

  const stats = getOrderStats();

  return (
    <div className="orders-root">
      <div className="orders-main">
        <main className="orders-content">
          {/* Header Section */}
          <div className="orders-header">
            <div className="header-left">
              <div className="page-title">
                <div className="title-icon-wrapper">
                  <MdAssignmentTurnedIn className="title-icon"/>
                </div>
                <div className="title-content">
                  <h1>Orders Management</h1>
                  <p className="subtitle">Track and manage all inventory transactions</p>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <div className="search-box">
                <MdSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-dropdown">
                <MdFilterList />
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <button onClick={fetchOrdersData} className="refresh-btn">
                <MdRefresh />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card inward">
              <div className="stat-icon">
                <MdTrendingUp />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalInward}</div>
                <div className="stat-label">Inward Orders</div>
                <div className="stat-subtext">{stats.completedInward} completed</div>
              </div>
            </div>
            <div className="stat-card outward">
              <div className="stat-icon">
                <MdTrendingDown />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalOutward}</div>
                <div className="stat-label">Outward Orders</div>
                <div className="stat-subtext">{stats.completedOutward} completed</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-alert">
              <MdErrorOutline />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : (
            <div className="orders-grid">
              {/* Inward Orders */}
              <div className="orders-section">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon-wrapper inward">
                      <MdInput className="section-icon" />
                    </div>
                    <div className="section-title-text">
                      <span className="section-main-title">Inward Orders</span>
                      <span className="section-subtitle">Stock received</span>
                    </div>
                  </div>
                  <button className="view-all-btn">
                    <MdVisibility />
                    <span>View All</span>
                    <MdArrowForward />
                  </button>
                </div>
                <div className="orders-table-container">
                  {inwardOrders.length === 0 ? (
                    <div className="empty-state">
                      <MdInput className="empty-icon" />
                      <h3>No Inward Orders</h3>
                      <p>No recent inward orders found</p>
                    </div>
                  ) : (
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Component</th>
                          <th>Quantity</th>
                          <th>Supplier</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {inwardOrders.map(order => (
                          <tr key={order._id} className="table-row">
                            <td>
                              <div className="order-id">
                                #{order.orderNumber || order._id?.slice(-6)}
                              </div>
                            </td>
                            <td>
                              <div className="component-cell">
                                <div className="component-name">{order.componentName}</div>
                              </div>
                            </td>
                            <td>
                              <div className="quantity-cell">{order.quantity}</div>
                            </td>
                            <td>
                              <div className="supplier-cell">{order.supplierName || "-"}</div>
                            </td>
                            <td>{statusBadge(order.status)}</td>
                            <td>
                              <div className="date-cell">{formatTime(order.createdAt)}</div>
                            </td>
                            <td>
                              <button className="action-btn">
                                <MdMoreVert />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Outward Orders */}
              <div className="orders-section">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon-wrapper outward">
                      <MdOutput className="section-icon" />
                    </div>
                    <div className="section-title-text">
                      <span className="section-main-title">Outward Orders</span>
                      <span className="section-subtitle">Stock issued</span>
                    </div>
                  </div>
                  <button className="view-all-btn">
                    <MdVisibility />
                    <span>View All</span>
                    <MdArrowForward />
                  </button>
                </div>
                <div className="orders-table-container">
                  {outwardOrders.length === 0 ? (
                    <div className="empty-state">
                      <MdOutput className="empty-icon" />
                      <h3>No Outward Orders</h3>
                      <p>No recent outward orders found</p>
                    </div>
                  ) : (
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Component</th>
                          <th>Quantity</th>
                          <th>Issued To</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {outwardOrders.map(order => (
                          <tr key={order._id} className="table-row">
                            <td>
                              <div className="order-id">
                                #{order.orderNumber || order._id?.slice(-6)}
                              </div>
                            </td>
                            <td>
                              <div className="component-cell">
                                <div className="component-name">{order.componentName}</div>
                              </div>
                            </td>
                            <td>
                              <div className="quantity-cell">{order.quantity}</div>
                            </td>
                            <td>
                              <div className="issued-to-cell">{order.issuedToName || order.issuedTo || "-"}</div>
                            </td>
                            <td>{statusBadge(order.status)}</td>
                            <td>
                              <div className="date-cell">{formatTime(order.createdAt)}</div>
                            </td>
                            <td>
                              <button className="action-btn">
                                <MdMoreVert />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="activity-section">
            <div className="section-header">
              <div className="section-title">
                <div className="section-icon-wrapper activity">
                  <MdHistory className="section-icon" />
                </div>
                <div className="section-title-text">
                  <span className="section-main-title">Recent Activity</span>
                  <span className="section-subtitle">Latest transactions</span>
                </div>
              </div>
              <button className="view-all-btn">
                <MdVisibility />
                <span>View All</span>
                <MdArrowForward />
              </button>
            </div>
            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <div className="empty-activity">
                  <MdHistory className="empty-icon" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map(act => (
                  <div key={act._id || act.timestamp} className="activity-item">
                    <div className={`activity-avatar ${act.type}`}>
                      {act.type === "inward" ? <MdInput /> : <MdOutput />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <strong>{act.userName}</strong> {act.type === "inward" ? "received" : "issued"} <strong>{act.quantity}</strong> units of <strong>{act.componentName}</strong>
                        {act.type === "outward" && act.issuedTo && <> to <strong>{act.issuedTo}</strong></>}
                      </div>
                      <div className="activity-time">{formatTime(act.timestamp || act.createdAt)}</div>
                    </div>
                    <div className="activity-status">
                      {statusBadge(act.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
        <OrdersCSS />
      </div>
    </div>
  );
};

// Enhanced CSS styles
function OrdersCSS() {
  return (
    <style>{`
      .orders-root {
        display: flex;
        min-height: 100vh;
        background: #f8fafc;
      }

      .orders-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        min-width: 0;
      }

      .orders-content {
        flex: 1;
        padding: 32px;
        overflow-y: auto;
        background: #f8fafc;
      }

      /* Enhanced Header */
      .orders-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
        gap: 24px;
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .title-icon-wrapper {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
      }

      .title-icon {
        font-size: 2rem;
        color: white;
      }

      .title-content h1 {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
        line-height: 1.2;
      }

      .subtitle {
        color: #6b7280;
        font-size: 1rem;
        margin: 4px 0 0 0;
        font-weight: 500;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .search-box {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 12px;
        color: #9ca3af;
        font-size: 1.1rem;
        z-index: 1;
      }

      .search-box input {
        padding: 12px 16px 12px 44px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 0.95rem;
        width: 280px;
        transition: all 0.2s;
        outline: none;
        background: white;
      }

      .search-box input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .filter-dropdown {
        position: relative;
        display: flex;
        align-items: center;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px 16px;
        gap: 10px;
        transition: all 0.2s;
      }

      .filter-dropdown:hover {
        border-color: #6366f1;
      }

      .filter-dropdown select {
        border: none;
        outline: none;
        background: transparent;
        font-size: 0.95rem;
        color: #374151;
        cursor: pointer;
        font-weight: 500;
      }

      .refresh-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 12px 20px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }

      .refresh-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
      }

      /* Stats Cards */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
      }

      .stat-card {
        background: white;
        border-radius: 20px;
        padding: 28px;
        display: flex;
        align-items: center;
        gap: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.3s;
        border-left: 5px solid transparent;
      }

      .stat-card.inward {
        border-left-color: #10b981;
      }

      .stat-card.outward {
        border-left-color: #f59e0b;
      }

      .stat-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .stat-icon {
        width: 70px;
        height: 70px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: white;
      }

      .stat-card.inward .stat-icon {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      }

      .stat-card.outward .stat-icon {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
      }

      .stat-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 1.125rem;
        color: #4b5563;
        margin: 8px 0 4px 0;
        font-weight: 600;
      }

      .stat-subtext {
        font-size: 0.875rem;
        color: #9ca3af;
        font-weight: 500;
      }

      /* Error Alert */
      .error-alert {
        display: flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 18px 24px;
        border-radius: 16px;
        margin-bottom: 24px;
        font-weight: 500;
        box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.1);
      }

      /* Loading */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        color: #6b7280;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Orders Grid */
      .orders-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 32px;
      }

      .orders-section {
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
      }

      .orders-section:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 6px 12px -2px rgba(0, 0, 0, 0.08);
      }

      /* Enhanced Section Header */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px;
        border-bottom: 2px solid #f8fafc;
        background: linear-gradient(135deg, #fafbfc, #f8fafc);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .section-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .section-icon-wrapper.inward {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      .section-icon-wrapper.outward {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .section-icon-wrapper.activity {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
      }

      .section-icon {
        font-size: 1.5rem;
        color: white;
      }

      .section-title-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .section-main-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
        line-height: 1.2;
      }

      .section-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      /* Enhanced View All Button */
      .view-all-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6366f1;
        background: linear-gradient(135deg, #f0f4ff, #e0e7ff);
        border: 1px solid #c7d2fe;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        padding: 10px 16px;
        border-radius: 12px;
        transition: all 0.2s;
      }

      .view-all-btn:hover {
        background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      }

      .view-all-btn svg {
        font-size: 1rem;
      }

      /* Table */
      .orders-table-container {
        max-height: 500px;
        overflow: auto;
      }

      .orders-table {
        width: 100%;
        border-collapse: collapse;
      }

      .orders-table th {
        background: linear-gradient(135deg, #f9fafb, #f3f4f6);
        padding: 16px 24px;
        text-align: left;
        font-weight: 700;
        color: #374151;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 5;
      }

      .table-row {
        transition: all 0.2s;
      }

      .table-row:hover {
        background: linear-gradient(135deg, #f9fafb, #f8fafc);
      }

      .orders-table td {
        padding: 18px 24px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      .order-id {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.875rem;
        color: #6366f1;
        font-weight: 700;
        background: #f0f4ff;
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-block;
      }

      .component-name {
        font-weight: 600;
        color: #1f2937;
        font-size: 0.95rem;
      }

      .quantity-cell {
        font-weight: 700;
        color: #059669;
        font-size: 1rem;
      }

      .supplier-cell, .issued-to-cell {
        color: #6b7280;
        font-weight: 500;
      }

      .date-cell {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      .action-btn {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: #f3f4f6;
        color: #6b7280;
        transform: scale(1.1);
      }

      /* Status Badge */
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 24px;
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1;
        text-transform: capitalize;
      }

      .status-icon {
        font-size: 0.75rem;
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        color: #9ca3af;
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .empty-state h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #4b5563;
        margin: 0 0 8px 0;
      }

      .empty-state p {
        margin: 0;
        color: #9ca3af;
      }

      /* Enhanced Activity Section */
      .activity-section {
        background: white;
        border-radius: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
      }

      .activity-section:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 6px 12px -2px rgba(0, 0, 0, 0.08);
      }

      .activity-list {
        padding: 0 28px 28px 28px;
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 0;
        border-bottom: 1px solid #f1f5f9;
        transition: all 0.2s ease;
      }

      .activity-item:last-child {
        border-bottom: none;
      }

      .activity-item:hover {
        background: linear-gradient(135deg, #fafbfc, #f8fafc);
        padding: 18px 16px;
        margin: 0 -16px;
        border-radius: 12px;
        border-bottom: 1px solid transparent;
      }

      .activity-avatar {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.3rem;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .activity-avatar.inward {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      .activity-avatar.outward {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .activity-content {
        flex: 1;
        min-width: 0;
      }

      .activity-text {
        color: #374151;
        line-height: 1.5;
        margin-bottom: 6px;
        font-size: 0.95rem;
        font-weight: 500;
      }

      .activity-time {
        color: #9ca3af;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .activity-status {
        flex-shrink: 0;
      }

      .empty-activity {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 20px;
        color: #9ca3af;
      }

      /* Responsive Design */
      @media (max-width: 1200px) {
        .orders-grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }
      }

      @media (max-width: 768px) {
        .orders-content {
          padding: 20px;
        }

        .orders-header {
          flex-direction: column;
          align-items: stretch;
          gap: 20px;
        }

        .header-actions {
          flex-direction: column;
          gap: 12px;
        }

        .search-box input {
          width: 100%;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .title-content h1 {
          font-size: 1.75rem;
        }

        .orders-table-container {
          overflow-x: auto;
        }

        .orders-table {
          min-width: 600px;
        }

        .section-header {
          padding: 20px;
        }

        .activity-item {
          padding: 16px 0;
        }

        .view-all-btn {
          padding: 8px 12px;
          font-size: 0.8rem;
        }
      }

      @media (max-width: 480px) {
        .orders-content {
          padding: 16px;
        }

        .page-title {
          flex-direction: column;
          text-align: center;
          gap: 12px;
        }

        .title-icon-wrapper {
          width: 50px;
          height: 50px;
        }

        .title-icon {
          font-size: 1.5rem;
        }

        .stat-card {
          padding: 20px;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          font-size: 1.5rem;
        }

        .stat-number {
          font-size: 2rem;
        }
      }
    `}</style>
  );
}

export default OrdersPage;
