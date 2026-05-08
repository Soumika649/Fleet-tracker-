/**
 * seed.js — Populate MongoDB with sample fleet data
 * Run: node seed.js
 */
const mongoose = require("mongoose");
const Driver = require("./models/Driver");
const Order = require("./models/Order");

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fleetDB")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => { console.error(err); process.exit(1); });

async function seed() {
  await Driver.deleteMany({});
  await Order.deleteMany({});

  const drivers = await Driver.insertMany([
    { name: "Ravi Kumar",   lat: 17.385, lng: 78.486, status: "active",  vehicle: "Bike",    totalDeliveries: 42, rating: 4.8 },
    { name: "Sita Devi",    lat: 17.395, lng: 78.496, status: "active",  vehicle: "Scooter", totalDeliveries: 31, rating: 4.6 },
    { name: "Arjun Singh",  lat: 17.372, lng: 78.471, status: "idle",    vehicle: "Van",     totalDeliveries: 67, rating: 4.9 },
    { name: "Meera Nair",   lat: 17.401, lng: 78.502, status: "active",  vehicle: "Bike",    totalDeliveries: 28, rating: 4.5 },
    { name: "Kiran Reddy",  lat: 17.368, lng: 78.460, status: "offline", vehicle: "Scooter", totalDeliveries: 15, rating: 4.3 },
  ]);
  console.log(`✅ Inserted ${drivers.length} drivers`);

  const orders = await Order.insertMany([
    { label: "#12", customerName: "Priya Sharma",  address: "Kondapur, Hyderabad",   lat: 17.392, lng: 78.491, status: "Out for Delivery", assignedDriver: drivers[0]._id, priority: "high",   statusHistory: [{status:"Pending",note:"Created"},{status:"Picked",note:"Driver picked up"},{status:"Out for Delivery",note:"En route"}] },
    { label: "#42", customerName: "Vikram Patel",   address: "Gachibowli, Hyderabad", lat: 17.375, lng: 78.478, status: "Pending",          assignedDriver: drivers[1]._id, priority: "normal", statusHistory: [{status:"Pending",note:"Created"}] },
    { label: "#57", customerName: "Ananya Reddy",   address: "Madhapur, Hyderabad",   lat: 17.401, lng: 78.502, status: "Delivered",        assignedDriver: drivers[2]._id, priority: "normal", statusHistory: [{status:"Pending",note:"Created"},{status:"Delivered",note:"Successfully delivered"}] },
    { label: "#63", customerName: "Rohan Mehta",    address: "HITEC City, Hyderabad", lat: 17.388, lng: 78.493, status: "Pending",          assignedDriver: drivers[3]._id, priority: "low",    statusHistory: [{status:"Pending",note:"Created"}] },
    { label: "#71", customerName: "Kavya Nair",     address: "Jubilee Hills, Hyderabad", lat: 17.378, lng: 78.465, status: "Picked",        assignedDriver: drivers[0]._id, priority: "high",   statusHistory: [{status:"Pending",note:"Created"},{status:"Picked",note:"Driver picked up"}] },
    { label: "#85", customerName: "Suresh Kumar",   address: "Banjara Hills, Hyderabad", lat: 17.412, lng: 78.448, status: "Pending",      assignedDriver: null,          priority: "normal", statusHistory: [{status:"Pending",note:"Created"}] },
  ]);
  console.log(`✅ Inserted ${orders.length} orders`);

  await mongoose.disconnect();
  console.log("🎉 Seeding complete!");
}

seed().catch(console.error);
