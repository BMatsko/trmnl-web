import { RotateCcw, Settings, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { useTrmnl } from "./hooks/useTrmnl";

function App() {
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

export default App;
