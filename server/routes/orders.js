const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Driver = require("../models/Driver");

// GET all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("assignedDriver", "name lat lng status vehicle")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("assignedDriver");
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create order
router.post("/", async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      statusHistory: [{ status: req.body.status || "Pending", note: "Order created" }],
    });
    await order.save();
    req.app.get("io").emit("newOrder", order);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    order.updatedAt = new Date();
    order.statusHistory.push({ status, timestamp: new Date(), note: note || "" });
    await order.save();

    // If delivered, increment driver's delivery count
    if (status === "Delivered" && order.assignedDriver) {
      await Driver.findByIdAndUpdate(order.assignedDriver, {
        $inc: { totalDeliveries: 1 },
      });
    }

    req.app.get("io").emit("orderStatusUpdate", order);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH assign driver
router.patch("/:id/assign", async (req, res) => {
  try {
    const { driverId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { assignedDriver: driverId, updatedAt: new Date() },
      { new: true }
    ).populate("assignedDriver", "name status");
    if (!order) return res.status(404).json({ error: "Order not found" });
    req.app.get("io").emit("orderStatusUpdate", order);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
