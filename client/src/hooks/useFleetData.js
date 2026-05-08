import { useState, useEffect, useCallback, useRef } from "react";
import socket from "../services/socket";
import { driversAPI, ordersAPI, analyticsAPI } from "../services/api";

// Mock data used when backend is not available
const MOCK_DRIVERS = [
  { _id: "d1", name: "Ravi Kumar",   lat: 17.385, lng: 78.486, status: "active",  vehicle: "Bike",    totalDeliveries: 42, rating: 4.8, lastUpdated: new Date() },
  { _id: "d2", name: "Sita Devi",    lat: 17.395, lng: 78.496, status: "active",  vehicle: "Scooter", totalDeliveries: 31, rating: 4.6, lastUpdated: new Date() },
  { _id: "d3", name: "Arjun Singh",  lat: 17.372, lng: 78.471, status: "idle",    vehicle: "Van",     totalDeliveries: 67, rating: 4.9, lastUpdated: new Date() },
  { _id: "d4", name: "Meera Nair",   lat: 17.401, lng: 78.502, status: "active",  vehicle: "Bike",    totalDeliveries: 28, rating: 4.5, lastUpdated: new Date() },
  { _id: "d5", name: "Kiran Reddy",  lat: 17.368, lng: 78.460, status: "offline", vehicle: "Scooter", totalDeliveries: 15, rating: 4.3, lastUpdated: new Date() },
];

const MOCK_ORDERS = [
  { _id: "o1", label: "#12", customerName: "Priya Sharma",  address: "Kondapur",    lat: 17.392, lng: 78.491, status: "Out for Delivery", assignedDriver: { _id: "d1", name: "Ravi Kumar",  status: "active" }, priority: "high"   },
  { _id: "o2", label: "#42", customerName: "Vikram Patel",   address: "Gachibowli",  lat: 17.375, lng: 78.478, status: "Pending",          assignedDriver: { _id: "d2", name: "Sita Devi",   status: "active" }, priority: "normal" },
  { _id: "o3", label: "#57", customerName: "Ananya Reddy",   address: "Madhapur",    lat: 17.401, lng: 78.502, status: "Delivered",        assignedDriver: { _id: "d3", name: "Arjun Singh", status: "idle"   }, priority: "normal" },
  { _id: "o4", label: "#63", customerName: "Rohan Mehta",    address: "HITEC City",  lat: 17.388, lng: 78.493, status: "Pending",          assignedDriver: { _id: "d4", name: "Meera Nair",  status: "active" }, priority: "low"    },
  { _id: "o5", label: "#71", customerName: "Kavya Nair",     address: "Jubilee Hills",lat: 17.378, lng: 78.465, status: "Picked",          assignedDriver: { _id: "d1", name: "Ravi Kumar",  status: "active" }, priority: "high"   },
  { _id: "o6", label: "#85", customerName: "Suresh Kumar",   address: "Banjara Hills",lat: 17.412, lng: 78.448, status: "Pending",         assignedDriver: null, priority: "normal" },
];

const BOUNDS = { latMin: 17.340, latMax: 17.430, lngMin: 78.440, lngMax: 78.540 };
const STEP = 0.0004;

export function useFleetData() {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [connected, setConnected] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const mockSimRef = useRef(null);
  const driversRef = useRef(drivers);
  driversRef.current = drivers;

  // Start mock simulation (runs when backend is offline)
  const startMockSimulation = useCallback(() => {
    if (mockSimRef.current) return;
    console.log("🎭 Starting mock location simulation");
    mockSimRef.current = setInterval(() => {
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.status === "offline") return d;
          const dLat = (Math.random() - 0.5) * STEP * 2;
          const dLng = (Math.random() - 0.5) * STEP * 2;
          return {
            ...d,
            lat: Math.max(BOUNDS.latMin, Math.min(BOUNDS.latMax, d.lat + dLat)),
            lng: Math.max(BOUNDS.lngMin, Math.min(BOUNDS.lngMax, d.lng + dLng)),
            lastUpdated: new Date(),
          };
        })
      );
      setLastUpdate(new Date());
    }, 3000);
  }, []);

  // Load initial data
  useEffect(() => {
    async function fetchInitial() {
      try {
        const [dRes, oRes, aRes] = await Promise.all([
          driversAPI.getAll(),
          ordersAPI.getAll(),
          analyticsAPI.summary().catch(() => ({ data: null })),
        ]);
        setDrivers(dRes.data);
        setOrders(oRes.data);
        if (aRes.data) setAnalytics(aRes.data);
        setBackendOnline(true);
        console.log("✅ Loaded data from backend");
      } catch (err) {
        console.warn("⚠️ Backend offline, using mock data:", err.message);
        setDrivers(MOCK_DRIVERS);
        setOrders(MOCK_ORDERS);
        setBackendOnline(false);
        startMockSimulation();
      }
    }
    fetchInitial();
    return () => {
      if (mockSimRef.current) clearInterval(mockSimRef.current);
    };
  }, [startMockSimulation]);

  // Socket events
  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Initial state from server
    socket.on("initialState", ({ drivers: d, orders: o }) => {
      setDrivers(d);
      setOrders(o);
      setBackendOnline(true);
      if (mockSimRef.current) { clearInterval(mockSimRef.current); mockSimRef.current = null; }
    });

    // Individual location update
    socket.on("locationUpdate", (updatedDriver) => {
      setDrivers((prev) => prev.map((d) => (d._id === updatedDriver._id ? { ...d, ...updatedDriver } : d)));
      setLastUpdate(new Date());
    });

    // Batch location update (more efficient)
    socket.on("driverBatch", (updates) => {
      setDrivers((prev) => {
        const map = {};
        updates.forEach((u) => (map[u._id] = u));
        return prev.map((d) => (map[d._id] ? { ...d, ...map[d._id] } : d));
      });
      setLastUpdate(new Date());
    });

    // Order updates
    socket.on("orderStatusUpdate", (updatedOrder) => {
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o)));
    });

    socket.on("newOrder", (order) => {
      setOrders((prev) => [order, ...prev]);
    });

    socket.on("driverStatusChange", (driver) => {
      setDrivers((prev) => prev.map((d) => (d._id === driver._id ? { ...d, ...driver } : d)));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("initialState");
      socket.off("locationUpdate");
      socket.off("driverBatch");
      socket.off("orderStatusUpdate");
      socket.off("newOrder");
      socket.off("driverStatusChange");
    };
  }, []);

  // Check socket connection
  useEffect(() => {
    setConnected(socket.connected);
  }, []);

  // Refresh analytics periodically
  useEffect(() => {
    if (!backendOnline) return;
    const timer = setInterval(async () => {
      try {
        const res = await analyticsAPI.summary();
        setAnalytics(res.data);
      } catch {}
    }, 15000);
    return () => clearInterval(timer);
  }, [backendOnline]);

  return { drivers, orders, analytics, connected, backendOnline, lastUpdate };
}
