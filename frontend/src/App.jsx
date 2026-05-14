import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [greeting, setGreeting] = useState(null);
  const [echo, setEcho] = useState(null);
  const [name, setName] = useState("Deployment");
  const [message, setMessage] = useState("Hello from React");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiLabel = useMemo(
    () => API_BASE_URL || "same origin / Vite proxy",
    []
  );

  async function loadHealth() {
    setLoading(true);
    setError("");

    try {
      const [healthData, greetingData] = await Promise.all([
        apiRequest("/api/health"),
        apiRequest(`/api/greeting?name=${encodeURIComponent(name)}`)
      ]);

      setHealth(healthData);
      setGreeting(greetingData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendEcho(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const echoData = await apiRequest("/api/echo", {
        method: "POST",
        body: JSON.stringify({ message })
      });

      setEcho(echoData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Full-stack smoke test</p>
          <h1 id="page-title">React + FastAPI deployment check</h1>
          <p className="lede">
            A tiny frontend calls a Python API so you can verify routing, CORS,
            container builds, and server deployment in one place.
          </p>
        </div>

        <div className="status-strip" aria-live="polite">
          <span className={health?.status === "ok" ? "dot online" : "dot"} />
          <span>{health?.status === "ok" ? "Backend online" : "Checking backend"}</span>
        </div>
      </section>

      <section className="workspace" aria-label="Deployment test controls">
        <div className="test-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Connection</p>
              <h2>API health</h2>
            </div>
            <button type="button" onClick={loadHealth} disabled={loading}>
              Refresh
            </button>
          </div>

          <dl className="result-list">
            <div>
              <dt>API base</dt>
              <dd>{apiLabel}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{health?.status || "waiting"}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{health?.service || "unknown"}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{health?.timestamp || "not checked yet"}</dd>
            </div>
          </dl>
        </div>

        <form className="test-panel" onSubmit={sendEcho}>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Round trip</p>
              <h2>Send test data</h2>
            </div>
            <button type="submit" disabled={loading || !message.trim()}>
              Send
            </button>
          </div>

          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={loadHealth}
              placeholder="Deployment"
            />
          </label>

          <label>
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a test message"
              rows="4"
              maxLength="240"
            />
          </label>
        </form>
      </section>

      {(greeting || echo || error) && (
        <section className="response-band" aria-live="polite">
          {error && <p className="error-message">{error}</p>}
          {greeting && <p>{greeting.message}</p>}
          {echo && (
            <pre>{JSON.stringify(echo, null, 2)}</pre>
          )}
        </section>
      )}
    </main>
  );
}
