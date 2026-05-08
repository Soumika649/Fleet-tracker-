const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");

// GET all drivers
router.get("/", async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ status: 1, name: 1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single driver
router.get("/:id", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create driver
router.post("/", async (req, res) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update driver
router.patch("/:id", async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    // Broadcast update via socket
    req.app.get("io").emit("locationUpdate", driver);
    res.json(driver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update driver location
router.patch("/:id/location", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { lat, lng, lastUpdated: new Date() },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    req.app.get("io").emit("locationUpdate", driver);
    res.json(driver);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE driver
router.delete("/:id", async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ message: "Driver deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
