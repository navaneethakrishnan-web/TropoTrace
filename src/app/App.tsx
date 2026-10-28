import {
  Activity,
  Bell,
  CloudLightning,
  Crosshair,
  Menu,
  X,
} from 'lucide-react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { AppProvider, useApp } from '../context/AppContext'
import { AlertCenterView } from '../views/AlertCenterView'
import { AnalystView } from '../views/AnalystView'
import { AuthView } from '../views/AuthView'
import { CommandCenterView } from '../views/CommandCenterView'
import { DataObservatoryView } from '../views/DataObservatoryView'
import { HazardExplorerView } from '../views/HazardExplorerView'
import { ImpactIntelligenceView } from '../views/ImpactIntelligenceView'
import { ModelVerificationView } from '../views/ModelVerificationView'
import { SettingsView } from '../views/SettingsView'
import { SimulationLabView } from '../views/SimulationLabView'
import { StormIntelligenceView } from '../views/StormIntelligenceView'

function AppShell() {
  const {
    activeView,
    navigate,
    settings,
    updateSetting,
    theme,
    user,
    authLoading,
    mobileMenuOpen,
    setMobileMenuOpen,
    reviewedAlertIds,
  } = useApp()

  const unreviewedCount = Math.max(0, 3 - reviewedAlertIds.size)

  // Authentication Loading State
  if (authLoading) {
    return (
      <div className={`auth-loading-screen theme-${theme}`}>
        <div className="auth-loading-spinner" />
        <div className="auth-loading-text">INITIALIZING TROPOTRACE WORKSPACE…</div>
      </div>
    )
  }

  // Not Authenticated -> Show Cinematic Auth Screen
  if (!user) {
    return <AuthView />
  }

  // Authenticated Application Shell
  return (
    <div
      className={`app-shell theme-${theme} ${
        settings.reducedMotion ? 'reduced-motion' : ''
      } ${settings.highContrast ? 'high-contrast' : ''}`}
    >
      {/* Left Navigation Sidebar (Desktop & Tablet Off-Canvas Drawer) */}
      <Sidebar />

      {/* Main Command Stage */}
      <main className="main-stage">
        {/* Top Application Bar */}
        <Header />

        {/* Dismissible Demo Disclosure Banner */}
        {settings.showDemoBanner && (
          <div className="demo-banner">
            <div className="banner-content">
              <span className="banner-label">DEMO MODE · SIMULATED STREAM</span>
              <span className="banner-copy">
                Deterministic sensor fusion &amp; research prototype · Not operational IMD warnings
              </span>
            </div>
            <button
              onClick={() => updateSetting('showDemoBanner', false)}
              aria-label="Dismiss prototype disclosure notice"
              className="banner-dismiss-btn"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* View Switcher Container */}
        <div className="stage-content">
          {activeView === 'command' && <CommandCenterView />}
          {activeView === 'storm' && <StormIntelligenceView />}
          {activeView === 'hazards' && <HazardExplorerView />}
          {activeView === 'impact' && <ImpactIntelligenceView />}
          {activeView === 'alerts' && <AlertCenterView />}
          {activeView === 'observatory' && <DataObservatoryView />}
          {activeView === 'simulation' && <SimulationLabView />}
          {activeView === 'verification' && <ModelVerificationView />}
          {activeView === 'analyst' && <AnalystView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Mobile-Native Bottom Navigation Bar (Screens <= 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Quick mobile navigation">
        <button
          className={`mob-nav-btn ${activeView === 'command' ? 'active' : ''}`}
          onClick={() => navigate('command')}
          aria-label="Command Center"
          type="button"
        >
          <Crosshair size={18} />
          <span>Radar</span>
        </button>
        <button
          className={`mob-nav-btn ${activeView === 'storm' ? 'active' : ''}`}
          onClick={() => navigate('storm')}
          aria-label="Storm Intelligence"
          type="button"
        >
          <Activity size={18} />
          <span>Storm 3D</span>
        </button>
        <button
          className={`mob-nav-btn ${activeView === 'hazards' ? 'active' : ''}`}
          onClick={() => navigate('hazards')}
          aria-label="Hazard Explorer"
          type="button"
        >
          <CloudLightning size={18} />
          <span>Hazards</span>
        </button>
        <button
          className={`mob-nav-btn ${activeView === 'alerts' ? 'active' : ''}`}
          onClick={() => navigate('alerts')}
          aria-label="Alert Center"
          type="button"
        >
          <div className="mob-icon-wrap">
            <Bell size={18} />
            {unreviewedCount > 0 && <span className="mob-nav-badge">{unreviewedCount}</span>}
          </div>
          <span>Alerts</span>
        </button>
        <button
          className={`mob-nav-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open full drawer menu"
          type="button"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
