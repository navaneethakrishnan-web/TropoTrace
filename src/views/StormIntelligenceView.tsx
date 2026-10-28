import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Compass,
  FastForward,
  Gauge,
  Info,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatEta } from '../domain/simulation'

export function StormIntelligenceView() {
  const {
    snapshot,
    selectedCellId,
    setSelectedCellId,
    navigate,
    minute,
    setMinute,
    isStreaming,
    setIsStreaming,
  } = useApp()

  const cell = snapshot.cells.find((c) => c.id === selectedCellId) ?? snapshot.cells[0]

  // Geographical coordinates
  const lat = (13.6 - cell.centroid.y * 0.045).toFixed(3)
  const lon = (74.8 + cell.centroid.x * 0.045).toFixed(3)

  // Track progress and core scaling for dimensional visualization
  const trackProgress = Math.min(100, Math.round((minute / 360) * 100))
  const coreScale = 0.9 + (cell.intensity / 100) * 0.35 + Math.sin(minute * 0.04) * 0.06

  // Storm DNA Radar Metrics
  const dnaMetrics = [
    { label: 'Reflectivity', value: Math.round(cell.reflectivity * 1.3), unit: 'dBZ', raw: cell.reflectivity },
    { label: 'Growth Rate', value: Math.round(cell.intensity * 0.95), unit: '%/10m', raw: cell.intensity },
    { label: 'Lightning', value: Math.min(100, Math.round(cell.lightningRate * 1.4)), unit: 'fl/min', raw: cell.lightningRate },
    { label: 'Moisture Flux', value: Math.round(58 + cell.intensity * 0.38), unit: 'g/kg', raw: 72 },
    { label: 'Wind Shear', value: cell.windProbability, unit: '% prob', raw: cell.windProbability },
    { label: 'Rain Intensity', value: Math.min(100, Math.round(cell.rainfallRate * 0.9)), unit: 'mm/h', raw: cell.rainfallRate },
    { label: 'Echo Tops', value: Math.round(65 + cell.intensity * 0.32), unit: 'km AGL', raw: 14.2 },
  ]

  // Compute SVG Radar Polygon Points
  const radarPoints = dnaMetrics.map((m, index) => {
    const angle = -Math.PI / 2 + (index * (Math.PI * 2)) / dnaMetrics.length
    const radius = (110 * Math.min(100, m.value)) / 100
    const x = 200 + Math.cos(angle) * radius
    const y = 170 + Math.sin(angle) * radius
    return `${x},${y}`
  }).join(' ')

  const outerRingPoints = Array.from({ length: dnaMetrics.length }, (_, index) => {
    const angle = -Math.PI / 2 + (index * (Math.PI * 2)) / dnaMetrics.length
    const x = 200 + Math.cos(angle) * 110
    const y = 170 + Math.sin(angle) * 110
    return `${x},${y}`
  }).join(' ')

  const lifecycleStages = ['INITIATING', 'DEVELOPING', 'INTENSIFYING', 'MATURE', 'DECAYING']
  const currentStageIndex = lifecycleStages.indexOf(cell.lifecycle)

  const [visualMode, setVisualMode] = useState<'radar' | 'volume'>('radar')

  return (
    <div className="view-stack storm-intelligence-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 02 · SPECIALIZED CELL TRACKING &amp; ATMOSPHERIC FINGERPRINT</span>
          </div>
          <h2>Storm Intelligence</h2>
          <p>
            Trace convective cell kinematics, 3D echo structure, lifecycle stage, and temporal
            intensification drivers.
          </p>
        </div>

        {/* Cell Selector if multi-cell */}
        <div className="heading-cell-selector">
          {snapshot.cells.map((c) => (
            <button
              key={c.id}
              className={`cell-select-pill ${c.id === cell.id ? 'active' : ''}`}
              onClick={() => setSelectedCellId(c.id)}
            >
              <Zap size={13} />
              <span>{c.name}</span>
              <b>{c.intensity}%</b>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Grid: Storm DNA + Lifecycle & Movement */}
      <div className="split-view">
        {/* Storm DNA Radar Polygon Panel */}
        <div className="panel-surface fingerprint-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                <Sparkles size={14} />
                <span>MULTI-DIMENSIONAL FINGERPRINT</span>
              </div>
              <h3>STORM DNA · {cell.id}</h3>
            </div>
            <div className="segmented-control" style={{ padding: '2px', height: '28px' }}>
              <button
                className={visualMode === 'radar' ? 'active' : ''}
                onClick={() => setVisualMode('radar')}
                style={{ padding: '0 8px', fontSize: '10px' }}
              >
                RADAR DNA
              </button>
              <button
                className={visualMode === 'volume' ? 'active' : ''}
                onClick={() => setVisualMode('volume')}
                style={{ padding: '0 8px', fontSize: '10px' }}
              >
                DIMENSIONAL EVOLUTION
              </button>
            </div>
          </div>

          {visualMode === 'radar' ? (
            <div className="fingerprint-wrap">
              <svg viewBox="0 0 400 340" className="fingerprint-svg" aria-label="Storm DNA radar chart">
                {/* Concentric Guide Circles */}
                {[35, 70, 110].map((r) => (
                  <circle
                    key={r}
                    cx="200"
                    cy="170"
                    r={r}
                    fill="none"
                    stroke="#244238"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Outer boundary polygon */}
                <polygon points={outerRingPoints} fill="none" stroke="#356354" strokeWidth="1.2" />

                {/* Data Area Fill */}
                <polygon
                  points={radarPoints}
                  fill="rgba(56, 228, 192, 0.22)"
                  stroke="#38E4C0"
                  strokeWidth="2.4"
                />

                {/* Data Point Dots */}
                {dnaMetrics.map((m, index) => {
                  const angle = -Math.PI / 2 + (index * (Math.PI * 2)) / dnaMetrics.length
                  const radius = (110 * Math.min(100, m.value)) / 100
                  const x = 200 + Math.cos(angle) * radius
                  const y = 170 + Math.sin(angle) * radius
                  return <circle key={index} cx={x} cy={y} r="4" fill="#56CFFF" stroke="#06100E" strokeWidth="1.5" />
                })}

                {/* Metric Labels */}
                {dnaMetrics.map((m, index) => {
                  const angle = -Math.PI / 2 + (index * (Math.PI * 2)) / dnaMetrics.length
                  const x = 200 + Math.cos(angle) * 138
                  const y = 174 + Math.sin(angle) * 138
                  return (
                    <text
                      key={m.label}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fill="#A5B8B0"
                      fontSize="9.5"
                      fontFamily="'DM Mono', monospace"
                    >
                      {m.label} ({m.value}%)
                    </text>
                  )
                })}
              </svg>

              <div className="fingerprint-caption">
                <span className="status-dot green" />
                <span>
                  Sensor consensus synthesized across Doppler S-Band, INSAT-3D, Lightning Network &amp; AWS.
                </span>
              </div>
            </div>
          ) : (
            <div className="dimensional-storm-evolution-container">
              {/* Interactive Timeline Scrub Strip */}
              <div className="evolution-timeline-deck">
                <div className="evolution-playback-controls">
                  <button
                    className={`evolution-play-btn ${isStreaming ? 'active' : ''}`}
                    onClick={() => setIsStreaming(!isStreaming)}
                    aria-label={isStreaming ? 'Pause simulation' : 'Play simulation'}
                  >
                    {isStreaming ? <Pause size={13} /> : <Play size={13} />}
                    <span>{isStreaming ? 'PAUSE' : 'PLAY'}</span>
                  </button>
                  <button
                    className="evolution-step-btn"
                    onClick={() => setMinute(0)}
                    title="Reset to T+0"
                  >
                    <RotateCcw size={11} />
                    <span>T+0</span>
                  </button>
                  <button
                    className="evolution-step-btn"
                    onClick={() => setMinute((m) => Math.max(0, m - 15))}
                    title="-15 minutes"
                  >
                    -15m
                  </button>
                  <button
                    className="evolution-step-btn"
                    onClick={() => setMinute((m) => Math.min(360, m + 15))}
                    title="+15 minutes"
                  >
                    +15m
                  </button>
                </div>

                <div className="evolution-slider-wrap">
                  <span className="evolution-time-badge">T+{Math.round(minute)}m</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    className="evolution-scrubber-slider"
                    aria-label="Storm evolution timeline scrubber"
                  />
                  <span className="evolution-window-tag">0–6 HR HORIZON</span>
                </div>
              </div>

              {/* 3D Atmospheric Volume Stage with Layered Strata */}
              <div className="storm-volume-stage dimensional-evolution-stage">
                {/* Altitude Cross-Section Indicators */}
                <div className="altitude-scale-ruler">
                  <div className="altitude-notch notch-top">
                    <b>14.2 km</b>
                    <span>Anvil Outflow / Cirrus Plume</span>
                  </div>
                  <div className="altitude-notch notch-mid">
                    <b>6.4 km</b>
                    <span>Freezing Level (-10°C) · Hail Core</span>
                  </div>
                  <div className="altitude-notch notch-base">
                    <b>1.2 km</b>
                    <span>Boundary Inflow · Surface Convergence</span>
                  </div>
                </div>

                {/* 3D Tilted Column */}
                <div className="dimensional-column-wrap" style={{ transform: `scale(${coreScale})` }}>
                  {/* Stratum 3: Anvil Outflow (Top) */}
                  <div className="atmospheric-stratum stratum-anvil">
                    <div className="anvil-billow billow-1" />
                    <div className="anvil-billow billow-2" />
                    <div className="anvil-billow billow-3" />
                    <div className="overshooting-dome" />
                  </div>

                  {/* Updraft Chimney Particles */}
                  <div className="updraft-chimney">
                    <span className="updraft-particle p-1" />
                    <span className="updraft-particle p-2" />
                    <span className="updraft-particle p-3" />
                    <span className="updraft-particle p-4" />
                    <span className="updraft-particle p-5" />
                  </div>

                  {/* Stratum 2: Freezing Level & Hail Growth Zone (Mid) */}
                  <div className="atmospheric-stratum stratum-core">
                    <div className="core-intensity-ring ring-outer" />
                    <div className="core-intensity-ring ring-mid" />
                    <div className="storm-core-orbit">
                      <div className="storm-core" />
                    </div>
                    <div className="hail-growth-burst">•••</div>
                  </div>

                  {/* Stratum 1: Boundary Inflow Grid & Progressive Storm Track (Base) */}
                  <div className="atmospheric-stratum stratum-base">
                    <div className="surface-inflow-grid" />
                    <div className="storm-shadow-3d" />
                    {/* SVG Progressive Storm Track */}
                    <svg className="progressive-track-svg" viewBox="0 0 200 120">
                      <line x1="20" y1="90" x2="80" y2="60" stroke="#56CFFF" strokeWidth="2.5" strokeDasharray="4 4" />
                      <line x1="80" y1="60" x2={80 + trackProgress * 0.9} y2={60 - trackProgress * 0.4} stroke="#FFC857" strokeWidth="3" />
                      <circle cx="20" cy="90" r="3.5" fill="#56CFFF" />
                      <circle cx="80" cy="60" r="5" fill="#38E4C0" stroke="#FFFFFF" strokeWidth="1.5" className="track-centroid-blip" />
                    </svg>
                  </div>
                </div>

                {/* Caption & Scientific Label */}
                <div className="volume-stage-caption">
                  <div className="volume-caption-row">
                    <span>DIMENSIONAL CONVECTIVE COLUMN · {cell.reflectivity} dBZ</span>
                    <span className="prototype-badge">SYNTHETIC SCENARIO VOLUMETRIC MODEL</span>
                  </div>
                  <small>
                    Simulated 0–6 hr vertical hydrometeor transport · Freezing layer hail generation at {cell.intensity}% intensity
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cell Lifecycle & Spatial Kinematics */}
        <div className="panel-surface storm-kinematics-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                <Activity size={14} />
                <span>LIFECYCLE EVOLUTION</span>
              </div>
              <h3>Kinematics &amp; Progression</h3>
            </div>
            <span className="confidence-pill">{cell.confidence}% CONFIDENCE</span>
          </div>

          {/* Lifecycle Stages */}
          <div className="lifecycle-timeline">
            {lifecycleStages.map((stage, idx) => {
              const isPast = idx < currentStageIndex
              const isCurrent = idx === currentStageIndex
              return (
                <div
                  key={stage}
                  className={`lifecycle-step ${isPast ? 'complete' : ''} ${
                    isCurrent ? 'current' : ''
                  }`}
                >
                  <div className="lifecycle-node">
                    {isPast ? <Check size={12} /> : idx + 1}
                  </div>
                  <span>{stage}</span>
                </div>
              )
            })}
          </div>

          {/* Kinematic Coordinates & Vector */}
          <div className="movement-detail">
            <div>
              <span>CURRENT CENTROID</span>
              <b>
                {lat}°N / {lon}°E
                <small>Coimbatore Radar Domain</small>
              </b>
            </div>
            <div>
              <span>STORM PROPAGATION VECTOR</span>
              <b>
                {cell.direction} ({cell.directionDegrees}°) · {cell.speed} km/h
              </b>
            </div>
            <div>
              <span>ESTIMATED DISSIPATION</span>
              <b>{Math.max(25, Math.round(110 - cell.intensity * 0.35))} min</b>
            </div>
          </div>

          {/* Supporting Evidence Chips */}
          <div className="kinematics-evidence-box">
            <div className="evidence-title">PHYSICAL MECHANISMS &amp; DRIVERS:</div>
            <div className="evidence-chips-grid">
              <div className="evidence-chip">
                <Check size={12} />
                <span>Reflectivity Core &gt;55 dBZ aloft</span>
              </div>
              <div className="evidence-chip">
                <Check size={12} />
                <span>Steep mid-level lapse rates (7.4°C/km)</span>
              </div>
              <div className="evidence-chip">
                <Check size={12} />
                <span>Deep layer bulk shear 18 m/s (0–6 km)</span>
              </div>
              <div className="evidence-chip">
                <Check size={12} />
                <span>Strong convective updraft (VIL: 34 kg/m²)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Grid: Temporal Differences + Historical Analogues */}
      <div className="lower-grid">
        {/* Temporal Differences (What changed in 10-15m?) */}
        <div className="panel-surface change-diff-panel">
          <div className="panel-title">
            <div>
              <Clock3 size={15} />
              <h3>What changed in the last 15 minutes?</h3>
            </div>
            <span className="diff-meta">STREAM DELTA (ΔT=15m)</span>
          </div>

          <div className="change-list">
            {snapshot.changes.map((c) => (
              <div className="change-row" key={c.label}>
                <span className="change-label">{c.label} Indicator</span>
                <b className="change-val">{c.value}</b>
                <span className={`change-trend ${c.trend}`}>
                  {c.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </span>
              </div>
            ))}
          </div>

          <div className="change-summary-banner">
            <span className="status-dot amber" />
            <span>
              Storm cell is undergoing rapid convective intensification due to moisture flux convergence.
            </span>
          </div>
        </div>

        {/* Similar Historical Event Analogues */}
        <div className="panel-surface analogues-panel">
          <div className="panel-title">
            <div>
              <Search size={15} />
              <h3>Historical Analogue Comparison</h3>
            </div>
            <span className="diff-meta">DEMONSTRATION CATALOG</span>
          </div>

          <div className="similar-list">
            <div className="similar-row current">
              <span className="similar-badge">CURRENT</span>
              <div>
                <b>{snapshot.scenarioLabel} (Active Event)</b>
                <small>T+{Math.round(snapshot.minute)}m nowcast snapshot</small>
              </div>
              <strong className="match-score">100%</strong>
            </div>

            {[
              ['Severe Hailstorm / Salem Convective Surge 2024', '86% MATCH', 'Similar CAPE & VIL profile'],
              ['Cloudburst & Flash Flood / Erode Basin 2022', '78% MATCH', 'Comparable rainfall rate curve'],
              ['Multi-cell Downburst / Coimbatore Airport 2023', '71% MATCH', 'Identical wind shear boundary'],
            ].map(([title, match, desc]) => (
              <div className="similar-row" key={title}>
                <span className="similar-dot" />
                <div>
                  <b>{title}</b>
                  <small>{desc}</small>
                </div>
                <strong className="match-score">{match}</strong>
              </div>
            ))}
          </div>

          <div className="analogues-disclaimer">
            <Info size={12} />
            <span>
              Historical storm records are calibrated from synthetic reference cases for prototype validation.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
