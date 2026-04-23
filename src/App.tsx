import { RotateCcw, Settings, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { useTrmnl } from "./hooks/useTrmnl";

function DashboardPage() {
  const {
    state,
    isLoading,
    error,
    countdown,
    forceRefresh,
    nextScreen,
    changeDevice,
    changeBaseUrl,
    changeMacAddress,
    changeRefreshInterval,
    changeApiKey,
  } = useTrmnl();

  const {
    currentImage,
    selectedDevice,
    devices,
    baseUrl,
    macAddress,
    refreshIntervalOverride,
  } = state;

  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(selectedDevice?.api_key ?? "");
  const [serverUrlInput, setServerUrlInput] = useState(baseUrl);
  const [macAddressInput, setMacAddressInput] = useState(macAddress ?? "");
  const [refreshIntervalInput, setRefreshIntervalInput] = useState(
    refreshIntervalOverride ? String(refreshIntervalOverride) : ""
  );
  const hideControlsTimerRef = useRef<number | null>(null);
  const showSettingsRef = useRef(showSettings);
  const dashboardUrl = `${baseUrl}/dashboard`;

  useEffect(() => {
    showSettingsRef.current = showSettings;
    if (showSettings) {
      setShowControls(true);
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
        hideControlsTimerRef.current = null;
      }
    }
  }, [showSettings]);

  useEffect(() => {
    setServerUrlInput(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    setMacAddressInput(macAddress ?? "");
  }, [macAddress]);

  useEffect(() => {
    setApiKeyInput(selectedDevice?.api_key ?? "");
  }, [selectedDevice?.api_key]);

  useEffect(() => {
    setRefreshIntervalInput(
      refreshIntervalOverride ? String(refreshIntervalOverride) : ""
    );
  }, [refreshIntervalOverride]);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);

    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }

    if (showSettingsRef.current) {
      return;
    }

    hideControlsTimerRef.current = window.setTimeout(() => {
      if (!showSettingsRef.current) {
        setShowControls(false);
      }
    }, 2200);
  }, []);

  const saveConnectionConfig = async (
    options: { requireApiKey: boolean; refreshAfterSave: boolean }
  ) => {
    const normalizedServerUrl = serverUrlInput.trim();
    const normalizedMacAddress = macAddressInput.trim();
    const normalizedRefreshInterval = refreshIntervalInput.trim();
    const normalizedApiKey = apiKeyInput.trim();

    if (options.requireApiKey && !normalizedApiKey) {
      return false;
    }

    if (normalizedServerUrl && normalizedServerUrl !== baseUrl) {
      const serverSaved = await changeBaseUrl(normalizedServerUrl);
      if (!serverSaved) {
        return false;
      }
    }

    if (normalizedMacAddress !== (macAddress ?? "")) {
      const macSaved = await changeMacAddress(normalizedMacAddress);
      if (!macSaved) {
        return false;
      }
    }

    const currentRefreshInterval = refreshIntervalOverride
      ? String(refreshIntervalOverride)
      : "";
    if (normalizedRefreshInterval !== currentRefreshInterval) {
      const refreshIntervalSaved = await changeRefreshInterval(
        normalizedRefreshInterval
      );
      if (!refreshIntervalSaved) {
        return false;
      }
    }

    const currentApiKey = selectedDevice?.api_key ?? "";
    if (normalizedApiKey !== currentApiKey) {
      const apiSaved = await changeApiKey(normalizedApiKey);
      if (!apiSaved) {
        return false;
      }
    }

    if (options.refreshAfterSave) {
      await forceRefresh();
    }

    return true;
  };

  const handleConnect = async () => {
    const saved = await saveConnectionConfig({
      requireApiKey: true,
      refreshAfterSave: false,
    });
    if (!saved) {
      return;
    }

    setApiKeyInput("");
    setShowSettings(false);
    revealControls();
  };

  const handleSaveSettings = async () => {
    const saved = await saveConnectionConfig({
      requireApiKey: false,
      refreshAfterSave: true,
    });
    if (!saved) {
      return;
    }

    setShowSettings(false);
    revealControls();
  };

  const handleToggleSettings = () => {
    setShowSettings((previous) => !previous);
    revealControls();
  };

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (devices.length === 0 && !selectedDevice && !isLoading) {
    return (
      <div className="trmnl-container trmnl-setup-view">
        <div className="trmnl-error-container">
          <div className="trmnl-error-content">
            <h2>Welcome to TRMNL Web</h2>
            <p>View your TRMNL device display right in your browser.</p>

            <div className="trmnl-setup-section">
              <h3>Server URL</h3>
              <p className="trmnl-note">
                Point this app to your TRMNL-compatible instance (for example,
                Larapaper).
              </p>
              <div className="trmnl-input-group">
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleConnect()}
                  placeholder="https://paper.example.com"
                  className="trmnl-input"
                />
              </div>
            </div>

            <div className="trmnl-setup-section">
              <h3>MAC Address (Optional)</h3>
              <p className="trmnl-note">
                Some servers map requests using API key + MAC address.
              </p>
              <div className="trmnl-input-group">
                <input
                  type="text"
                  value={macAddressInput}
                  onChange={(e) => setMacAddressInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleConnect()}
                  placeholder="41:B4:10:39:A1:24"
                  className="trmnl-input"
                />
              </div>
            </div>

            <div className="trmnl-setup-section">
              <h3>Enter Your API Key</h3>
              <p className="trmnl-note">
                You can find your device API key in your{" "}
                <a
                  href={dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dashboard
                </a>{" "}
                under Device Settings.
              </p>
              <div className="trmnl-input-group">
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleConnect()}
                  placeholder="Paste your device API key"
                  className="trmnl-input"
                />
                <button
                  onClick={() => void handleConnect()}
                  type="button"
                  className="trmnl-button"
                  disabled={!apiKeyInput.trim()}
                >
                  Connect
                </button>
              </div>
            </div>

            {error && <p className="trmnl-error-message">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const controlClassName = [
    "trmnl-control-dock",
    showControls ? "trmnl-control-dock--visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="trmnl-container"
      onMouseMove={revealControls}
      onPointerDown={revealControls}
      onTouchStart={revealControls}
    >
      <div className="trmnl-display">
        <div className="trmnl-image-container">
          {isLoading && !currentImage && (
            <div className="trmnl-loading">
              <div className="trmnl-loading-spinner"></div>
              <p>Loading TRMNL display...</p>
            </div>
          )}

          {currentImage && (
            <img
              src={currentImage.url}
              alt="TRMNL Display"
              className="trmnl-image"
            />
          )}

          {!isLoading && !currentImage && selectedDevice && (
            <div className="trmnl-no-image">
              <p>No image available</p>
              <button onClick={forceRefresh} type="button" className="trmnl-button">
                Refresh
              </button>
            </div>
          )}
        </div>

        <div className={controlClassName}>
          <div className="trmnl-control-bar">
            <div className="trmnl-control-meta">
              <span className="trmnl-device-name">
                {selectedDevice?.name || selectedDevice?.friendly_id || "TRMNL Device"}
              </span>
              <span className="trmnl-countdown trmnl-countdown-inline">
                Next refresh: <strong>{countdown}</strong>
              </span>
            </div>

            <div className="trmnl-control-actions">
              {devices.length > 1 ? (
                <select
                  value={selectedDevice?.id || ""}
                  onChange={(e) => {
                    const device = devices.find((d) => d.id === e.target.value);
                    if (device) {
                      changeDevice(device);
                      forceRefresh();
                    }
                  }}
                  className="trmnl-device-select trmnl-device-select-inline"
                >
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name || device.friendly_id || device.id}
                    </option>
                  ))}
                </select>
              ) : null}

              <button
                onClick={nextScreen}
                type="button"
                disabled={isLoading}
                className="trmnl-button trmnl-button-small trmnl-button-icon"
                title="Next screen"
              >
                <SkipForward size={18} />
              </button>
              <button
                onClick={forceRefresh}
                type="button"
                disabled={isLoading}
                className="trmnl-button trmnl-button-small trmnl-button-icon"
                title="Refresh now"
              >
                <RotateCcw
                  size={18}
                  className={isLoading ? "trmnl-icon-spin" : ""}
                />
              </button>
              <button
                onClick={handleToggleSettings}
                type="button"
                className="trmnl-button trmnl-button-small trmnl-button-icon"
                title="Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="trmnl-settings-panel trmnl-settings-panel-floating">
              <h3>Settings</h3>

              <div className="trmnl-settings-section">
                <label htmlFor="server-url-input">Server URL</label>
                <div className="trmnl-input-group">
                  <input
                    id="server-url-input"
                    type="text"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSaveSettings()}
                    placeholder="https://paper.example.com"
                    className="trmnl-input"
                  />
                </div>
              </div>

              <div className="trmnl-settings-section">
                <label htmlFor="mac-address-input">MAC Address (Optional)</label>
                <div className="trmnl-input-group">
                  <input
                    id="mac-address-input"
                    type="text"
                    value={macAddressInput}
                    onChange={(e) => setMacAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSaveSettings()}
                    placeholder="41:B4:10:39:A1:24"
                    className="trmnl-input"
                  />
                </div>
              </div>

              <div className="trmnl-settings-section">
                <label htmlFor="api-key-input">API Key</label>
                <div className="trmnl-input-group">
                  <input
                    id="api-key-input"
                    type="text"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSaveSettings()}
                    placeholder="Paste your device API key"
                    className="trmnl-input"
                  />
                </div>
              </div>

              <div className="trmnl-settings-section">
                <label htmlFor="refresh-interval-input">
                  Refresh Interval (seconds)
                </label>
                <div className="trmnl-input-group">
                  <input
                    id="refresh-interval-input"
                    type="number"
                    min="0"
                    step="1"
                    value={refreshIntervalInput}
                    onChange={(e) => setRefreshIntervalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSaveSettings()}
                    placeholder="Defaults to device refresh rate"
                    className="trmnl-input"
                  />
                </div>
              </div>

              <div className="trmnl-settings-actions">
                <button
                  onClick={() => void handleSaveSettings()}
                  type="button"
                  className="trmnl-button trmnl-button-primary"
                >
                  Save
                </button>
                <button
                  onClick={handleReset}
                  type="button"
                  className="trmnl-button"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="trmnl-toast trmnl-toast-error">{error}</div>}
    </div>
  );
}

