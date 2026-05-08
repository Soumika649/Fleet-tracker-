import React, { useState, useRef, useEffect, useCallback } from "react";
import { aiAPI } from "../../services/api";
import { haversineDistanceFE } from "../../utils/geo";

const SUGGESTIONS = [
  "Which driver is closest to Order #42?",
  "Which orders are delayed?",
  "Suggest optimal route for Driver A",
  "How many active drivers?",
  "Show analytics summary",
];

export default function AIChat({ drivers = [], orders = [] }) {
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleQuery = useCallback(async (q) => {
    const text = q || query;
    if (!text.trim()) return;
    setLoading(true);
    setQuery("");
    setHistory((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await aiAPI.query(text);
      const { answer, tool, data } = res.data;
      setHistory((prev) => [...prev, { role: "ai", text: answer, tool, data }]);
    } catch {
      // Fallback local AI logic when backend is offline
      const answer = localAI(text, drivers, orders);
      setHistory((prev) => [...prev, { role: "ai", text: answer, tool: "local", offline: true }]);
    } finally {
      setLoading(false);
    }
  }, [query, drivers, orders]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); }
  };

  return (
    <div className="ai-chat-section">
      <div className="section-label">
        <span>🤖 AI ASSISTANT</span>
        <span className="ai-badge">MCP</span>
      </div>

      <div className="ai-chat-box">
        {history.length === 0 ? (
          <div className="ai-placeholder">
            <div className="ai-icon-large">🤖</div>
            <p className="ai-intro">AI-powered fleet insights</p>
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => handleQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {history.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.role === "ai" && (
                  <div className="chat-ai-icon">
                    🤖
                    {msg.offline && <span className="offline-tag">local</span>}
                  </div>
                )}
                <div
                  className="chat-text"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            ))}
            {loading && (
              <div className="chat-bubble ai loading">
                <div className="chat-ai-icon">🤖</div>
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="ai-input-row">
        <input
          type="text"
          placeholder="Ask about your fleet…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="ai-input"
          disabled={loading}
        />
        <button
          className="ai-send-btn"
          onClick={() => handleQuery()}
          disabled={loading || !query.trim()}
          title="Send (Enter)"
        >
          {loading ? <span className="btn-spinner" /> : "↑"}
        </button>
      </div>
    </div>
  );
}

// Local fallback AI when backend is offline
function localAI(query, drivers, orders) {
  const lower = query.toLowerCase();

  if (lower.includes("closest") || lower.includes("nearest")) {
    const match = lower.match(/#?(\d+)/);
    const label = match ? `#${match[1]}` : null;
    const order = label ? orders.find((o) => o.label === label) : orders[0];
    if (!order) return `⚠️ Could not find that order.`;

    const activeDrivers = drivers.filter((d) => d.status !== "offline");
    if (!activeDrivers.length) return "⚠️ No active drivers available.";

    let closest = null, minDist = Infinity;
    activeDrivers.forEach((d) => {
      const dist = haversineDistanceFE(order.lat, order.lng, d.lat, d.lng);
      if (dist < minDist) { minDist = dist; closest = d; }
    });
    return `🚗 **${closest.name}** is the closest driver to Order ${order.label} — approximately **${minDist.toFixed(2)} km** away. Status: ${closest.status}.`;
  }

  if (lower.includes("delayed") || lower.includes("pending")) {
    const delayed = orders.filter((o) => o.status === "Pending" || o.status === "Picked");
    return delayed.length
      ? `⚠️ **${delayed.length} orders** are pending/in-progress: ${delayed.map((o) => o.label).join(", ")}.`
      : "✅ No delayed orders! All on track.";
  }

  if (lower.includes("route") || lower.includes("optimal")) {
    const active = drivers.find((d) => d.status === "active");
    return active
      ? `🗺️ Recommended for **${active.name}**: Complete nearby orders first using nearest-neighbour routing to minimize travel time.`
      : "⚠️ No active drivers found.";
  }

  if (lower.includes("active") || lower.includes("driver")) {
    const active = drivers.filter((d) => d.status === "active");
    return `👷 **${active.length} active driver(s)**: ${active.map((d) => d.name).join(", ") || "none"}.`;
  }

  if (lower.includes("analytics") || lower.includes("stats")) {
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const active = drivers.filter((d) => d.status === "active").length;
    return `📊 **Stats**: ${delivered}/${orders.length} orders delivered, ${pending} pending, ${active} drivers active.`;
  }

  return `ℹ️ Try asking:\n• "Which driver is closest to Order #42?"\n• "Which orders are delayed?"\n• "Suggest optimal route"\n• "How many active drivers?"`;
}
