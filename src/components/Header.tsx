import { useEffect, useState } from 'react'
import {
  Activity,
  Clock3,
  CloudSun,
  Globe,
  Info,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Radio,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  Thermometer,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const viewTitles: Record<string, string> = {
  command: 'Command Center',
  storm: 'Storm Intelligence',
  hazards: 'Hazard Explorer',
  impact: 'Impact Intelligence',
  alerts: 'Alert Center',
  observatory: 'Data Observatory',
  simulation: 'Simulation Lab',
  verification: 'Model Verification',
  analyst: 'Tropo',
  settings: 'System Settings',
}

const pad = (v: number) => String(Math.max(0, Math.round(v))).padStart(2, '0')

function formatIst(isoString: string) {
  const d = new Date(isoString)
  // Calculate IST (UTC + 5:30)
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  const ist = new Date(utc + 3600000 * 5.5)
  return `${pad(ist.getHours())}:${pad(ist.getMinutes())} IST`
}

export function Header() {
  const {
    activeView,
    snapshot,
    minute,
    theme,
    toggleTheme,
    settings,
    updateSetting,
    user,
    signOut,
    setMobileMenuOpen,
    dataStreamMode,
    setDataStreamMode,
    liveWeather,
    refreshLiveWeather,
    rateLimitStatus,
  } = useApp()

  const cell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshSensors = async () => {
    setIsRefreshing(true)
    await refreshLiveWeather()
    setTimeout(() => setIsRefreshing(false), 800)
  }

  return (
    <header className="top-bar">
      {/* Left Context: Hamburger + View Breadcrumb + Region */}
      <div className="top-left-group">
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Open primary navigation"
        >
          <Menu size={20} />
        </button>

        <div className="top-context">
          <span className="live-pip" title="Active Convective State" />
          <span className="top-context-label">{viewTitles[activeView]?.toUpperCase()}</span>
          <span className="top-separator" />
          <span className="top-scenario-chip" title="Active Convective State Source">
            <Radio size={12} />
            <b>{snapshot.scenarioLabel}</b>
            {dataStreamMode === 'SYNTHETIC' && (
              <span className="scenario-clock-chip">T+{Math.round(minute)}m</span>
            )}
          </span>
          <span className="top-separator hidden-mobile" />
          <span className="top-region hidden-tablet">
            <MapPin size={12} />
            <span>COIMBATORE & TAMIL NADU RADAR SECTOR</span>
          </span>
        </div>
      </div>

      {/* Center Operational Mode Switcher: Synthetic Scenarios vs Real-Time Sensor Telemetry */}
      <div className="stream-mode-control" role="group" aria-label="Telemetry Stream Source">
        <button
          className={`stream-mode-pill ${dataStreamMode === 'SYNTHETIC' ? 'active-synthetic' : ''}`}
          onClick={() => setDataStreamMode('SYNTHETIC')}
          title="Simulation Mode: Pre-calibrated convective storm scenarios"
          type="button"
        >
          <SlidersHorizontal size={12} />
          <span>SIMULATION SCENARIOS</span>
        </button>
        <button
          className={`stream-mode-pill ${dataStreamMode === 'REAL_TIME' ? 'active-realtime' : ''}`}
          onClick={() => setDataStreamMode('REAL_TIME')}
          title="Live Telemetry Mode: Reflects actual real-world atmospheric observations"
          type="button"
        >
          <span className="live-pulse-dot" />
          <Activity size={12} />
          <span>LIVE TELEMETRY</span>
        </button>
      </div>

      {/* Right Controls: Clock + Consensus Health + Demo Indicator + Theme + User */}
      <div className="top-actions">
        {/* Active cell badge */}
        <div className="top-cell-badge hidden-mobile" title="Primary track cell">
          <Zap size={12} />
          <span>{cell.id}</span>
          <b className={`cell-severity-pill severity-${cell.lifecycle.toLowerCase()}`}>
            {cell.lifecycle}
          </b>
        </div>

        {/* Live OpenWeather Ambient Chip */}
        {liveWeather && (
          <div
            className="live-weather-header-chip hidden-mobile"
            title={`Live Weather: ${liveWeather.city} · ${liveWeather.temp}°C (${liveWeather.condition}, ${liveWeather.description}) · Humidity ${liveWeather.humidity}% · Wind ${liveWeather.windSpeedKmH} km/h from ${liveWeather.windDirection} · Telemetry source: ${liveWeather.source}`}
          >
            <Thermometer size={12} className="text-teal" />
            <span className="weather-temp"><b>{liveWeather.temp}°C</b></span>
            <span className="weather-city">{liveWeather.city}</span>
            <span className="weather-cond hidden-tablet">{liveWeather.condition}</span>
          </div>
        )}

        {/* Live Simulation Clock (IST) */}
        <div className="clock-readout" title="Simulation Frame Time (IST)">
          <Clock3 size={13} />
          <span>{formatIst(snapshot.timestamp)}</span>
        </div>

        {/* Manual Refresh & Rate Limit status when in Live Real-Time Mode */}
        {dataStreamMode === 'REAL_TIME' && (
          <button
            className={`top-icon-button refresh-telemetry-btn ${isRefreshing ? 'is-spinning' : ''}`}
            onClick={handleRefreshSensors}
            title={`Refresh live weather telemetry. Rate limit: ${rateLimitStatus.used}/${rateLimitStatus.max} calls used this minute (Resets in ${rateLimitStatus.resetSeconds}s)`}
            aria-label="Refresh live telemetry"
            type="button"
          >
            <RefreshCw size={13} />
          </button>
        )}

        {/* Multi-Source Consensus */}
        <div className="system-health hidden-mobile" title="Consensus across telemetry feeds">
          <span className="health-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            CONSENSUS <b>{snapshot.consensus}%</b>
          </span>
        </div>

        {/* Mode Disclosure Badge */}
        <div
          className={`demo-status-pill ${dataStreamMode === 'REAL_TIME' ? 'realtime-badge' : 'synthetic-badge'}`}
          title={
            dataStreamMode === 'REAL_TIME'
              ? `Live Telemetry active (${liveWeather?.city ?? 'Coimbatore'}).`
              : 'Deterministic convective simulation stream'
          }
        >
          <span className={`demo-pip ${dataStreamMode === 'REAL_TIME' ? 'green-pip' : ''}`} />
          <span>{dataStreamMode === 'REAL_TIME' ? 'LIVE TELEMETRY' : 'SIMULATION MODE'}</span>
        </div>

        {/* Theme Toggle */}
        <button
          className="top-icon-button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* User Account / Sign Out */}
        <div className="user-session-chip">
          <div className="user-avatar" title={user?.email ?? 'operator@tropotrace.app'}>
            <span>TT</span>
          </div>
          <button
            className="top-signout-btn"
            onClick={signOut}
            title="Sign out of operator session"
            aria-label="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  )
}
