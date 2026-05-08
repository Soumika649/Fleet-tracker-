import React, { useState, useEffect } from "react";
import MapView from "./components/map/MapView";
import OrdersPanel from "./components/orders/OrdersPanel";
import AnalyticsDashboard from "./components/dashboard/AnalyticsDashboard";
import AIChat from "./components/ai/AIChat";
import { useFleetData } from "./hooks/useFleetData";
import "leaflet/dist/leaflet.css";
import "./App.css";

export default function App() {
  const { drivers, orders, analytics, connected, backendOnline, lastUpdate } = useFleetData();
  const [activeTab, setActiveTab] = useState("map");
  const [clock, setClock] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeDrivers = drivers.filter((d) => d.status === "active").length;
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;

  const tabs = [
    { id: "map",       label: "Live Map",    icon: "🗺️" },
    { id: "orders",    label: "Orders",      icon: "📦" },
    { id: "analytics", label: "Analytics",   icon: "📊" },
  ];

  return (
    <div className="app-shell">
      {/* ── Top Bar ── */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo-mark">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">NEXUS<span className="logo-accent">FLEET</span></span>
          </div>
          <div className={`live-badge ${connected ? "live" : "offline"}`}>
            <span className="pulse-dot" />
            {connected ? "LIVE" : "OFFLINE"}
          </div>
          {!backendOnline && (
            <div className="demo-badge">DEMO MODE</div>
          )}
        </div>

        <nav className="top-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div className="top-bar-right">
          {lastUpdate && (
            <div className="last-update">
              Updated {lastUpdate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          )}
          <div className="clock">
            {clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="avatar" title="Admin">AD</div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="main-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* AI Assistant */}
          <AIChat drivers={drivers} orders={orders} />

          {/* Drivers List */}
          <div className="sidebar-section">
            <div className="section-label">
              DRIVERS
              <span className="badge">{activeDrivers}/{drivers.length}</span>
            </div>
            <div className="driver-list">
              {drivers.map((d) => (
                <div key={d._id} className={`driver-card ${d.status}`}>
                  <div className="driver-avatar">{d.name?.[0] || "D"}</div>
                  <div className="driver-info">
                    <span className="driver-name">{d.name}</span>
                    <span className="driver-vehicle">{d.vehicle || "Bike"}</span>
                    <span className="driver-coords">
                      {d.lat?.toFixed(4)}, {d.lng?.toFixed(4)}
                    </span>
                  </div>
                  <div className="driver-right">
                    <div className={`status-dot ${d.status}`} title={d.status} />
                    <div className="driver-rating">⭐ {d.rating || "4.5"}</div>
                  </div>
                </div>
              ))}
              {drivers.length === 0 && (
                <div className="empty-state">Loading drivers...</div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="content-area">
          {/* Stats Strip */}
          <div className="stats-strip">
            <div className="stat-pill">
              <span className="stat-icon">🚗</span>
              <div>
                <div className="stat-val">{drivers.length}</div>
                <div className="stat-lbl">Total</div>
              </div>
            </div>
            <div className="stat-pill active">
              <span className="stat-icon">⚡</span>
              <div>
                <div className="stat-val">{activeDrivers}</div>
                <div className="stat-lbl">Active</div>
              </div>
            </div>
            <div className="stat-pill success">
              <span className="stat-icon">✅</span>
              <div>
                <div className="stat-val">{deliveredOrders}</div>
                <div className="stat-lbl">Delivered</div>
              </div>
            </div>
            <div className="stat-pill warning">
              <span className="stat-icon">⏳</span>
              <div>
                <div className="stat-val">{pendingOrders}</div>
                <div className="stat-lbl">Pending</div>
              </div>
            </div>
            <div className="stat-pill info">
              <span className="stat-icon">🎯</span>
              <div>
                <div className="stat-val">
                  {orders.length > 0 ? Math.round((deliveredOrders / orders.length) * 100) : 94}%
                </div>
                <div className="stat-lbl">On-Time</div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "map" && (
            <div className="map-section">
              <div className="section-header">
                <h2 className="section-title">🗺️ Live Fleet Map</h2>
                <div className="map-legend">
                  <span className="legend-item">
                    <span className="legend-dot active" />Drivers
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot order" />Orders
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot zone" />Zones
                  </span>
                  <span className="legend-item">
                    <span className="legend-line" />Routes
                  </span>
                </div>
              </div>
              <div className="map-wrapper">
                <MapView drivers={drivers} orders={orders} />
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <OrdersPanel orders={orders} drivers={drivers} />
          )}

          {activeTab === "analytics" && (
            <AnalyticsDashboard analytics={analytics} drivers={drivers} orders={orders} />
          )}
        </main>
      </div>
    </div>
  );
}
