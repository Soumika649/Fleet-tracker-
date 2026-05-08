import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

socket.on("connect", () => console.log("🔌 Socket connected:", socket.id));
socket.on("disconnect", (reason) => console.log("❌ Socket disconnected:", reason));
socket.on("connect_error", (err) => console.error("Socket error:", err.message));

export default socket;
