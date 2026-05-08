const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const Order = require("../models/Order");

router.get("/summary", async (req, res) => {
  try {
    const [totalDrivers, activeDrivers, idleDrivers, offlineDrivers] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ status: "active" }),
      Driver.countDocuments({ status: "idle" }),
      Driver.countDocuments({ status: "offline" }),
    ]);

    const [totalOrders, delivered, outForDelivery, picked, pending] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "Delivered" }),
      Order.countDocuments({ status: "Out for Delivery" }),
      Order.countDocuments({ status: "Picked" }),
      Order.countDocuments({ status: "Pending" }),
    ]);

    const onTimeRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;

    res.json({
      drivers: { total: totalDrivers, active: activeDrivers, idle: idleDrivers, offline: offlineDrivers },
      orders: { total: totalOrders, delivered, outForDelivery, picked, pending },
      onTimeRate,
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
