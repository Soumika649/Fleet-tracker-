const Driver = require("../models/Driver");

// Hyderabad area bounds
const BOUNDS = { latMin: 17.340, latMax: 17.430, lngMin: 78.440, lngMax: 78.540 };
// Movement step (each 3 seconds)
const STEP = 0.0005;

let simulationInterval = null;

/**
 * Starts continuous GPS simulation for all active/idle drivers
 * Emits "locationUpdate" and "driverBatch" via socket.io
 */
async function startSimulation(io) {
  if (simulationInterval) clearInterval(simulationInterval);

  console.log("🛰️  Location simulator started");

  simulationInterval = setInterval(async () => {
    try {
      const drivers = await Driver.find({ status: { $ne: "offline" } });
      if (!drivers.length) return;

      const updates = [];

      for (const driver of drivers) {
        // Random walk with boundary bounce
        const dLat = (Math.random() - 0.5) * STEP * 2;
        const dLng = (Math.random() - 0.5) * STEP * 2;

        let newLat = driver.lat + dLat;
        let newLng = driver.lng + dLng;

        // Clamp within bounds
        newLat = Math.max(BOUNDS.latMin, Math.min(BOUNDS.latMax, newLat));
        newLng = Math.max(BOUNDS.lngMin, Math.min(BOUNDS.lngMax, newLng));

        driver.lat = newLat;
        driver.lng = newLng;
        driver.lastUpdated = new Date();
        await driver.save();

        updates.push({
          _id: driver._id,
          name: driver.name,
          lat: driver.lat,
          lng: driver.lng,
          status: driver.status,
          lastUpdated: driver.lastUpdated,
        });

        // Emit individual update
        io.emit("locationUpdate", updates[updates.length - 1]);
      }

      // Also emit a batch for efficient bulk update
      io.emit("driverBatch", updates);
    } catch (err) {
      console.error("Simulation error:", err.message);
    }
  }, 3000); // every 3 seconds
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log("🛑 Location simulator stopped");
  }
}

module.exports = { startSimulation, stopSimulation };
