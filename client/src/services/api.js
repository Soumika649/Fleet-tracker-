import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "https://fleet-tracker-c0hi.onrender.com/";

const api = axios.create({ baseURL: API_BASE });

export const driversAPI = {
  getAll: () => api.get("/drivers"),
  getOne: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post("/drivers", data),
  update: (id, data) => api.patch(`/drivers/${id}`, data),
  updateLocation: (id, lat, lng) => api.patch(`/drivers/${id}/location`, { lat, lng }),
  delete: (id) => api.delete(`/drivers/${id}`),
};

export const ordersAPI = {
  getAll: () => api.get("/orders"),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post("/orders", data),
  updateStatus: (id, status, note) => api.patch(`/orders/${id}/status`, { status, note }),
  assignDriver: (id, driverId) => api.patch(`/orders/${id}/assign`, { driverId }),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const aiAPI = {
  query: (query) => api.post("/ai/query", { query }),
  closestDriver: (lat, lng) => api.get(`/ai/closest-driver?lat=${lat}&lng=${lng}`),
  delayedOrders: () => api.get("/ai/delayed-orders"),
  suggestRoute: (driverId) => api.get(`/ai/suggest-route/${driverId}`),
};

export const analyticsAPI = {
  summary: () => api.get("/analytics/summary"),
};

export default api;
