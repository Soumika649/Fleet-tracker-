const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    lat: { type: Number, default: 17.385 },
    lng: { type: Number, default: 78.486 },
    status: {
      type: String,
      enum: ["active", "idle", "offline"],
      default: "idle",
    },
    phone: { type: String, default: "" },
    vehicle: { type: String, default: "Bike" },
    totalDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
