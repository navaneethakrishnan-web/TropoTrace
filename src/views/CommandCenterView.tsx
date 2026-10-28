import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  CloudLightning,
  Database,
  Gauge,
  Grid3X3,
  Hospital,
  Info,
  Navigation,
  Pause,
  Play,
  Radio,
  RadioTower,
  Route,
  School,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { StormMap } from '../components/StormMap'
import { useApp, type Phenomenon } from '../context/AppContext'
import { formatEta } from '../domain/simulation'
import type { Mode, ScenarioKey, Severity, ViewId } from '../domain/types'

const formatNumber = (val: number) => new Intl.NumberFormat('en-IN').format(Math.round(val))

export function CommandCenterView() {
  const {
    snapshot,
    minute,
    setMinute,
    isStreaming,
    setIsStreaming,
    mode,
    setMode,
    phenomenon,
    setPhenomenon,
    investigateStorm,
    navigate,
    runScenario,
  } = useApp()

  const [storyStep, setStoryStep] = useState(-1)
  const [showChanges, setShowChanges] = useState(false)

  const storyFrames = [
    'Convective Initiation',
    'Updraft Intensification',
    'Lightning Flash Jump',
    'Hydrometeor Core Formation',
    'Hail / Downburst Signature',
    'High-Risk Corridor Intersection',
    'Impact Assessment & Warning',
    'Model Skill Verification',
    'Adaptive Nowcast Update',
  ]

  // Automated step progression when "Tell Me The Storm" is active
  useEffect(() => {
    if (storyStep < 0) return
    const timer = window.setInterval(() => {
      setStoryStep((current) => {
        if (current >= storyFrames.length - 1) return -1
        return current + 1
      })
    }, 1800)
    return () => window.clearInterval(timer)
  }, [storyStep, storyFrames.length])

  const primaryCell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]
  const severeCount = snapshot.cells.filter((c) => c.intensity > 62).length
  const primaryHazards = snapshot.hazards.filter((h) => h.key !== 'composite').slice(0, 3)

  const kpiItems = [
    {
      label: 'ACTIVE CELLS',
      value: snapshot.cells.length.toString().padStart(2, '0'),
      note: `${severeCount} designated severe`,
      icon: CloudLightning,
      tone: 'cyan',
    },
    {
      label: 'SEVERE RATING',
      value: snapshot.severity,
      note: primaryCell.lifecycle,
      icon: ShieldAlert,
      tone: 'amber',
    },
    {
      label: 'LIGHTNING RATE',
      value: `${primaryCell.lightningRate}`,
      suffix: 'fl/min',
      note: '+43% / 10m surge',
      icon: CloudLightning,
      tone: 'yellow',
    },
    {
      label: 'HIGH-RISK AREA',
      value: `${snapshot.highRiskAreaKm2}`,
      suffix: 'km²',
      note: '1–3 km spatial grid',
      icon: Grid3X3,
      tone: 'red',
    },
    {
      label: 'ESTIMATED ARRIVAL',
      value: formatEta(snapshot.nextArrivalMinutes),
      note: 'Coimbatore corridor',
      icon: Navigation,
      tone: 'blue',
    },
    {
      label: 'DATA CONFIDENCE',
      value: `${snapshot.confidence}`,
      suffix: '%',
      note: snapshot.confidence > 80 ? 'High agreement' : 'Reduced / NWP latency',
      icon: Gauge,
      tone: 'green',
    },
  ]

  const lensItems: { id: Phenomenon; label: string; className: string }[] = [
    { id: 'ALL', label: 'ALL PHENOMENA', className: 'all' },
    { id: 'LIGHTNING', label: 'LIGHTNING', className: 'lightning' },
    { id: 'HAIL', label: 'HAIL', className: 'hail' },
    { id: 'CLOUDBURST', label: 'CLOUDBURST', className: 'cloudburst' },
    { id: 'DOWNBURST', label: 'DOWNBURST', className: 'downburst' },
  ]

  return (
    <div className="view-stack command-center-view">
      {/* Page Heading & Operational Mode Selector */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>SITUATIONAL AWARENESS · OPERATIONAL CONVECTIVE NOWCASTING</span>
          </div>
          <h1>Live Convective Intelligence</h1>
          <p>
            Observe, detect, fuse, and evaluate multi-hazard thunderstorm evolution across the 0–6
            hour forecast horizon.
          </p>
        </div>

        <div className="heading-actions">
          {/* Mode Selector */}
          <div className="mode-select-wrap">
            <SlidersHorizontal size={14} />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              aria-label="Select operational mode"
            >
              <option value="EMERGENCY">Emergency Response Mode</option>
              <option value="AVIATION">Aviation Operations Mode</option>
              <option value="AGRICULTURE">Agricultural Crop Mode</option>
              <option value="URBAN">Urban Logistics Mode</option>
            </select>
            <ChevronDown size={13} />
          </div>

          {/* Stream Play/Pause Button */}
          <button
            className={`stream-button ${isStreaming ? 'streaming' : ''}`}
            onClick={() => setIsStreaming(!isStreaming)}
            aria-label={isStreaming ? 'Pause live simulation stream' : 'Resume live simulation stream'}
          >
            <span className="button-dot" />
            <span>{isStreaming ? 'LIVE STREAMING' : 'STREAM PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="kpi-strip panel-surface">
        {kpiItems.map((item) => (
          <div className="kpi-cell" key={item.label}>
            <div className={`kpi-icon ${item.tone}`}>
              <item.icon size={16} />
            </div>
            <div className="kpi-copy">
              <div className="kpi-label">{item.label}</div>
              <div className="kpi-value">
                {item.value}
                {item.suffix && <small>{item.suffix}</small>}
              </div>
              <div className="kpi-note">{item.note}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Command Layout: Dominant GIS Map + Intelligence Rail */}
      <div className="command-layout">
        <section className="map-panel panel-surface">
          {/* Map Header */}
          <div className="panel-header map-panel-header">
            <div>
              <div className="panel-kicker">
                <span className="status-dot green" />
                <span>SPATIAL SENSOR FUSION</span>
              </div>
              <h2>Convective Nowcast Field (0–6 hr)</h2>
            </div>
            <div className="map-header-tools">
              <span className="map-time">
                <Radio size={13} />
                <span>
                  FRAME {Math.round(minute).toString().padStart(3, '0')} · T+
                  {Math.round(minute).toString().padStart(2, '0')} MIN
                </span>
              </span>
            </div>
          </div>

          {/* Phenomenon Lens Filter Bar */}
          <div className="map-control-deck">
            <div className="phenomenon-lens">
              <div className="lens-heading">
                <span>
                  <span className="status-dot cyan" />
                  <span>ATMOSPHERIC LENS:</span>
                </span>
                <b>{phenomenon === 'ALL' ? 'COMPOSITE TWIN' : `${phenomenon} FOCUSED`}</b>
              </div>

              <div className="lens-pills">
                {lensItems.map((item) => (
                  <button
                    key={item.id}
                    className={`${item.className} ${phenomenon === item.id ? 'active' : ''}`}
                    onClick={() => setPhenomenon(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="lens-actions">
                <button
                  className="story-button"
                  onClick={() => setStoryStep(storyStep >= 0 ? -1 : 0)}
                  title="Play atmospheric narrative progression"
                >
                  <Sparkles size={12} />
                  <span>{storyStep >= 0 ? 'PAUSE STORY' : 'TELL ME THE STORM'}</span>
                </button>

                <button
                  className={`changes-button ${showChanges ? 'active' : ''}`}
                  onClick={() => setShowChanges(!showChanges)}
                  title="Toggle 15-minute temporal difference layer"
                >
                  <span>WHAT CHANGED?</span>
                </button>
              </div>

              {storyStep >= 0 && (
                <div className="story-progress">
                  <span>STORY STAGE {String(storyStep + 1).padStart(2, '0')} / 09</span>
                  <b>{storyFrames[storyStep]}</b>
                </div>
              )}
            </div>
          </div>

          {/* Real Leaflet GIS Map */}
          <StormMap height="540px" />

          {/* Synchronized 0–6 Hour Timeline Bar */}
          <div className="timeline-bar">
            <div className="timeline-head">
              <div className="timeline-label">
                <button
                  className="timeline-play"
                  onClick={() => setIsStreaming(!isStreaming)}
                  aria-label={isStreaming ? 'Pause simulation' : 'Play simulation'}
                >
                  {isStreaming ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <span>NOWCAST TIMELINE:</span>
                <b>T+{Math.round(minute).toString().padStart(2, '0')} MIN</b>
              </div>

              <div className="timeline-actions">
                <button onClick={() => setMinute(0)}>T+0 (NOW)</button>
                <button onClick={() => setMinute((m) => Math.min(360, m + 15))}>+15 MIN</button>
                <button onClick={() => setMinute((m) => Math.min(360, m + 30))}>+30 MIN</button>
                <button onClick={() => setMinute((m) => Math.min(360, m + 60))}>+1 HR</button>
                <span className="forecast-window">0–6 HR HORIZON</span>
              </div>
            </div>

            <div className="timeline-track">
              <div
                className="timeline-progress"
                style={{ width: `${(minute / 360) * 100}%` }}
              />
              <div className="timeline-markers">
                {['NOW', '+15m', '+30m', '+45m', '+1H', '+2H', '+3H', '+4H', '+5H', '+6H'].map(
                  (marker, idx) => (
                    <span key={marker} style={{ left: `${(idx / 9) * 100}%` }}>
                      {marker}
                    </span>
                  )
                )}
              </div>
              <input
                aria-label="Simulation forecast timeline scrubber"
                type="range"
                min="0"
                max="360"
                step="1"
                value={Math.round(minute)}
                onChange={(e) => {
                  setMinute(Number(e.target.value))
                  setIsStreaming(false)
                }}
              />
            </div>

            <div className="timeline-foot">
              <span>
                OBSERVED FRAME: <b>T-00m (START)</b>
              </span>
              <span className="timeline-now">
                CURRENT FRAME: <b>T+{Math.round(minute)}m</b>
              </span>
              <span>
                FORECAST HORIZON: <b>T+360m (6 HR)</b>
              </span>
            </div>
          </div>
        </section>

        {/* Intelligence Rail on Right */}
        <aside className="intelligence-rail">
          {/* Selected Cell Header */}
          <div className="rail-section rail-cell">
            <div className="rail-label-row">
              <span className="panel-kicker">
                <span className="status-dot green" />
                <span>SELECTED STORM CELL</span>
              </span>
              <button
                className="rail-more-btn text-link"
                onClick={() => investigateStorm(primaryCell.id)}
                title="Deep dive in Storm Intelligence"
              >
                <span>ANALYZE</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="cell-title-row">
              <div>
                <h2>{primaryCell.name}</h2>
                <div className="cell-id">
                  ID: {primaryCell.id} · {primaryCell.ageMinutes} MIN OLD
                </div>
              </div>
              <span className={`severity-chip severity-${snapshot.severity.toLowerCase()}`}>
                {snapshot.severity}
              </span>
            </div>

            <div className="cell-status">
              <span className="pulse-ring" />
              <b>{primaryCell.lifecycle}</b>
              <span className="divider-dot" />
              <span>Intensity: </span>
              <strong>{primaryCell.intensity}%</strong>
            </div>

            <div className="movement-row">
              <div className="movement-icon">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <span>MOVING {primaryCell.direction}</span>
                <b>{primaryCell.speed} km/h</b>
              </div>
              <div className="arrival-mini">
                <span>ESTIMATED ARRIVAL</span>
                <b>{formatEta(primaryCell.arrivalMinutes)}</b>
              </div>
            </div>
          </div>

          {/* Hazard Probability Bars */}
          <div className="rail-section">
            <div className="section-title-row">
              <span>HAZARD PROBABILITY (0–6 HR)</span>
              <span className="confidence-pill">{primaryCell.confidence}% CONFIDENCE</span>
            </div>
            <div className="hazard-bars">
              {primaryHazards.map((hazard) => (
                <div className="hazard-bar-row" key={hazard.key}>
                  <div className="hazard-bar-label">
                    <span>{hazard.label}</span>
                    <b>{hazard.probability}%</b>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${hazard.probability}%`, background: hazard.color }}
                    />
                  </div>
                  <div className="hazard-bar-meta">
                    <span>{hazard.value}</span>
                    <span className="trend-up">↗ {hazard.trend.toLowerCase()}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="rail-sublink"
              onClick={() => navigate('hazards')}
              title="Open Hazard Explorer"
            >
              <span>Explore all 6 hazard probability fields</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Why High Risk? Explainability Section */}
          <div className="rail-section why-section">
            <div className="section-title-row">
              <span>WHY THIS SEVERITY RATING?</span>
              <Info size={14} />
            </div>
            <div className="why-list">
              <div className="why-row">
                <span>Radar core reflectivity</span>
                <div className="why-line" />
                <b>{primaryCell.reflectivity} dBZ (severe)</b>
              </div>
              <div className="why-row">
                <span>Lightning acceleration</span>
                <div className="why-line" />
                <b>{primaryCell.lightningRate} fl/min (surge)</b>
              </div>
              <div className="why-row">
                <span>Satellite cloud cooling</span>
                <div className="why-line" />
                <b>-48°C (TIR-1)</b>
              </div>
              <div className="why-row">
                <span>Projected rain accumulation</span>
                <div className="why-line" />
                <b>{Math.round(primaryCell.rainfallRate)} mm/h</b>
              </div>
            </div>

            <div className="evidence-list">
              <div className="evidence-title">EVIDENCE VERIFICATION:</div>
              <span>
                <Check size={13} /> Reflectivity core &gt;55 dBZ confirmed by Doppler
              </span>
              <span>
                <Check size={13} /> Lightning jump verified by ground network
              </span>
              <span>
                <Check size={13} /> Vector projects trajectory across NH-81 corridor
              </span>
            </div>
          </div>

          {/* Projected Exposure Mini-Grid */}
          <div className="rail-section impact-mini">
            <div className="section-title-row">
              <span>PROJECTED ASSET EXPOSURE</span>
              <button
                className="text-link"
                onClick={() => navigate('impact')}
                title="Open full Impact Intelligence view"
              >
                VIEW IMPACT <ArrowRight size={12} />
              </button>
            </div>
            <div className="impact-mini-grid">
              <div className="mini-metric">
                <Building2 size={15} />
                <span>POPULATION</span>
                <b>{formatNumber(snapshot.impact.population)}</b>
              </div>
              <div className="mini-metric">
                <School size={15} />
                <span>SCHOOLS</span>
                <b>{snapshot.impact.schools}</b>
              </div>
              <div className="mini-metric">
                <Hospital size={15} />
                <span>HOSPITALS</span>
                <b>{snapshot.impact.hospitals}</b>
              </div>
              <div className="mini-metric">
                <Route size={15} />
                <span>MAJOR ROADS</span>
                <b>{snapshot.impact.roads}</b>
              </div>
            </div>
          </div>

          {/* Action Shortcut Buttons */}
          <div className="rail-actions-block">
            <button
              className="primary-action"
              onClick={() => navigate('alerts')}
              title="Open Alert Center to review generated warnings"
            >
              <Siren size={15} />
              <span>OPEN WARNING BRIEF</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>

      {/* Data Health Strip at Bottom */}
      <div className="data-health-strip panel-surface">
        <div className="health-overview">
          <div className="panel-kicker">
            <Database size={13} />
            <span>DATA OBSERVATORY CONSENSUS</span>
          </div>
          <b>Multi-Sensor Agreement</b>
          <div className="consensus-score">
            <strong>{snapshot.consensus}%</strong>
            <span>CONFIDENCE</span>
          </div>
        </div>

        <div className="source-row">
          {snapshot.sources.map((source) => (
            <div className="source-chip" key={source.shortName}>
              <span
                className={`status-dot ${
                  source.status === 'ONLINE'
                    ? 'green'
                    : source.status === 'DELAYED'
                    ? 'amber'
                    : 'red'
                }`}
              />
              <span className="source-short">{source.shortName}</span>
              <span className="source-status">{source.status}</span>
              <span className="source-latency">{source.latency}</span>
            </div>
          ))}
        </div>

        <button
          className="strip-link"
          onClick={() => navigate('observatory')}
          title="Open Data Observatory to inspect raw telemetry"
        >
          <span>OPEN DATA OBSERVATORY</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}
