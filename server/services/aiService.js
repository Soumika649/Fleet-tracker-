const Order = require("../models/Order");

/**
 * Haversine distance between two lat/lng points (returns km)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Nearest-neighbour route suggestion for a driver
 */
async function suggestOptimalRoute(driver) {
  const pendingOrders = await Order.find({
    assignedDriver: driver._id,
    status: { $in: ["Pending", "Picked", "Out for Delivery"] },
  });

  if (!pendingOrders.length) {
    return {
      driver: driver.name,
      currentLocation: { lat: driver.lat, lng: driver.lng },
      suggestedRoute: [],
      message: `✅ No pending orders for ${driver.name}. Free to take new assignments.`,
    };
  }

  // Nearest-neighbour greedy algorithm
  let currentLat = driver.lat;
  let currentLng = driver.lng;
  const remaining = [...pendingOrders];
  const sorted = [];

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((o, i) => {
      const dist = haversineDistance(currentLat, currentLng, o.lat, o.lng);
      if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
    });
    const nearest = remaining.splice(nearestIdx, 1)[0];
    sorted.push({ ...nearest.toObject(), distanceKm: nearestDist.toFixed(2) });
    currentLat = nearest.lat;
    currentLng = nearest.lng;
  }

  // Estimate total distance
  let totalDist = haversineDistance(driver.lat, driver.lng, sorted[0].lat, sorted[0].lng);
  for (let i = 0; i < sorted.length - 1; i++) {
    totalDist += haversineDistance(sorted[i].lat, sorted[i].lng, sorted[i + 1].lat, sorted[i + 1].lng);
  }

  return {
    driver: driver.name,
    currentLocation: { lat: driver.lat, lng: driver.lng },
    suggestedRoute: sorted.map((o, i) => ({
      stop: i + 1,
      orderId: o.label,
      lat: o.lat,
      lng: o.lng,
      status: o.status,
      distanceKm: o.distanceKm,
    })),
    totalDistanceKm: totalDist.toFixed(2),
    estimatedMinutes: Math.round(totalDist * 3.5),
    message: `🗺️ Optimal route for **${driver.name}**: ${sorted.map((o) => o.label).join(" → ")}. Total: ~${totalDist.toFixed(1)} km, ETA ~${Math.round(totalDist * 3.5)} min.`,
  };
}

module.exports = { haversineDistance, suggestOptimalRoute };
