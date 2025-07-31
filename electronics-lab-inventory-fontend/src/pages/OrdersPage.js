// src/pages/OrdersPage.js
import React, { useEffect, useState } from "react";
import {
  MdInput,
  MdOutput,
  MdHistory,
  MdArrowForward,
  MdAssignmentTurnedIn,
  MdErrorOutline
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

  useEffect(() => {
    fetchOrdersData();
  }, [status]);

  const fetchOrdersData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace URLs with your backend endpoints!
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

  // Helper: humanize timestamp
  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  // Helper: status badge JSX
  function statusBadge(statusVal) {
    if (!statusVal) return null;
    let color = "#a0aec0";
    if (statusVal === "Completed") color = "#38b287";
    if (statusVal === "Pending") color = "#fbbf24";
    if (statusVal === "Cancelled" || statusVal === "Rejected") color = "#e53e3e";
    return (
      <span style={{
        background: color + "22",
        color,
        padding: "2px 10px",
        fontWeight: "600",
        fontSize: "0.95em",
        borderRadius: "8px",
        marginLeft: "10px"
      }}>
        {statusVal}
      </span>
    );
  }

  return (
    <div className="orders-root">
      <Sidebar />
      <div className="orders-main">
        <Navbar />
        <main className="orders-content">
          <div className="orders-header">
            <div>
              <h1>
                <MdAssignmentTurnedIn style={{ marginRight: 8, color: "#6c63e6" }}/>
                Orders Management
              </h1>
              <div className="orders-subheader">View, track and manage all Inward and Outward orders</div>
            </div>
            <div className="orders-status-filter">
              <label>Status:&nbsp;
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="all">All</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
              <button onClick={fetchOrdersData} className="orders-refresh-btn">⟳ Refresh</button>
            </div>
          </div>

          {error && (
            <div className="orders-error">
              <MdErrorOutline style={{marginRight: 8}}/> {error}
            </div>
          )}
          {loading ? (
            <div className="orders-loader">Loading orders...</div>
          ) : (
            <div className="orders-grid-2col">
              
              {/* Inward Orders Table */}
              <section className="orders-table-section">
                <div className="orders-section-title"><MdInput /> Inward Orders</div>
                <div className="orders-table-wrap">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Component</th>
                        <th>Quantity</th>
                        <th>From Supplier</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                    {inwardOrders.length === 0 ?
                      <tr><td colSpan="6" className="no-orders">No recent inward orders.</td></tr>
                      :
                      inwardOrders.map(order => (
                        <tr key={order._id}>
                          <td>{order.orderNumber || order._id?.slice(-6)}</td>
                          <td>{order.componentName}</td>
                          <td>{order.quantity}</td>
                          <td>{order.supplierName || "-"}</td>
                          <td>{statusBadge(order.status)}</td>
                          <td>{formatTime(order.createdAt)}</td>
                        </tr>
                      ))
                    }
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Outward Orders Table */}
              <section className="orders-table-section">
                <div className="orders-section-title"><MdOutput /> Outward Orders</div>
                <div className="orders-table-wrap">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Component</th>
                        <th>Quantity</th>
                        <th>Issued To</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                    {outwardOrders.length === 0 ?
                      <tr><td colSpan="6" className="no-orders">No recent outward orders.</td></tr>
                      :
                      outwardOrders.map(order => (
                        <tr key={order._id}>
                          <td>{order.orderNumber || order._id?.slice(-6)}</td>
                          <td>{order.componentName}</td>
                          <td>{order.quantity}</td>
                          <td>{order.issuedToName || order.issuedTo || "-"}</td>
                          <td>{statusBadge(order.status)}</td>
                          <td>{formatTime(order.createdAt)}</td>
                        </tr>
                      ))
                    }
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Recent Activity Feed */}
          <section className="orders-activity-section">
            <div className="orders-section-title"><MdHistory /> Recent Order Activity</div>
            <div className="orders-activity-list">
              {recentActivity.length === 0 ?
                <div className="no-orders">No recent activity.</div>
                :
                recentActivity.map(act => (
                  <div key={act._id || act.timestamp} className="orders-activity-item">
                    <div className="orders-activity-icon">
                      {act.type === "inward" ? <MdInput color="#4fd1c5"/> : <MdOutput color="#f687b3"/>}
                    </div>
                    <div className="orders-activity-details">
                      <div>
                        <b>{act.userName}</b> {act.type === "inward" ? "received" : "issued"} <b>{act.quantity}</b> of <b>{act.componentName}</b>
                        {act.type === "outward" && act.issuedTo ? <> to <b>{act.issuedTo}</b></> : null}
                      </div>
                      <div className="orders-activity-meta">
                        {formatTime(act.timestamp || act.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </section>

        </main>
        <OrdersCSS />
      </div>
    </div>
  );
};

// CSS-in-JS styles for Orders Page
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
  width: 100%;
  padding: 24px 28px 0 28px;
  overflow-y: auto;
  min-height: 0;
  box-sizing: border-box;
}
.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.orders-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #232b49;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
}
.orders-subheader { color: #8898ac; font-size: 1.05em; margin-bottom: 0;}
.orders-status-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.orders-status-filter select {
  background: #fff;
  border: 1.2px solid #d1d5db;
  padding: 5px 10px;
  border-radius: 7px;
  outline: none;
}
.orders-refresh-btn {
  margin-left: 10px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 6px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.orders-refresh-btn:hover { background: #544fc8; }
.orders-section-title {
  font-size: 1.18rem;
  font-weight: 700;
  color: #29365d;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 7px;
}
.orders-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 32px;
}
.orders-table-section { background: #fff; border-radius: 13px; box-shadow: 0 2px 10px #cbd5e140; padding: 18px 0 7px 0;}
.orders-table-wrap { width: 100%; overflow-x: auto;}
.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.06em;
  background: transparent;
}
.orders-table th {
  background: #f7f8fa;
  font-weight: 700;
  color: #4b558a;
  padding: 9px 8px;
  border-bottom: 2px solid #eaeaea;
  white-space: nowrap;
  text-align: left;
}
.orders-table td {
  padding: 8px 8px;
  border-bottom: 1px solid #f2f2f2;
  text-align: left;
}
.orders-table tr:last-child td { border-bottom: none;}
.no-orders { text-align: center; color: #a1adc7; padding: 18px 4px;}
.orders-error {
  color: #e53e3e;
  background: #fbeaea;
  padding: 12px;
  border-radius: 7px;
  margin-bottom: 16px;
  display: flex; align-items: center; font-weight: 600;
}
.orders-loader { text-align: center; color: #667eea; font-weight: 600; font-size: 1.2em; padding: 36px 0;}
.orders-activity-section { margin-bottom: 20px;}
.orders-activity-list { display: flex; flex-direction: column; gap: 13px; }
.orders-activity-item {
  display: flex; gap: 10px; align-items: flex-start; background: #f9fafb; border-radius: 8px;
  padding: 9px 16px; font-size: 1em;
  box-shadow: 0 1px 4px #c6e2fa18;
}
.orders-activity-icon {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  font-size: 1.4em;
}
.orders-activity-details { flex: 1;}
.orders-activity-meta { color: #93a3bc; font-size: 0.96em; margin-top: 3px;}
@media (max-width: 1100px) {
  .orders-content { padding: 16px 5vw 0 5vw; }
  .orders-grid-2col { grid-template-columns: 1fr; gap: 16px;}
}
@media (max-width: 670px) {
  .orders-content { padding: 9vw 2vw 0 2vw;}
  .orders-section-title { font-size: 1.06rem; }
  .orders-header h1 { font-size: 1.18rem;}
}
`}</style>
  );
}

export default OrdersPage;
