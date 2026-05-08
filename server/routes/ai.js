const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const Order = require("../models/Order");
const { haversineDistance, suggestOptimalRoute } = require("../services/aiService");

/**
 * MCP-style AI query dispatcher
 * POST /ai/query  { query: "..." }
 */
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });

    const lower = query.toLowerCase();

    // Tool: closest-driver
    if (lower.includes("closest") || lower.includes("nearest")) {
      const match = lower.match(/#?(\d+)/);
      const label = match ? `#${match[1]}` : null;
      let lat = 17.38, lng = 78.48;
      let orderLabel = label;

      if (label) {
        const order = await Order.findOne({ label });
        if (order) { lat = order.lat; lng = order.lng; }
        else orderLabel = "unknown order";
      }

      const drivers = await Driver.find({ status: { $ne: "offline" } });
      if (!drivers.length) return res.json({ tool: "closest-driver", answer: "No active drivers found.", data: null });

      let closest = null, minDist = Infinity;
      drivers.forEach((d) => {
        const dist = haversineDistance(lat, lng, d.lat, d.lng);
        if (dist < minDist) { minDist = dist; closest = d; }
      });

      return res.json({
        tool: "closest-driver",
        answer: `🚗 **${closest.name}** is the closest driver to Order ${orderLabel || ""} — currently **${minDist.toFixed(2)} km** away. Status: ${closest.status}.`,
        data: { driver: closest, distanceKm: minDist.toFixed(2) },
      });
    }

    // Tool: delayed-orders
    if (lower.includes("delayed") || lower.includes("pending") || lower.includes("late")) {
      const delayed = await Order.find({
        status: { $in: ["Pending", "Picked"] },
      }).populate("assignedDriver", "name");

      const overdue = delayed.filter((o) => {
        const ageMin = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
        return ageMin > 30;
      });

      return res.json({
        tool: "delayed-orders",
        answer: delayed.length
          ? `⚠️ **${delayed.length} orders** are pending/picked. ${overdue.length} may be delayed (>30 min). Orders: ${delayed.map((o) => o.label).join(", ")}.`
          : "✅ No delayed orders! All deliveries are on track.",
        data: { delayed, overdue },
      });
    }

    // Tool: suggest-route
    if (lower.includes("route") || lower.includes("optimal") || lower.includes("suggest")) {
      const nameMatch = lower.match(/driver\s+([a-z]+)/i);
      let driver = null;
      if (nameMatch) {
        driver = await Driver.findOne({ name: new RegExp(nameMatch[1], "i") });
      }
      if (!driver) {
        driver = await Driver.findOne({ status: "active" });
      }
      if (!driver) return res.json({ tool: "suggest-route", answer: "No active drivers found.", data: null });

      const result = await suggestOptimalRoute(driver);
      return res.json({
        tool: "suggest-route",
        answer: result.message,
        data: result,
      });
    }

    // Tool: active-drivers
    if (lower.includes("active") || lower.includes("driver") || lower.includes("how many")) {
      const active = await Driver.find({ status: "active" });
      const idle = await Driver.find({ status: "idle" });
      return res.json({
        tool: "active-drivers",
        answer: `👷 **${active.length} active** driver(s): ${active.map((d) => d.name).join(", ") || "none"}. ${idle.length} idle.`,
        data: { active, idle },
      });
    }

    // Tool: analytics
    if (lower.includes("analytics") || lower.includes("stats") || lower.includes("total") || lower.includes("completed")) {
      const total = await Order.countDocuments();
      const delivered = await Order.countDocuments({ status: "Delivered" });
      const pending = await Order.countDocuments({ status: "Pending" });
      const active = await Driver.countDocuments({ status: "active" });
      return res.json({
        tool: "analytics",
        answer: `📊 Today's stats: **${delivered}/${total}** orders delivered. **${pending}** pending. **${active}** drivers active. On-time rate: ${total > 0 ? Math.round((delivered / total) * 100) : 0}%.`,
        data: { total, delivered, pending, active },
      });
    }

    // Default fallback
    return res.json({
      tool: "help",
      answer: `ℹ️ I can help with:\n• "Which driver is closest to Order #42?"\n• "Which orders are delayed?"\n• "Suggest optimal route for Driver A"\n• "How many active drivers?"\n• "Show analytics"`,
      data: null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ai/closest-driver?lat=&lng= (legacy endpoint)
router.get("/closest-driver", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });
    const drivers = await Driver.find({ status: { $ne: "offline" } });
    if (!drivers.length) return res.json({ message: "No active drivers", driver: null });

    let closest = null, minDist = Infinity;
    drivers.forEach((d) => {
      const dist = haversineDistance(parseFloat(lat), parseFloat(lng), d.lat, d.lng);
      if (dist < minDist) { minDist = dist; closest = d; }
    });
    res.json({ message: "Closest driver found", driver: closest, distanceKm: minDist.toFixed(2) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ai/delayed-orders
router.get("/delayed-orders", async (req, res) => {
  try {
    const delayed = await Order.find({ status: { $in: ["Pending", "Picked"] } }).populate("assignedDriver", "name");
    res.json({ count: delayed.length, orders: delayed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ai/suggest-route/:driverId
router.get("/suggest-route/:driverId", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    const result = await suggestOptimalRoute(driver);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
