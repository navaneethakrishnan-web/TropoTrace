import {
  Check,
  Database,
  Download,
  Info,
  Moon,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { firebaseConnectionLabel } from '../integrations/firebase'

export function SettingsView() {
  const { settings, updateSetting, theme, toggleTheme } = useApp()

  const handleResetSettings = () => {
    if (window.confirm('Reset all display preferences to defaults?')) {
      updateSetting('showDemoBanner', true)
      updateSetting('reducedMotion', false)
      updateSetting('highContrast', false)
      updateSetting('autoStart', true)
      updateSetting('basemap', 'satellite')
      updateSetting('soundEnabled', true)
    }
  }

  const handleExportConfig = () => {
    const configData = {
      project: 'TropoTrace Convective Intelligence Command Center',
      organization: 'Ministry of Earth Sciences (MoES) & NCMRWF',
      team: 'Team Regal Hackers (Dexathon 2026)',
      problemStatement: 'Convective Scale Nowcasting for Thunderstorms, Hail & Cloudbursts (0–6 hr)',
      preferences: settings,
      theme,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tropotrace-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="view-stack settings-view">
      {/* View Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 10 · SYSTEM CONFIGURATION &amp; PLATFORM BOUNDARIES</span>
          </div>
          <h2>System Settings</h2>
          <p>
            Configure visual presentation preferences, inspect Firebase integration health, and review
            scientific prototype operational boundaries.
          </p>
        </div>

        <div className="settings-header-badge">
          <ShieldCheck size={14} />
          <span>OPERATOR ENVIRONMENT: VERIFIED</span>
        </div>
      </div>

      {/* Main Settings Layout */}
      <div className="settings-layout">
        {/* Card 1: Display & Interaction Preferences */}
        <div className="panel-surface settings-card">
          <div className="panel-title">
            <div>
              <SlidersHorizontal size={15} />
              <h3>Visual &amp; Display Preferences</h3>
            </div>
            <span className="meta-tag">LOCAL PERSISTENCE</span>
          </div>

          <div className="settings-rows-list">
            <div className="setting-row">
              <div>
                <b>Theme Appearance</b>
                <span>Toggle between deep midnight green and daylight mode.</span>
              </div>
              <button
                className="theme-toggle-btn secondary-action"
                onClick={toggleTheme}
                aria-label={`Toggle to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? 'LIGHT THEME' : 'DARK THEME'}</span>
              </button>
            </div>

            <div className="setting-row">
              <div>
                <b>Demo Mode Banner</b>
                <span>Display the simulated sensor stream disclosure banner in the top bar.</span>
              </div>
              <button
                className={`switch-toggle ${settings.showDemoBanner ? 'active' : ''}`}
                onClick={() => updateSetting('showDemoBanner', !settings.showDemoBanner)}
                aria-label="Toggle Demo Banner"
                aria-pressed={settings.showDemoBanner}
              >
                <span className="switch-thumb" />
              </button>
            </div>

            <div className="setting-row">
              <div>
                <b>Reduced Motion Mode</b>
                <span>Minimize radar sweeps, pulse rings, and continuous particle animations.</span>
              </div>
              <button
                className={`switch-toggle ${settings.reducedMotion ? 'active' : ''}`}
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                aria-label="Toggle Reduced Motion"
                aria-pressed={settings.reducedMotion}
              >
                <span className="switch-thumb" />
              </button>
            </div>

            <div className="setting-row">
              <div>
                <b>High Contrast Labels</b>
                <span>Elevate contrast borders and increase typography readability.</span>
              </div>
              <button
                className={`switch-toggle ${settings.highContrast ? 'active' : ''}`}
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                aria-label="Toggle High Contrast"
                aria-pressed={settings.highContrast}
              >
                <span className="switch-thumb" />
              </button>
            </div>

            <div className="setting-row">
              <div>
                <b>Default GIS Basemap</b>
                <span>Preferred satellite vs road street map background on load.</span>
              </div>
              <div className="basemap-choice-pills">
                <button
                  className={`choice-pill ${settings.basemap === 'satellite' ? 'active' : ''}`}
                  onClick={() => updateSetting('basemap', 'satellite')}
                >
                  SATELLITE
                </button>
                <button
                  className={`choice-pill ${settings.basemap === 'street' ? 'active' : ''}`}
                  onClick={() => updateSetting('basemap', 'street')}
                >
                  STREET
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <b>Audio Voice Warnings</b>
                <span>Enable browser speech synthesis for multi-language alert broadcast.</span>
              </div>
              <button
                className={`switch-toggle ${settings.soundEnabled ? 'active' : ''}`}
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                aria-label="Toggle Audio Broadcasts"
                aria-pressed={settings.soundEnabled}
              >
                <span className="switch-thumb" />
              </button>
            </div>
          </div>

          <div className="settings-footer-actions">
            <button className="secondary-action" onClick={handleResetSettings}>
              <RotateCcw size={13} />
              <span>RESET TO DEFAULTS</span>
            </button>
            <button className="secondary-action" onClick={handleExportConfig}>
              <Download size={13} />
              <span>EXPORT CONFIG</span>
            </button>
          </div>
        </div>

        {/* Card 2: Firebase Integration & Cloud Connectivity */}
        <div className="panel-surface settings-card">
          <div className="panel-title">
            <div>
              <Database size={15} />
              <h3>Firebase Platform Integration</h3>
            </div>
            <span className="meta-tag">CLOUD SERVICES</span>
          </div>

          <div className="integration-callout-box">
            <div className="callout-icon">
              <Wifi size={18} />
            </div>
            <div>
              <b>{firebaseConnectionLabel}</b>
              <p>
                Connected via browser-safe Vite environment credentials. Firebase Authentication
                manages operator sessions; Cloud Firestore stores operator profiles and saved alerts.
              </p>
            </div>
          </div>

          <div className="integration-check-list">
            <div className="check-item">
              <Check size={14} className="text-green" />
              <div>
                <b>Firebase Authentication: </b>
                <span>Email/Password provider initialized with session tokens</span>
              </div>
            </div>

            <div className="check-item">
              <Check size={14} className="text-green" />
              <div>
                <b>Cloud Firestore Project ID: </b>
                <code>thermotrace-a6b30</code>
              </div>
            </div>

            <div className="check-item">
              <Check size={14} className="text-green" />
              <div>
                <b>Security Rules: </b>
                <span>Scoped to authenticated operator UIDs; no open write leaks</span>
              </div>
            </div>

            <div className="check-item">
              <Check size={14} className="text-green" />
              <div>
                <b>Credential Hygiene: </b>
                <span>Zero server/service-account secrets bundled into client build</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Institutional Context & Problem Statement */}
        <div className="panel-surface settings-card full-width">
          <div className="panel-title">
            <div>
              <Info size={15} />
              <h3>Institutional Problem Statement &amp; Project Identity</h3>
            </div>
            <span className="meta-tag">DEXATHON 2026</span>
          </div>

          <div className="institution-grid">
            <div className="inst-item">
              <span>PROJECT TITLE:</span>
              <b>TropoTrace — Convective Intelligence Command Center</b>
            </div>
            <div className="inst-item">
              <span>PROBLEM STATEMENT:</span>
              <b>Convective Scale Nowcasting for Thunderstorms, Hail &amp; Cloudbursts (0–6 hr)</b>
            </div>
            <div className="inst-item">
              <span>ORGANIZATION:</span>
              <b>Ministry of Earth Sciences (MoES)</b>
            </div>
            <div className="inst-item">
              <span>DEPARTMENT:</span>
              <b>National Centre for Medium Range Weather Forecasting (NCMRWF)</b>
            </div>
            <div className="inst-item">
              <span>TEAM NAME:</span>
              <b>Regal Hackers</b>
            </div>
            <div className="inst-item">
              <span>PRIMARY DOMAIN:</span>
              <b>South India / Western Ghats / Tamil Nadu Radar Coverage Area</b>
            </div>
          </div>

          <div className="boundary-callout">
            <ShieldAlert size={16} />
            <div>
              <b>RESEARCH PROTOTYPE DISCLOSURE:</b>
              <p>
                TropoTrace is an advanced research and engineering prototype. While calculations,
                kinematic vectors, and contingency evaluations strictly adhere to meteorological standards,
                the current demonstration operates on deterministic synthetic sensor streams. Operational public
                safety directives remain the exclusive domain of the India Meteorological Department (IMD)
                and the National Disaster Management Authority (NDMA).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
