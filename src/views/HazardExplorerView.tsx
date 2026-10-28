import { useState } from 'react'
import {
  CloudLightning,
  CloudRain,
  Flame,
  Grid3X3,
  HelpCircle,
  Info,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Waves,
  Wind,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { HazardKey } from '../domain/types'

interface InspectCell {
  x: number
  y: number
  probability: number
  trigger: string
}

export function HazardExplorerView() {
  const { snapshot, selectedHazard, setSelectedHazard, minute } = useApp()
  const [gridResolution, setGridResolution] = useState<'1 km' | '2 km' | '3 km'>('1 km')
  const [inspectedCell, setInspectedCell] = useState<InspectCell | null>(null)

  const cell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]

  const hazardMeta: Record<
    HazardKey,
    { label: string; icon: typeof Zap; color: string; desc: string; triggerCriteria: string }
  > = {
    composite: {
      label: 'Composite Risk Field',
      icon: ShieldAlert,
      color: '#38E4C0',
      desc: 'Multi-sensor fused convective threat index combining radar reflectivity, lightning acceleration, and surface convergence.',
      triggerCriteria: 'Z > 50 dBZ + Flash Rate > 35 fl/min + Surface ΔP < -1.5 hPa',
    },
    lightning: {
      label: 'Lightning Flash Density',
      icon: Zap,
      color: '#FFC857',
      desc: 'Ground and inter-cloud flash discharge rate predicting intense electrical strike hazard.',
      triggerCriteria: 'Flash rate > 40 fl/min within 15 km of populated centers',
    },
    hail: {
      label: 'Hail Probability & Core',
      icon: Sparkles,
      color: '#A78BFA',
      desc: 'Severe hail growth probability derived from radar reflectivity aloft (>55 dBZ above 0°C freezing level) and high VIL.',
      triggerCriteria: 'Reflectivity > 55 dBZ aloft + VIL > 45 kg/m² + Echo Top > 13 km',
    },
    wind: {
      label: 'Downburst & Straight-Line Wind',
      icon: Wind,
      color: '#FF8343',
      desc: 'Cold downdraft outflow boundary velocity threatening power lines, roofs, and aviation.',
      triggerCriteria: 'Mid-level dry air entrainment + Delta-V radial shear > 25 m/s',
    },
    rainfall: {
      label: 'Extreme Precipitation Rate',
      icon: CloudRain,
      color: '#56CFFF',
      desc: 'High-volume convective precipitation accumulation capable of overwhelming local storm drainage.',
      triggerCriteria: 'Rainfall rate > 45 mm/h + High moisture convergence',
    },
    cloudburst: {
      label: 'Cloudburst Inundation Risk',
      icon: Waves,
      color: '#FF4438',
      desc: 'Hyper-concentrated torrential rain exceeding 100 mm/h over a small catchment.',
      triggerCriteria: 'Rainfall rate > 80 mm/h + Stationary or slow-moving convective cluster',
    },
  }

  // Grid sizing based on selected resolution
  const cols = gridResolution === '1 km' ? 14 : gridResolution === '2 km' ? 10 : 7
  const rows = gridResolution === '1 km' ? 9 : gridResolution === '2 km' ? 7 : 5

  const activeHazardObj =
    snapshot.hazards.find((h) => h.key === selectedHazard) ?? snapshot.hazards[0]

  // Time-dependent centroid shift simulating convective storm translation
  const timeProgress = (minute / 360) * 0.25
  const centerX = (cols - 1) * (0.42 + timeProgress)
  const centerY = (rows - 1) * (0.5 + Math.sin(minute * 0.05) * 0.06)

  return (
    <div className="view-stack hazard-explorer-view">
      {/* View Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 03 · PROBABILISTIC 0–6 HOUR RISK FIELDS</span>
          </div>
          <h2>Hazard Explorer</h2>
          <p>
            Explore high-resolution spatial hazard distributions derived from multi-sensor
            convective state consensus.
          </p>
        </div>

        {/* Resolution Selector */}
        <div className="segmented-control" role="group" aria-label="Grid resolution">
          {(['1 km', '2 km', '3 km'] as const).map((res) => (
            <button
              key={res}
              className={gridResolution === res ? 'active' : ''}
              onClick={() => setGridResolution(res)}
            >
              {res} GRID
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Central Hazard Matrix + Hazard Detail Side Panel */}
      <div className="hazard-layout">
        {/* Central Matrix Card */}
        <div className="panel-surface hazard-map-card">
          <div className="hazard-map-top">
            <div>
              <div className="panel-kicker">
                <Grid3X3 size={14} />
                <span>
                  {gridResolution} CONVECTIVE NOWCAST MATRIX · {hazardMeta[selectedHazard].label.toUpperCase()}
                </span>
              </div>
              <h3>Spatial Hazard Risk Distribution</h3>
            </div>
            <span className="demo-label">PROBABILISTIC FIELD</span>
          </div>

          {/* Interactive Cell Matrix with Dynamic Morphing Palettes */}
          <div
            className={`hazard-matrix morphing-${selectedHazard}`}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            onMouseLeave={() => setInspectedCell(null)}
          >
            {Array.from({ length: cols * rows }, (_, i) => {
              const cx = i % cols
              const cy = Math.floor(i / cols)
              const dist = Math.hypot(cx - centerX, cy - centerY)
              const maxDist = Math.max(cols, rows) * 0.65

              // Base risk based on distance to storm core + active hazard factor
              const baseFactor = activeHazardObj.probability / 100
              const normalizedDist = Math.max(0, 1 - dist / maxDist)
              const riskVal = Math.max(0.04, Math.min(0.98, normalizedDist * (0.35 + baseFactor * 0.65)))
              const riskPercent = Math.round(riskVal * 100)

              // Hazard-specific morphing color palettes
              let colorBg = ''
              if (selectedHazard === 'hail') {
                // Purple / Lilac hail palette
                colorBg = riskVal > 0.75
                  ? `rgba(167, 139, 250, ${0.4 + riskVal * 0.55})`
                  : riskVal > 0.45
                  ? `rgba(196, 181, 253, ${0.25 + riskVal * 0.45})`
                  : `rgba(139, 92, 246, ${0.1 + riskVal * 0.3})`
              } else if (selectedHazard === 'lightning') {
                // Amber / Gold electrical palette
                colorBg = riskVal > 0.75
                  ? `rgba(255, 200, 87, ${0.45 + riskVal * 0.52})`
                  : riskVal > 0.45
                  ? `rgba(250, 204, 21, ${0.28 + riskVal * 0.45})`
                  : `rgba(217, 119, 6, ${0.12 + riskVal * 0.3})`
              } else if (selectedHazard === 'wind') {
                // Fiery orange / wind shear palette
                colorBg = riskVal > 0.75
                  ? `rgba(255, 131, 67, ${0.45 + riskVal * 0.52})`
                  : riskVal > 0.45
                  ? `rgba(249, 115, 22, ${0.28 + riskVal * 0.45})`
                  : `rgba(194, 65, 12, ${0.12 + riskVal * 0.3})`
              } else if (selectedHazard === 'cloudburst') {
                // Crimson / torrential flood surge palette
                colorBg = riskVal > 0.75
                  ? `rgba(255, 68, 56, ${0.48 + riskVal * 0.5})`
                  : riskVal > 0.45
                  ? `rgba(239, 68, 68, ${0.3 + riskVal * 0.45})`
                  : `rgba(185, 28, 28, ${0.12 + riskVal * 0.3})`
              } else if (selectedHazard === 'rainfall') {
                // Oceanic cyan / precipitation wave palette
                colorBg = riskVal > 0.75
                  ? `rgba(86, 207, 255, ${0.45 + riskVal * 0.52})`
                  : riskVal > 0.45
                  ? `rgba(56, 189, 248, ${0.28 + riskVal * 0.45})`
                  : `rgba(2, 132, 199, ${0.12 + riskVal * 0.3})`
              } else {
                // Composite multi-sensor threat palette
                colorBg = riskVal > 0.8
                  ? `rgba(255, 68, 56, ${0.38 + riskVal * 0.52})`
                  : riskVal > 0.55
                  ? `rgba(255, 200, 87, ${0.3 + riskVal * 0.48})`
                  : `rgba(56, 228, 192, ${0.12 + riskVal * 0.35})`
              }

              const isCoreCell = riskPercent > 78

              return (
                <button
                  key={i}
                  className={`hazard-cell ${isCoreCell ? 'is-core-cell' : ''}`}
                  style={{ background: colorBg }}
                  onMouseEnter={() =>
                    setInspectedCell({
                      x: cx,
                      y: cy,
                      probability: riskPercent,
                      trigger:
                        riskPercent > 75
                          ? `${hazardMeta[selectedHazard].label} > Severe threshold`
                          : riskPercent > 50
                          ? 'Elevated convective gradient'
                          : 'Peripheral atmospheric convergence',
                    })
                  }
                  onClick={() =>
                    setInspectedCell({
                      x: cx,
                      y: cy,
                      probability: riskPercent,
                      trigger:
                        riskPercent > 75
                          ? `${hazardMeta[selectedHazard].label} > Severe threshold`
                          : riskPercent > 50
                          ? 'Elevated convective gradient'
                          : 'Peripheral atmospheric convergence',
                    })
                  }
                  aria-label={`Grid cell (${cx}, ${cy}) ${riskPercent}% risk`}
                >
                  <span />
                </button>
              )
            })}

            {/* Storm Core Origin Pin with Live Coordinates */}
            <div
              className="hazard-origin"
              title="Storm Centroid Core"
              style={{
                left: `${((centerX + 0.5) / cols) * 100}%`,
                top: `${((centerY + 0.5) / rows) * 100}%`,
              }}
            >
              <span className="pulse-ring" />
              <b>{cell.id} CORE (T+{Math.round(minute)}m)</b>
            </div>
          </div>

          {/* Inspection Tooltip or Legend Bar */}
          <div className="hazard-map-footer">
            <div className="gradient-legend">
              <span className="legend-label">LOW (0%)</span>
              <span className="gradient-bar" />
              <span className="legend-label">ELEVATED (50%)</span>
              <span className="legend-label">CRITICAL (100%)</span>
            </div>

            <div className="inspection-readout">
              {inspectedCell ? (
                <span>
                  GRID CELL [X:{inspectedCell.x}, Y:{inspectedCell.y}] ·{' '}
                  <b>{inspectedCell.probability}% PROBABILITY</b> ({inspectedCell.trigger})
                </span>
              ) : (
                <span>Hover or tap any grid cell to inspect localized hazard triggers</span>
              )}
            </div>
          </div>
        </div>

        {/* Hazard Breakdown Side Panel */}
        <div className="panel-surface hazard-side">
          <div className="panel-title">
            <div>
              <CloudLightning size={15} />
              <h3>Selectable Hazard Fields</h3>
            </div>
            <span className="meta-tag">6 PHENOMENA</span>
          </div>

          {/* Hazard Selectors */}
          <div className="hazard-selector">
            {snapshot.hazards.map((hazard) => {
              const meta = hazardMeta[hazard.key]
              const Icon = meta.icon
              const isSelected = selectedHazard === hazard.key

              return (
                <button
                  key={hazard.key}
                  className={`hazard-select-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedHazard(hazard.key)}
                >
                  <span className="selector-dot" style={{ background: hazard.color }} />
                  <div className="hazard-select-info">
                    <span className="hazard-name">{hazard.label}</span>
                    <small className="hazard-subval">{hazard.value}</small>
                  </div>
                  <b className="hazard-pct">{hazard.probability}%</b>
                </button>
              )
            })}
          </div>

          {/* Deep Explainability Box for Selected Hazard */}
          <div className="hazard-detail">
            <div className="detail-label">
              SELECTED PHENOMENON: {activeHazardObj.label.toUpperCase()}
            </div>

            <div className="big-risk-value">
              {activeHazardObj.probability}
              <small>% PROB</small>
            </div>

            <div className="detail-row">
              <span>Model Agreement</span>
              <b>{activeHazardObj.confidence}% consensus</b>
            </div>

            <div className="detail-row">
              <span>Temporal Trend</span>
              <b className="text-amber">↗ {activeHazardObj.trend} (last 15m)</b>
            </div>

            <div className="detail-row">
              <span>Trigger Criteria</span>
              <b>{hazardMeta[selectedHazard].triggerCriteria}</b>
            </div>

            <div className="why-box">
              <div className="why-header">
                <Info size={13} />
                <strong>METEOROLOGICAL REASONING:</strong>
              </div>
              <p>{hazardMeta[selectedHazard].desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Hazard Comparison Matrix Grid */}
      <div className="hazard-cards-strip">
        {snapshot.hazards.map((h) => (
          <div
            className={`panel-surface hazard-summary-card ${
              selectedHazard === h.key ? 'is-selected' : ''
            }`}
            key={h.key}
            onClick={() => setSelectedHazard(h.key)}
            role="button"
            tabIndex={0}
          >
            <div className="summary-card-top">
              <span className="selector-dot" style={{ background: h.color }} />
              <span className="summary-title">{h.label}</span>
              <span className="summary-trend">↗</span>
            </div>
            <b>{h.probability}%</b>
            <div className="summary-bar">
              <span style={{ width: `${h.probability}%`, background: h.color }} />
            </div>
            <small>
              {h.value} · {h.confidence}% conf.
            </small>
          </div>
        ))}
      </div>
    </div>
  )
}
