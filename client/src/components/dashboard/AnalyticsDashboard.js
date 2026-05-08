import React from "react";

export default function AnalyticsDashboard({ analytics, drivers, orders }) {
  const activeDrivers = drivers.filter((d) => d.status === "active").length;
  const delivered = orders.filter((o) => o.status === "Delivered").length;
  const pending = orders.filter((o) => o.status === "Pending").length;
  const outForDelivery = orders.filter((o) => o.status === "Out for Delivery").length;
  const picked = orders.filter((o) => o.status === "Picked").length;
  const totalOrders = orders.length;
  const onTime = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 94;

  const statusData = [
    { label: "Delivered",        value: delivered,       color: "#00e5a0", icon: "✅" },
    { label: "Out for Delivery", value: outForDelivery,  color: "#00d4ff", icon: "🚗" },
    { label: "Picked",           value: picked,          color: "#f59e0b", icon: "📦" },
    { label: "Pending",          value: pending,         color: "#ff6b6b", icon: "⏳" },
  ];

  const driverStats = drivers.slice(0, 5).map((d) => ({
    name: d.name,
    deliveries: d.totalDeliveries || 0,
    rating: d.rating || 4.5,
    status: d.status,
  }));

  return (
    <div className="analytics-section">
      <h2 className="section-title">📊 Analytics Overview</h2>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-icon">🚗</div>
          <div className="kpi-value">{drivers.length}</div>
          <div className="kpi-label">Total Drivers</div>
          <div className="kpi-sub">{activeDrivers} active</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-value">{activeDrivers}</div>
          <div className="kpi-label">Active Now</div>
          <div className="kpi-sub">{drivers.filter((d) => d.status === "idle").length} idle</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-icon">✅</div>
          <div className="kpi-value">{delivered}</div>
          <div className="kpi-label">Completed</div>
          <div className="kpi-sub">Today</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-icon">⏳</div>
          <div className="kpi-value">{pending}</div>
          <div className="kpi-label">Pending</div>
          <div className="kpi-sub">{outForDelivery} en route</div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-icon">🎯</div>
          <div className="kpi-value">{onTime}%</div>
          <div className="kpi-label">On-Time Rate</div>
          <div className="kpi-sub">Last 30 days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-value">{totalOrders}</div>
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-sub">All time</div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="analytics-row">
        <div className="analytics-card-lg">
          <h3 className="analytics-card-title">Order Status Breakdown</h3>
          <div className="status-bars">
            {statusData.map((s) => (
              <div key={s.label} className="status-bar-row">
                <div className="status-bar-label">
                  <span>{s.icon} {s.label}</span>
                  <span className="status-bar-count">{s.value}</span>
                </div>
                <div className="status-bar-track">
                  <div
                    className="status-bar-fill"
                    style={{
                      width: totalOrders > 0 ? `${(s.value / totalOrders) * 100}%` : "0%",
                      background: s.color,
                    }}
                  />
                </div>
                <span className="status-bar-pct">
                  {totalOrders > 0 ? Math.round((s.value / totalOrders) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="analytics-card-lg">
          <h3 className="analytics-card-title">Top Drivers</h3>
          <div className="driver-table">
            <div className="driver-table-header">
              <span>Driver</span>
              <span>Deliveries</span>
              <span>Rating</span>
              <span>Status</span>
            </div>
            {driverStats.map((d, i) => (
              <div key={d.name} className="driver-table-row">
                <div className="driver-table-name">
                  <div className="rank-badge">{i + 1}</div>
                  {d.name.split(" ")[0]}
                </div>
                <div className="driver-table-val">{d.deliveries}</div>
                <div className="driver-table-rating">⭐ {d.rating}</div>
                <div className={`driver-table-status ${d.status}`}>● {d.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-section">
        <h3 className="analytics-card-title">Today's Delivery Completion</h3>
        <div className="progress-bar-wrapper">
          <div className="progress-label">
            <span>Progress</span>
            <span>{delivered}/{totalOrders} orders</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: totalOrders > 0 ? `${(delivered / totalOrders) * 100}%` : "0%" }}
            />
          </div>
          <div className="progress-pct">{totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0}% complete</div>
        </div>
      </div>
    </div>
  );
}
