import React, { useState } from "react";

const STATUS_COLORS = {
  Delivered: "#00e5a0",
  "Out for Delivery": "#00d4ff",
  Picked: "#f59e0b",
  Pending: "#ff6b6b",
};

const STATUS_ICONS = {
  Delivered: "✅",
  "Out for Delivery": "🚗",
  Picked: "📦",
  Pending: "⏳",
};

const PRIORITY_COLORS = { high: "#ff6b6b", normal: "#8892a4", low: "#4a5568" };

export default function OrdersPanel({ orders = [], drivers = [] }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filters = ["All", "Pending", "Picked", "Out for Delivery", "Delivered"];

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "All" || o.status === filter;
    const matchSearch =
      !search ||
      o.label?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.address?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    All: orders.length,
    Pending: orders.filter((o) => o.status === "Pending").length,
    Picked: orders.filter((o) => o.status === "Picked").length,
    "Out for Delivery": orders.filter((o) => o.status === "Out for Delivery").length,
    Delivered: orders.filter((o) => o.status === "Delivered").length,
  };

  return (
    <div className="orders-panel">
      <div className="orders-header">
        <h2 className="section-title">📦 Orders</h2>
        <div className="orders-search-row">
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-tabs">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              style={filter === f && f !== "All" ? { borderColor: STATUS_COLORS[f], color: STATUS_COLORS[f] } : {}}
            >
              {f !== "All" && <span>{STATUS_ICONS[f]} </span>}
              {f}
              <span className="filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="orders-grid">
        {filtered.map((order) => {
          const color = STATUS_COLORS[order.status] || "#8892a4";
          return (
            <div key={order._id} className="order-card" style={{ "--accent": color }}>
              <div className="order-card-top">
                <div className="order-id-row">
                  <span className="order-label">Order {order.label}</span>
                  {order.priority === "high" && (
                    <span className="priority-badge high">🔴 HIGH</span>
                  )}
                </div>
                <span className="order-status-badge" style={{ background: `${color}22`, color, borderColor: `${color}44` }}>
                  {STATUS_ICONS[order.status]} {order.status}
                </span>
              </div>

              <div className="order-customer">
                <span className="customer-avatar">{order.customerName?.[0] || "C"}</span>
                <div>
                  <div className="customer-name">{order.customerName}</div>
                  <div className="customer-address">📍 {order.address}</div>
                </div>
              </div>

              {order.assignedDriver ? (
                <div className="order-driver-row">
                  <div className="driver-mini-avatar">{order.assignedDriver.name?.[0] || "D"}</div>
                  <div>
                    <div className="driver-mini-name">{order.assignedDriver.name}</div>
                    <div className={`driver-mini-status ${order.assignedDriver.status}`}>
                      ● {order.assignedDriver.status}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="order-unassigned">⚠️ Unassigned</div>
              )}

              <div className="order-coords">
                🗺️ {order.lat?.toFixed(4)}, {order.lng?.toFixed(4)}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="orders-empty">
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
            <div>No orders match this filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}
