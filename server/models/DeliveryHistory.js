const mongoose = require("mongoose");

const deliveryHistorySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  status: String,
  lat: Number,
  lng: Number,
  timestamp: { type: Date, default: Date.now },
  note: String,
});

module.exports = mongoose.model("DeliveryHistory", deliveryHistorySchema);
