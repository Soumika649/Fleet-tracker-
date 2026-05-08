import React, { useMemo, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ── Icon factories ─────────────────────────────────────────────
function makeDriverIcon(status, name) {
  const colors = { active: "#00d4ff", idle: "#f59e0b", offline: "#4b5563" };
  const color = colors[status] || "#4b5563";
  const isActive = status === "active";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;">
        ${isActive ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:${color};opacity:0.15;animation:pulse 2s infinite;"></div>` : ""}
        <div style="
          width:44px;height:44px;
          background:${isActive ? `linear-gradient(135deg,#1565c0,#1e88e5)` : "linear-gradient(135deg,#546e7a,#78909c)"};
          border-radius:50%;
          border:2px solid ${color};
          box-shadow:0 0 ${isActive ? "12px" : "4px"} ${color}${isActive ? "66" : "33"};
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
        ">🚗</div>
        <div style="
          position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);
          background:${color};color:#fff;
          font-size:9px;font-weight:700;font-family:'Space Grotesk',sans-serif;
          padding:1px 5px;border-radius:6px;white-space:nowrap;
          max-width:70px;overflow:hidden;text-overflow:ellipsis;
        ">${name?.split(" ")[0] || "Driver"}</div>
        ${isActive ? `<div style="position:absolute;top:0;right:0;width:12px;height:12px;background:#22c55e;border-radius:50%;border:2px solid #fff;"></div>` : ""}
      </div>
      <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.15}50%{transform:scale(1.5);opacity:0.05}}</style>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
}

function makeOrderIcon(status, label) {
  const colors = {
    Delivered: "#00e5a0",
    "Out for Delivery": "#00d4ff",
    Picked: "#f59e0b",
    Pending: "#ff6b6b",
  };
  const emojis = { Delivered: "✅", "Out for Delivery": "🚗", Picked: "📦", Pending: "⏳" };
  const color = colors[status] || "#ff6b6b";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:36px;">
        <div style="
          width:36px;height:36px;
          background:#ffffff;
          border-radius:8px;
          border:2px solid ${color};
          box-shadow:0 0 8px ${color}44;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;
        ">${emojis[status] || "📦"}</div>
        <div style="
          position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
          background:${color};color:#fff;
          font-size:9px;font-weight:700;font-family:'Space Grotesk',sans-serif;
          padding:1px 5px;border-radius:6px;
        ">${label}</div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// Delivery zones
const ZONES = [
  { center: [17.385, 78.486], radius: 1200, color: "#00d4ff", label: "Zone A - Central" },
  { center: [17.408, 78.508], radius: 900,  color: "#00e5a0", label: "Zone B - North" },
  { center: [17.362, 78.462], radius: 800,  color: "#f59e0b", label: "Zone C - South" },
  { center: [17.395, 78.455], radius: 700,  color: "#a855f7", label: "Zone D - West"  },
];

// Route highlighter component - updates markers smoothly
function DriverMarker({ driver }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([driver.lat, driver.lng]);
    }
  }, [driver.lat, driver.lng]);

  return (
    <Marker
      key={driver._id}
      ref={markerRef}
      position={[driver.lat, driver.lng]}
      icon={makeDriverIcon(driver.status, driver.name)}
    >
      <Popup>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", minWidth: "160px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px", color: "#1a202c" }}>
            🚗 {driver.name}
          </div>
          <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7" }}>
            <div>Status: <strong style={{ color: driver.status === "active" ? "#00a870" : driver.status === "idle" ? "#d97706" : "#6b7280" }}>{driver.status}</strong></div>
            <div>Vehicle: {driver.vehicle || "Bike"}</div>
            <div>Rating: ⭐ {driver.rating || "4.5"}</div>
            <div>Deliveries: {driver.totalDeliveries || 0}</div>
            <div style={{ marginTop: "4px", fontSize: "11px", color: "#888" }}>
              {driver.lat?.toFixed(4)}, {driver.lng?.toFixed(4)}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView({ drivers = [], orders = [] }) {
  // Build route lines: connect each driver to their assigned orders
  const routes = useMemo(() => {
    const lines = [];
    drivers.forEach((driver) => {
      if (driver.status === "offline") return;
      const driverOrders = orders.filter(
        (o) =>
          o.assignedDriver &&
          (o.assignedDriver._id === driver._id || o.assignedDriver === driver._id) &&
          o.status !== "Delivered"
      );
      driverOrders.forEach((order) => {
        if (order.lat && order.lng) {
          lines.push({
            id: `${driver._id}-${order._id}`,
            positions: [[driver.lat, driver.lng], [order.lat, order.lng]],
            color: driver.status === "active" ? "#00d4ff" : "#f59e0b",
          });
        }
      });
    });
    return lines;
  }, [drivers, orders]);

  return (
    <MapContainer
      center={[17.385, 78.486]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Delivery Zones */}
      {ZONES.map((zone, i) => (
        <Circle
          key={i}
          center={zone.center}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: "6 4",
          }}
        >
          <Tooltip permanent direction="center" className="zone-tooltip" opacity={0.9}>
            {zone.label}
          </Tooltip>
        </Circle>
      ))}

      {/* Route lines */}
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.positions}
          pathOptions={{
            color: route.color,
            weight: 2,
            opacity: 0.6,
            dashArray: "8 5",
          }}
        />
      ))}

      {/* Driver markers - smooth update */}
      {drivers.map((driver) => (
        <DriverMarker key={driver._id} driver={driver} />
      ))}

      {/* Order markers */}
      {orders.map((order) =>
        order.lat && order.lng ? (
          <Marker
            key={order._id}
            position={[order.lat, order.lng]}
            icon={makeOrderIcon(order.status, order.label)}
          >
            <Popup>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", minWidth: "160px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px", color: "#1a202c" }}>
                  📦 Order {order.label}
                </div>
                <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7" }}>
                  <div>Customer: {order.customerName}</div>
                  <div>Address: {order.address}</div>
                  <div>Status: <strong>{order.status}</strong></div>
                  <div>Priority: {order.priority}</div>
                  {order.assignedDriver && (
                    <div>Driver: {order.assignedDriver.name || "—"}</div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
