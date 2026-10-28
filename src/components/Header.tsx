import {
  Clock3,
  Globe,
  Info,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Radio,
  Sun,
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
  } = useApp()

  const cell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]

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
          <span className="top-scenario-chip" title="Active Simulated Scenario">
            <Radio size={12} />
            <b>{snapshot.scenarioLabel}</b>
            <span className="scenario-clock-chip">T+{Math.round(minute)}m</span>
          </span>
          <span className="top-separator hidden-mobile" />
          <span className="top-region hidden-tablet">
            <MapPin size={12} />
            <span>COIMBATORE & TAMIL NADU RADAR SECTOR</span>
          </span>
        </div>
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

        {/* Live Simulation Clock (IST) */}
        <div className="clock-readout" title="Simulation Frame Time (IST)">
          <Clock3 size={13} />
          <span>{formatIst(snapshot.timestamp)}</span>
        </div>

        {/* Multi-Source Consensus */}
        <div className="system-health hidden-mobile" title="Consensus across 5 telemetry feeds">
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

        {/* Demo Mode disclosure badge */}
        <div
          className="demo-status-pill"
          title="Notice: Research prototype using synthetic sensor streams"
        >
          <span className="demo-pip" />
          <span>SIMULATED STREAM</span>
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

        {/* Demo Banner Visibility Toggle */}
        <button
          className={`top-icon-button hidden-mobile ${settings.showDemoBanner ? 'active' : ''}`}
          onClick={() => updateSetting('showDemoBanner', !settings.showDemoBanner)}
          aria-label="Toggle prototype disclosure banner"
          title="Toggle prototype disclosure banner"
        >
          <Info size={15} />
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
