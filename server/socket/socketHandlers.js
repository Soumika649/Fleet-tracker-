const Driver = require("../models/Driver");
const Order = require("../models/Order");

function initSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current state on connection
    Promise.all([Driver.find(), Order.find().populate("assignedDriver", "name status")])
      .then(([drivers, orders]) => {
        socket.emit("initialState", { drivers, orders });
      })
      .catch(console.error);

    // Driver sends manual location update
    socket.on("updateLocation", async (data) => {
      try {
        const { driverId, lat, lng } = data;
        const driver = await Driver.findByIdAndUpdate(
          driverId,
          { lat, lng, lastUpdated: new Date() },
          { new: true }
        );
        if (driver) io.emit("locationUpdate", driver);
      } catch (err) {
        console.error("Location update error:", err.message);
      }
    });

    // Order status update from driver app
    socket.on("updateOrderStatus", async (data) => {
      try {
        const { orderId, status, note } = data;
        const order = await Order.findById(orderId);
        if (!order) return;
        order.status = status;
        order.updatedAt = new Date();
        order.statusHistory.push({ status, note: note || "", timestamp: new Date() });
        await order.save();
        io.emit("orderStatusUpdate", order);
      } catch (err) {
        console.error("Order status error:", err.message);
      }
    });

    // Driver goes online/offline
    socket.on("setDriverStatus", async (data) => {
      try {
        const { driverId, status } = data;
        const driver = await Driver.findByIdAndUpdate(driverId, { status }, { new: true });
        if (driver) io.emit("driverStatusChange", driver);
      } catch (err) {
        console.error("Driver status error:", err.message);
      }
    });

    // Ping/pong for connection health
    socket.on("ping", () => socket.emit("pong", { ts: Date.now() }));

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initSocketHandlers };
