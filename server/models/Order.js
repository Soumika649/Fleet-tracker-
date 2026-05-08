const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "#42"
    customerName: { type: String, default: "Customer" },
    address: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Picked", "Out for Delivery", "Delivered"],
      default: "Pending",
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    estimatedDelivery: { type: Date, default: null },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Update updatedAt on save
orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Order", orderSchema);
