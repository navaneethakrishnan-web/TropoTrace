import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCode,
  Filter,
  Info,
  Printer,
  Radio,
  ShieldAlert,
  Siren,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  ALERT_TRANSLATIONS,
  generateAlerts,
  generateCapXml,
  SUPPORTED_LANGUAGES,
} from '../domain/alerts'
import { formatEta } from '../domain/simulation'
import type { AlertItem, Severity } from '../domain/types'

export function AlertCenterView() {
  const { snapshot, reviewedAlertIds, toggleAcknowledgeAlert } = useApp()

  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL')
  const [copiedAlert, setCopiedAlert] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showCapModal, setShowCapModal] = useState(false)

  // Generate dynamic alerts based on active snapshot
  const alertsList = useMemo(() => generateAlerts(snapshot), [snapshot])
  const [selectedAlertId, setSelectedAlertId] = useState<string>(() => alertsList[0]?.id ?? '')

  const selectedAlert =
    alertsList.find((a) => a.id === selectedAlertId) ?? alertsList[0]

  const cell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]
  const arrival = Math.max(12, Math.round(cell.arrivalMinutes))
  const speed = Math.round(cell.speed)
  const dir = cell.direction

  // Translated alert message
  const alertText = useMemo(() => {
    const fn = ALERT_TRANSLATIONS[selectedLanguage] ?? ALERT_TRANSLATIONS['English']
    return fn(selectedAlert.area, arrival, speed, dir)
  }, [selectedLanguage, selectedAlert.area, arrival, speed, dir])

  // Copy to clipboard
  const handleCopyAlert = async () => {
    try {
      await navigator.clipboard.writeText(alertText)
      setCopiedAlert(true)
      window.setTimeout(() => setCopiedAlert(false), 2000)
    } catch (_) { /* fallback */ }
  }

  // Audio Speech Synthesis
  const handleAudioToggle = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
    } else {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(alertText)
      utterance.rate = 0.95
      utterance.onend = () => setIsPlayingAudio(false)
      utterance.onerror = () => setIsPlayingAudio(false)
      window.speechSynthesis.speak(utterance)
      setIsPlayingAudio(true)
    }
  }

  // Filter alerts
  const filteredAlerts = alertsList.filter((a) => {
    if (selectedSeverityFilter === 'ALL') return true
    if (selectedSeverityFilter === 'UNREVIEWED') return !reviewedAlertIds.has(a.id)
    return a.severity === selectedSeverityFilter
  })

  const isReviewed = reviewedAlertIds.has(selectedAlert.id)

  const severityLadder: Severity[] = ['NORMAL', 'WATCH', 'ALERT', 'WARNING', 'SEVERE']

  return (
    <div className="view-stack alert-center-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 05 · EVIDENCE-LED EMERGENCY DISPATCH &amp; COMMON ALERTING PROTOCOL</span>
          </div>
          <h2>Alert Center</h2>
          <p>
            Generate explainable, multi-language CAP-compliant meteorological warning bulletins for civil
            defense, transit operators, and the public.
          </p>
        </div>

        <div className="header-status-badge">
          <span className={`severity-chip severity-${snapshot.severity.toLowerCase()}`}>
            ACTIVE STATUS: {snapshot.severity}
          </span>
        </div>
      </div>

      {/* Main Alert Layout */}
      <div className="alert-layout">
        {/* Left Column: Warning Composer & Alert Details */}
        <div className="alert-composer-pane">
          {/* Alert Selection & Filters Bar */}
          <div className="panel-surface alert-filter-bar">
            <div className="filter-label">
              <Filter size={13} />
              <span>FILTER ALERTS:</span>
            </div>
            <div className="filter-chips">
              {['ALL', 'UNREVIEWED', 'SEVERE', 'WARNING', 'ALERT'].map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${selectedSeverityFilter === f ? 'active' : ''}`}
                  onClick={() => setSelectedSeverityFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Cards Feed */}
          <div className="alerts-feed-strip">
            {filteredAlerts.map((alt) => {
              const reviewed = reviewedAlertIds.has(alt.id)
              const isSelected = alt.id === selectedAlert.id

              return (
                <div
                  key={alt.id}
                  className={`panel-surface alert-feed-card ${isSelected ? 'is-selected' : ''} ${
                    reviewed ? 'is-reviewed' : ''
                  }`}
                  onClick={() => setSelectedAlertId(alt.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="alert-feed-top">
                    <span className={`severity-chip severity-${alt.severity.toLowerCase()}`}>
                      {alt.severity}
                    </span>
                    <span className="alert-feed-id">{alt.id}</span>
                    <button
                      className={`alert-ack-btn ${reviewed ? 'reviewed' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleAcknowledgeAlert(alt.id)
                      }}
                      title={reviewed ? 'Mark as active' : 'Acknowledge alert as reviewed'}
                    >
                      {reviewed ? <CheckCircle2 size={14} /> : <Check size={14} />}
                      <span>{reviewed ? 'REVIEWED' : 'ACKNOWLEDGE'}</span>
                    </button>
                  </div>

                  <h4 className="alert-feed-title">{alt.title}</h4>
                  <div className="alert-feed-area">
                    <span>AREA: </span>
                    <b>{alt.area}</b>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active Alert Composer Card */}
          <div className="panel-surface alert-builder">
            <div className="alert-builder-header">
              <div>
                <div className="panel-kicker">
                  <Siren size={14} />
                  <span>COMMON ALERTING PROTOCOL (CAP v1.2) FORMATTER</span>
                </div>
                <h3>{selectedAlert.title}</h3>
              </div>
              <span className="demo-label">PROTOTYPE DISPATCH</span>
            </div>

            {/* Target Area & Parameters */}
            <div className="alert-form-grid">
              <div className="form-field">
                <label>TARGET SECTOR / ZONE</label>
                <b>{selectedAlert.area}</b>
              </div>
              <div className="form-field">
                <label>ESTIMATED TIME TO IMPACT</label>
                <b>{arrival} minutes ({formatEta(cell.arrivalMinutes)})</b>
              </div>
              <div className="form-field">
                <label>KEY HAZARD VECTOR</label>
                <b>{selectedAlert.hazard.toUpperCase()} · {speed} km/h {dir}</b>
              </div>
              <div className="form-field">
                <label>EVIDENCE CONFIDENCE</label>
                <b>{selectedAlert.confidence}% consensus agreement</b>
              </div>
            </div>

            {/* Language Selector Pills */}
            <div className="alert-language-row">
              <span className="lang-prompt">DISPATCH LANGUAGE (8 SCHEDULED INDIAN LANGUAGES):</span>
              <div className="language-pills">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.key}
                    className={`lang-btn ${selectedLanguage === lang.key ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage(lang.key)}
                  >
                    <span>{lang.code}</span>
                    <small>{lang.label}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Rendered Warning Bulletin */}
            <div className="alert-preview-box">
              <div className="alert-preview-top">
                <span className={`severity-chip severity-${selectedAlert.severity.toLowerCase()}`}>
                  <Siren size={12} />
                  <span>{selectedAlert.severity} CONVECTIVE WARNING</span>
                </span>
                <span className="preview-meta">
                  {selectedLanguage.toUpperCase()} · GENERATED FOR TAMIL NADU CIVIL DEFENSE
                </span>
              </div>

              <p className="alert-preview-text">{alertText}</p>

              <div className="recommended-action-box">
                <strong>OFFICIAL ACTION GUIDANCE:</strong>
                <span>{selectedAlert.recommendedAction}</span>
              </div>
            </div>

            {/* Action Buttons: Read Audio, Copy, Print, CAP Preview */}
            <div className="alert-actions-bar">
              <button
                className={`primary-action ${isPlayingAudio ? 'is-playing' : ''}`}
                onClick={handleAudioToggle}
                title="Synthesize audio voice warning"
              >
                {isPlayingAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isPlayingAudio ? 'STOP BROADCAST' : 'READ ALERT AUDIO'}</span>
              </button>

              <button
                className="secondary-action"
                onClick={handleCopyAlert}
                title="Copy warning text to clipboard"
              >
                {copiedAlert ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedAlert ? 'COPIED TO CLIPBOARD' : 'COPY BULLETIN'}</span>
              </button>

              <button
                className="secondary-action"
                onClick={() => window.print()}
                title="Print clean official meteorological bulletin"
              >
                <Printer size={14} />
                <span>PRINT BULLETIN</span>
              </button>

              <button
                className="secondary-action"
                onClick={() => setShowCapModal(true)}
                title="View CAP XML standard payload"
              >
                <FileCode size={14} />
                <span>CAP XML / JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Severity Ladder & Evidence Bundle */}
        <aside className="alert-side-pane">
          {/* Severity Ladder */}
          <div className="panel-surface alert-side-card">
            <div className="panel-title">
              <div>
                <ShieldAlert size={15} />
                <h3>Evidence-Backed Severity Ladder</h3>
              </div>
              <span className="meta-tag">STANDARDS</span>
            </div>

            <div className="severity-ladder">
              {severityLadder.map((sev) => {
                const isActive = sev === snapshot.severity
                const desc =
                  sev === 'NORMAL'
                    ? 'Baseline atmospheric conditions'
                    : sev === 'WATCH'
                    ? 'Convective initiation possible'
                    : sev === 'ALERT'
                    ? 'Rapid storm growth observed'
                    : sev === 'WARNING'
                    ? 'Severe precipitation & winds'
                    : 'Immediate danger to life & property'

                return (
                  <div key={sev} className={`ladder-step ${isActive ? 'active' : ''}`}>
                    <span className={`ladder-dot severity-${sev.toLowerCase()}`} />
                    <b className="ladder-name">{sev}</b>
                    <small className="ladder-desc">{desc}</small>
                    {isActive && <Check size={13} className="ladder-check" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Evidence Bundle */}
          <div className="panel-surface alert-side-card">
            <div className="panel-title">
              <div>
                <Radio size={15} />
                <h3>Observation Evidence Bundle</h3>
              </div>
              <span className="meta-tag">REAL TIME</span>
            </div>

            <div className="evidence-bundle-list">
              <div className="evidence-bundle-item">
                <Check size={13} />
                <span>Doppler Reflectivity: <b>{cell.reflectivity} dBZ (severe core)</b></span>
              </div>
              <div className="evidence-bundle-item">
                <Check size={13} />
                <span>Lightning Rate: <b>{cell.lightningRate} fl/min (rapid jump)</b></span>
              </div>
              <div className="evidence-bundle-item">
                <Check size={13} />
                <span>Storm Propagation: <b>{cell.speed} km/h toward {cell.direction}</b></span>
              </div>
              <div className="evidence-bundle-item">
                <Check size={13} />
                <span>Multi-Source Consensus: <b>{snapshot.consensus}% agreement</b></span>
              </div>
              <div className="evidence-bundle-item">
                <Check size={13} />
                <span>Estimated Arrival: <b>{formatEta(cell.arrivalMinutes)}</b></span>
              </div>
            </div>

            <div className="disclaimer-callout">
              <Info size={13} />
              <span>
                Demonstration warnings are synthesized for hackathon evaluation and must not be used
                as official public safety directives.
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* CAP XML / JSON Modal */}
      {showCapModal && (
        <div className="cap-modal-backdrop" onClick={() => setShowCapModal(false)}>
          <div className="cap-modal panel-surface" onClick={(e) => e.stopPropagation()}>
            <div className="cap-modal-header">
              <div className="panel-kicker">
                <FileCode size={14} />
                <span>OASIS CAP v1.2 PAYLOAD PREVIEW</span>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setShowCapModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <h3>Common Alerting Protocol (CAP) Standard Export</h3>
            <p className="cap-modal-desc">
              Standardized XML payload for ingestion by emergency management gateways (NDMA / SDMA).
            </p>

            <pre className="cap-code-block">{generateCapXml(selectedAlert)}</pre>

            <div className="cap-modal-actions">
              <button
                className="secondary-action"
                onClick={() => {
                  navigator.clipboard.writeText(generateCapXml(selectedAlert))
                  window.alert('CAP XML payload copied to clipboard!')
                }}
              >
                <Copy size={14} />
                <span>COPY XML</span>
              </button>

              <button
                className="secondary-action"
                onClick={() => {
                  const blob = new Blob([generateCapXml(selectedAlert)], { type: 'application/xml' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${selectedAlert.id}.cap.xml`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download size={14} />
                <span>DOWNLOAD .XML</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
