# ⬡ NexusFleet — AI-Powered Fleet & Delivery Tracker

A real-time logistics dashboard for tracking delivery vehicles, managing orders, and getting AI-powered insights.

## 🚀 Features

### Live Map Tracking
- All drivers shown as animated markers on a dark-themed Leaflet map
- Delivery zone overlays (Zone A–D) with dashed circles
- Route polylines connecting drivers to their assigned orders
- Marker colors reflect driver status (active = cyan, idle = amber, offline = gray)

### Real-Time Updates (WebSockets)
- Driver GPS coordinates update every **3 seconds** via Socket.IO
- `locationUpdate` and `driverBatch` events keep all clients in sync
- Order status changes broadcast instantly to all connected dashboards
- Server-side location simulator (`/server/services/locationSimulator.js`) performs a random walk within Hyderabad bounds

### AI Query System (MCP Server)
Powered by `POST /ai/query` — supports natural language:
- *"Which driver is closest to Order #42?"* → Haversine distance calc
- *"Which orders are delayed?"* → Filters Pending/Picked orders
- *"Suggest optimal route for Driver A"* → Nearest-neighbour greedy algorithm
- *"How many active drivers?"* → Live count
- *"Show analytics"* → Summary stats

Falls back to client-side logic when backend is offline (Demo Mode).

### Analytics Dashboard
- KPI cards: Total/Active drivers, Delivered, Pending, On-Time %
- Order status breakdown bar chart
- Top drivers leaderboard (deliveries + rating)
- Delivery completion progress bar

## 🗂️ Project Structure

```
fleet-tracker/
├── server/
│   ├── server.js              # Entry point (Express + Socket.IO)
│   ├── models/
│   │   ├── Driver.js
│   │   ├── Order.js
│   │   └── DeliveryHistory.js
│   ├── routes/
│   │   ├── drivers.js
│   │   ├── orders.js
│   │   ├── ai.js              # MCP-style AI endpoints
│   │   └── analytics.js
│   ├── services/
│   │   ├── aiService.js       # Haversine + route logic
│   │   └── locationSimulator.js  # Real-time GPS simulation
│   ├── socket/
│   │   └── socketHandlers.js
│   ├── seed.js
│   └── package.json
│
└── client/
    ├── src/
    │   ├── App.js             # Main shell + layout
    │   ├── App.css            # All styles
    │   ├── components/
    │   │   ├── map/MapView.js         # Leaflet map + animated markers
    │   │   ├── orders/OrdersPanel.js  # Order cards + filter
    │   │   ├── ai/AIChat.js           # AI chat interface
    │   │   └── dashboard/AnalyticsDashboard.js
    │   ├── hooks/
    │   │   └── useFleetData.js  # All real-time state management
    │   ├── services/
    │   │   ├── socket.js        # Socket.IO singleton
    │   │   └── api.js           # Axios API wrappers
    │   └── utils/geo.js
    └── package.json
```

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd fleet-tracker

# 2. Backend
cd server
npm install
node seed.js      # Populate sample data
npm run dev       # Start with nodemon on :5000

# 3. Frontend (new terminal)
cd ../client
npm install
npm start         # React app on :3000
```

Open http://localhost:3000

## 🌐 Environment Variables

Create `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fleetDB
```

Create `client/.env`:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /drivers | List all drivers |
| PATCH | /drivers/:id/location | Update GPS |
| GET | /orders | List all orders |
| PATCH | /orders/:id/status | Update order status |
| POST | /ai/query | Natural language AI query |
| GET | /ai/closest-driver?lat=&lng= | Closest driver |
| GET | /ai/delayed-orders | Pending/delayed orders |
| GET | /ai/suggest-route/:id | Route suggestion |
| GET | /analytics/summary | Dashboard stats |

## 🔌 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `initialState` | Server→Client | All drivers + orders |
| `locationUpdate` | Server→Client | Single driver update |
| `driverBatch` | Server→Client | All driver positions |
| `orderStatusUpdate` | Server→Client | Updated order |
| `updateLocation` | Client→Server | Driver GPS update |
| `updateOrderStatus` | Client→Server | Status change |

## 🧠 Challenges & Solutions

**Challenge 1: Real-time marker movement without flicker**
- Used `useRef` + `marker.setLatLng()` instead of re-rendering Marker component to update positions smoothly.

**Challenge 2: Backend offline graceful degradation**
- `useFleetData` hook catches API errors and falls back to mock data + client-side location simulation, so the demo works without MongoDB.

**Challenge 3: AI without a real LLM**
- Built an MCP-style dispatcher (`/ai/query`) that routes queries by keyword matching to specific backend tools (Haversine distance, nearest-neighbour route, status filters). Falls back to client-side equivalent when offline.

**Challenge 4: Socket.IO connection management**
- Used a singleton socket module and properly cleaned up event listeners with `socket.off()` in useEffect returns to prevent memory leaks.

## 🔮 Future Improvements

- Real AI integration (Claude/GPT API) for free-form query understanding
- Driver mobile app sending actual GPS coordinates
- Traffic API integration for real route suggestions
- Push notifications for delayed deliveries
- Historical analytics with time-series charts
- Multi-city / multi-zone support
- Authentication (JWT) for admin/driver roles

## 🎥 Demo Video

[Watch Demo](https://drive.google.com/file/d/1MTQ8c5Ms4sPBK9qy34xdjNxdUAqtClHo/view?usp=drivesdk)

## Technologies
- **Frontend**: React 18, Leaflet + react-leaflet, Socket.IO client, Axios
- **Backend**: Node.js, Express 4, Socket.IO, Mongoose
- **Database**: MongoDB
- **Maps**: CartoDB Dark tiles (Leaflet)
- **AI**: Custom MCP-style dispatcher with Haversine + nearest-neighbour algorithms
