const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const driversRouter = require("./routes/drivers");
const ordersRouter = require("./routes/orders");
const aiRouter = require("./routes/ai");
const analyticsRouter = require("./routes/analytics");
const { initSocketHandlers } = require("./socket/socketHandlers");
const { startSimulation } = require("./services/locationSimulator");

const app = express();
const server = http.createServer(app);

// ── Middleware ──
app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }));
app.use(express.json());

// ── Socket.IO ──
const io = new Server(server, {
  cors: { origin: ["http://localhost:3000", "http://127.0.0.1:3000"], methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

// Attach io to app so routes can use it
app.set("io", io);

// ── Routes ──
app.use("/drivers", driversRouter);
app.use("/orders", ordersRouter);
app.use("/ai", aiRouter);
app.use("/analytics", analyticsRouter);

// ── Socket handlers ──
initSocketHandlers(io);

// ── MongoDB ──
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fleetDB";
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    // Start real-time location simulation after DB is ready
    startSimulation(io);
  })
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// ── Health check ──
app.get("/", (req, res) => {
  res.json({ status: "NexusFleet API running 🚀", timestamp: new Date() });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date(),
  });
});

// ── Start server ──
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 NexusFleet server running on http://localhost:${PORT}`);
});

module.exports = { app, io };