function DetailsPage() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousBackground = document.body.style.background;
    const previousColor = document.body.style.color;

    document.body.style.overflow = 'auto';
    document.body.style.background = '#020617';
    document.body.style.color = '#e2e8f0';
    document.title = 'TRMNL Web · Details';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.background = previousBackground;
      document.body.style.color = previousColor;
      document.title = 'TRMNL Web';
    };
  }, []);

  const pageStyle = {
    minHeight: '100vh',
    padding: '48px 20px',
    background:
      'radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 30%), radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 26%), linear-gradient(180deg, #020617 0%, #0f172a 54%, #020617 100%)',
    color: '#e2e8f0',
  };

  const shellStyle = {
    width: '100%',
    maxWidth: '980px',
    margin: '0 auto',
    padding: '32px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '28px',
    background: 'rgba(15, 23, 42, 0.78)',
    boxShadow: '0 30px 80px rgba(2, 6, 23, 0.45)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  };

  const cardStyle = {
    border: '1px solid rgba(148, 163, 184, 0.16)',
    borderRadius: '22px',
    background: 'rgba(15, 23, 42, 0.72)',
    padding: '20px',
  };

  const codeStyle = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '999px',
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    color: '#f8fafc',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
    fontSize: '0.92em',
  };

  const parameterRows = [
    {
      name: 'api_key',
      description:
        'Preloads the dashboard with your device API key so you can skip the setup form.',
      example: '?api_key=your_device_api_key',
    },
    {
      name: 'server_url',
      description:
        'Points the dashboard at the root of your TRMNL-compatible server. Use the server origin, not an API path.',
      example: '?server_url=https://paper.example.com',
    },
    {
      name: 'refresh',
      description:
        'Overrides the refresh interval in seconds. Use a positive integer like 15 or 30.',
      example: '?refresh=15',
    },
  ];

  const exampleUrl =
    '/?api_key=your_device_api_key&server_url=https://paper.example.com&refresh=15';

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.22em', color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>
              TRMNL Web
            </p>
            <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(2.1rem, 4vw, 3.5rem)', lineHeight: 1.05, color: '#f8fafc' }}>
              dashboard URL parameters
            </h1>
            <p style={{ margin: '12px 0 0', maxWidth: '70ch', fontSize: '1.02rem', lineHeight: 1.75, color: '#cbd5e1' }}>
              Use these query parameters on the main dashboard route to jump straight into a configured session. The app reads them when it loads, then uses them to seed the dashboard connection settings.
            </p>
          </div>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 18px',
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              background: 'rgba(14, 165, 233, 0.14)',
              color: '#e0f2fe',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Open dashboard
          </a>
        </div>

        <div style={{ display: 'grid', gap: '18px', marginTop: '28px' }}>
          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>How to use it</h2>
            <ol style={{ margin: '16px 0 0', paddingLeft: '20px', color: '#cbd5e1', lineHeight: 1.8 }}>
              <li>Open the dashboard with a URL like <code style={codeStyle}>/?api_key=...&server_url=...&refresh=...</code>.</li>
              <li>Use <code style={codeStyle}>api_key</code> to preload your device credentials.</li>
              <li>Use <code style={codeStyle}>server_url</code> to point the app at your Larapaper-compatible server.</li>
              <li>Use <code style={codeStyle}>refresh</code> to override the refresh interval in seconds.</li>
            </ol>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {parameterRows.map((parameter) => (
              <article key={parameter.name} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem' }}><code style={codeStyle}>{parameter.name}</code></h3>
                </div>
                <p style={{ margin: '12px 0 0', color: '#cbd5e1', lineHeight: 1.75 }}>{parameter.description}</p>
                <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                  Example: <code style={codeStyle}>{parameter.example}</code>
                </p>
              </article>
            ))}
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Example</h2>
            <p style={{ margin: '12px 0 0', color: '#cbd5e1', lineHeight: 1.75 }}>
              Combine all three parameters when you want the dashboard to open already configured:
            </p>
            <pre
              style={{
                margin: '16px 0 0',
                padding: '16px',
                overflowX: 'auto',
                borderRadius: '18px',
                background: 'rgba(2, 6, 23, 0.92)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                color: '#f8fafc',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
{exampleUrl}
            </pre>
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Notes</h2>
            <ul style={{ margin: '16px 0 0', paddingLeft: '20px', color: '#cbd5e1', lineHeight: 1.8 }}>
              <li>If a parameter is omitted, the dashboard falls back to the saved settings or the default app behavior.</li>
              <li><code style={codeStyle}>server_url</code> should be a valid http(s) origin and can include or omit the protocol.</li>
              <li><code style={codeStyle}>refresh</code> only accepts positive whole numbers in seconds.</li>
              <li>The dashboard route is the home page; this help page lives at <code style={codeStyle}>/details</code>.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [pathname, setPathname] = useState(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname
  );

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname === '/details') {
    return <DetailsPage />;
  }

  return <DashboardPage />;
}

export default App;
