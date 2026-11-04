import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  Hospital,
  MapPin,
  Plane,
  Route,
  School,
  ShieldAlert,
  Siren,
  Tractor,
  Zap,
  CloudLightning,
  CloudRain,
  CloudHail,
  Wind,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Mode } from '../domain/types'
import {
  ImpactTwinHazard,
  WorkflowStageId,
  TwinAsset,
  TWIN_ASSETS,
  HAZARD_PROFILES,
  computeTwinMetrics,
} from '../domain/impactTwin'
import { AdaptiveImpactTwinMap } from '../components/AdaptiveImpactTwinMap'
import { AssetDecisionCard } from '../components/AssetDecisionCard'
import { ImpactWorkflowStepper } from '../components/ImpactWorkflowStepper'
import { BeforeAfterSliderControl } from '../components/BeforeAfterSliderControl'
import { ImpactTimelineBar } from '../components/ImpactTimelineBar'

const formatNumber = (val: number) => new Intl.NumberFormat('en-IN').format(Math.round(val))

export function ImpactIntelligenceView() {
  const { snapshot, mode, setMode, navigate } = useApp()

  // State for Adaptive Impact Twin
  const [selectedHazard, setSelectedHazard] = useState<ImpactTwinHazard>('COMPOSITE')
  const [selectedAsset, setSelectedAsset] = useState<TwinAsset>(TWIN_ASSETS[0]) // NH-81 Underpass default
  const [currentStageId, setCurrentStageId] = useState<WorkflowStageId>('STAGE_5_ANALYSIS')
  const [beforeAfterMode, setBeforeAfterMode] = useState<'BEFORE' | 'AFTER' | 'SLIDER'>('SLIDER')
  const [sliderValue, setSliderValue] = useState<number>(65)
  const [timelineMinute, setTimelineMinute] = useState<number>(14) // 14 min into event

  // Existing route assessment state
  const [routeOrigin, setRouteOrigin] = useState('Coimbatore Central')
  const [routeDest, setRouteDest] = useState('Tiruppur North (NH-81)')

  const modeIcons = {
    EMERGENCY: Siren,
    AVIATION: Plane,
    AGRICULTURE: Tractor,
    URBAN: Building2,
  }

  const ModeIcon = modeIcons[mode]

  const activeStormCell = snapshot.cells[0] || {
    id: 'VX-1A7',
    name: 'Cell Alpha-1',
    centroid: { x: 77.26, y: 11.1085 },
    intensity: 78,
    reflectivity: 58,
    speed: 42,
    direction: 'ENE',
    directionDegrees: 78,
    ageMinutes: 35,
    lifecycle: 'INTENSIFYING',
    lightningRate: 48,
    rainfallRate: 65,
    hailProbability: 75,
    windProbability: 80,
    cloudburstProbability: 85,
  }

  const twinMetrics = computeTwinMetrics(
    selectedHazard,
    activeStormCell,
    timelineMinute,
    snapshot
  )

  const assets = [
    { label: 'Exposed Population', value: formatNumber(twinMetrics.estimatedPopulationExposed), detail: `within ${twinMetrics.activeRadiusKm} km risk swath`, icon: Building2 },
    { label: 'Intersected Habitations', value: snapshot.impact.villages.toString(), detail: 'urban & rural clusters in path', icon: MapPin },
    { label: 'Schools & Campuses', value: snapshot.impact.schools.toString(), detail: 'educational campuses', icon: School },
    { label: 'Hospitals & Trauma Centers', value: snapshot.impact.hospitals.toString(), detail: 'emergency health facilities', icon: Hospital },
    { label: 'Highway Segments', value: snapshot.impact.roads.toString(), detail: 'arterial logistics corridors', icon: Route },
    { label: 'Power Substations', value: snapshot.impact.substations.toString(), detail: 'high-voltage transmission nodes', icon: Zap },
    { label: 'Agricultural Land', value: `${snapshot.impact.agricultureKm2} km²`, detail: 'crop & plantation zone', icon: Tractor },
    { label: 'Airports & Airstrips', value: snapshot.impact.airports.toString(), detail: 'CJB airport sector watch', icon: Plane },
  ]

  const hazardButtons: { key: ImpactTwinHazard; label: string; icon: any; color: string }[] = [
    { key: 'LIGHTNING', label: 'Lightning Strikes', icon: CloudLightning, color: '#FACC15' },
    { key: 'THUNDERSTORM', label: 'Severe Thunderstorm', icon: Wind, color: '#38E4C0' },
    { key: 'CLOUDBURST', label: 'Localized Cloudburst', icon: CloudRain, color: '#38BDF8' },
    { key: 'EXTREME_RAINFALL', label: 'Extreme Rainfall', icon: CloudRain, color: '#60A5FA' },
    { key: 'HAILSTORM', label: 'Hail Core Aloft', icon: CloudHail, color: '#C084FC' },
    { key: 'COMPOSITE', label: 'Multi-Hazard Twin', icon: ShieldAlert, color: '#FF705E' },
  ]

  return (
    <div className="view-stack impact-intelligence-view">
      {/* View Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 04 · ANIMATED ADAPTIVE IMPACT TWIN &amp; DECISION INTELLIGENCE</span>
          </div>
          <h2>Adaptive Impact Twin</h2>
          <p>
            Continuous georeferenced simulation translating weather physics, topography, and asset vulnerability
            into actionable decision intelligence.
          </p>
        </div>

        {/* Operational Mode Tabs */}
        <div className="mode-tabs" role="tablist" aria-label="Operational Mode">
          {(['EMERGENCY', 'AVIATION', 'AGRICULTURE', 'URBAN'] as Mode[]).map((item) => (
            <button
              key={item}
              className={mode === item ? 'active' : ''}
              onClick={() => setMode(item)}
              role="tab"
              aria-selected={mode === item}
            >
              {item} MODE
            </button>
          ))}
        </div>
      </div>

      {/* Operational Lens Priority Banner */}
      <div className="impact-mode-banner panel-surface">
        <div className="mode-banner-icon">
          <ModeIcon size={22} />
        </div>
        <div className="mode-banner-text">
          <span>OPERATIONAL LENS: {mode} PRIORITY</span>
          <b>
            {mode === 'EMERGENCY'
              ? 'Civil defense prioritization: Population evacuation zones, shelters, arterial roads, and trauma centers.'
              : mode === 'AVIATION'
              ? 'Aviation logistics: Runway crosswinds, low-level windshear, approach holding, and ramp lightning stoppage.'
              : mode === 'AGRICULTURE'
              ? 'Horticultural protection: Hail damage to cash crops, standing water inundation, and livestock shelter.'
              : 'Urban infrastructure: Storm drain capacity, subway underpasses, power substations, and transit corridors.'}
          </b>
        </div>
        <div className="mode-banner-status">
          <span className="status-dot green" />
          <span>Adaptive Twin Synced</span>
        </div>
      </div>

      {/* Interactive Weather Hazard Selector Toolbar */}
      <div className="panel-surface twin-hazard-toolbar">
        <div className="twin-hazard-toolbar-header">
          <div className="toolbar-header-left">
            <Sparkles size={14} className="icon-cyan" />
            <span className="header-label">SELECT WEATHER HAZARD SIMULATION LAYER:</span>
          </div>
          <div className="toolbar-header-right">
            <span className="active-hazard-indicator" style={{ color: HAZARD_PROFILES[selectedHazard].color }}>
              ACTIVE: <b>{HAZARD_PROFILES[selectedHazard].name.toUpperCase()}</b>
            </span>
          </div>
        </div>

        <div className="twin-hazard-buttons-grid">
          {hazardButtons.map((hb) => {
            const isSelected = selectedHazard === hb.key
            const Icon = hb.icon
            return (
              <button
                key={hb.key}
                onClick={() => setSelectedHazard(hb.key)}
                className={`twin-hazard-btn ${isSelected ? 'active' : ''}`}
                style={
                  isSelected
                    ? {
                        borderColor: hb.color,
                        boxShadow: `0 0 16px ${hb.color}40`,
                        background: `linear-gradient(135deg, rgba(22, 46, 39, 0.95), rgba(16, 34, 29, 0.98))`,
                      }
                    : {}
                }
              >
                <span className="hazard-btn-icon" style={{ color: hb.color }}>
                  <Icon size={16} />
                </span>
                <span className="hazard-btn-text">{hb.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 7-Stage Interactive Workflow Stepper */}
      <ImpactWorkflowStepper
        currentStageId={currentStageId}
        onStageChange={setCurrentStageId}
      />

      {/* Primary Map Visualizer: Adaptive Impact Twin */}
      <div className="panel-surface twin-map-panel-container">
        <div className="panel-header map-panel-header">
          <div>
            <div className="panel-kicker">
              <Layers size={14} />
              <span>GEOGRAPHIC ADAPTIVE TWIN CANVAS · HIGHWAY &amp; URBAN ASSETS</span>
            </div>
            <h3>Live Convective Swath vs Vulnerable Infrastructure</h3>
          </div>
          <div className="twin-map-tags">
            <span className="twin-tag-storm">
              CELL: <b>{activeStormCell.id}</b> · {activeStormCell.intensity}% INTENSITY
            </span>
            <span className={`twin-tag-severity severity-${twinMetrics.severity.toLowerCase()}`}>
              SEVERITY: <b>{twinMetrics.severity}</b>
            </span>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="twin-map-wrapper-box">
          <AdaptiveImpactTwinMap
            height="520px"
            hazard={selectedHazard}
            activeCell={activeStormCell}
            timelineMinute={timelineMinute}
            selectedAsset={selectedAsset}
            currentStage={currentStageId}
            beforeAfterMode={beforeAfterMode}
            sliderValue={sliderValue}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
          />
        </div>
      </div>

      {/* Interactive Controls: Before / After Slider + 4D Timeline Bar */}
      <div className="twin-controls-row">
        {/* Before / After Slider Control */}
        <BeforeAfterSliderControl
          mode={beforeAfterMode}
          sliderValue={sliderValue}
          selectedHazard={selectedHazard}
          onModeChange={setBeforeAfterMode}
          onSliderChange={setSliderValue}
        />

        {/* Timeline Control Bar */}
        <ImpactTimelineBar
          currentMinute={timelineMinute}
          minMinute={0}
          maxMinute={60}
          arrivalMinute={28}
          onMinuteChange={setTimelineMinute}
        />
      </div>

      {/* Asset Decision Intelligence & Inspector */}
      <div className="twin-decision-wrapper-section">
        {/* Quick Asset Selector Tabs */}
        <div className="twin-asset-strip-header">
          <div className="strip-title">
            <MapPin size={14} className="icon-cyan" />
            <span>INSPECT CRITICAL INFRASTRUCTURE NODES:</span>
          </div>
          <div className="strip-hint">
            Select any asset below or click a map pin to inspect real-time decision synthesis
          </div>
        </div>

        <div className="twin-asset-selector-pills">
          {TWIN_ASSETS.map((asset) => {
            const isSelected = selectedAsset.id === asset.id
            return (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`twin-asset-pill-btn ${isSelected ? 'active' : ''}`}
              >
                <span className={`asset-pill-dot ${asset.vulnerability.toLowerCase()}`} />
                <span>{asset.name}</span>
              </button>
            )
          })}
        </div>

        {/* Asset Decision Card matching reference screenshot */}
        <AssetDecisionCard
          asset={selectedAsset}
          selectedHazard={selectedHazard}
          stormEventId={activeStormCell.id}
          confidencePct={twinMetrics.confidencePct}
          arrivalMin={twinMetrics.arrivalMinutes}
          onFocusAssetOnMap={(asset) => setSelectedAsset(asset)}
        />
      </div>

      {/* Asset Exposure Metric Cards */}
      <div className="asset-grid">
        {assets.map((asset) => (
          <div className="panel-surface asset-card" key={asset.label}>
            <div className="asset-card-icon">
              <asset.icon size={17} />
            </div>
            <span className="asset-card-label">{asset.label}</span>
            <b className="asset-card-value">{asset.value}</b>
            <small className="asset-card-detail">{asset.detail}</small>
          </div>
        ))}
      </div>

      {/* Lower Row: Route-Risk Prototype + Priority Response Queue + Decision Brief */}
      <div className="impact-lower">
        {/* Route Risk Prototype */}
        <div className="panel-surface route-card">
          <div className="panel-title">
            <div>
              <Route size={15} />
              <h3>Corridor Travel-Risk Assessment</h3>
            </div>
            <span className="meta-tag">NH-81 CORRIDOR</span>
          </div>

          <div className="route-fields">
            <button
              className="route-btn active"
              onClick={() => setRouteOrigin('Coimbatore Central')}
            >
              <span>ORIGIN</span>
              <b>{routeOrigin}</b>
              <ArrowRight size={14} />
            </button>

            <button
              className="route-btn active"
              onClick={() => setRouteDest('Tiruppur North (NH-81)')}
            >
              <span>DESTINATION</span>
              <b>{routeDest}</b>
              <MapPin size={14} />
            </button>
          </div>

          <div className="route-map-graphic">
            <div className="route-line-vector" />
            <span className="route-point start">A</span>
            <span className="route-point end">B</span>
            <div className="route-status-chip">
              <AlertTriangle size={13} />
              <span>HIGH INTERSECTION RISK · ARRIVAL T+{twinMetrics.arrivalMinutes} MIN</span>
            </div>
          </div>

          <div className="route-metrics-grid">
            <div className="route-metric">
              <b>{Math.round(activeStormCell.intensity * 0.6)}%</b>
              <span>Current Risk</span>
            </div>
            <div className="route-metric">
              <b>{Math.round(activeStormCell.intensity * 0.95)}%</b>
              <span>+30m Risk Peak</span>
            </div>
            <div className="route-metric">
              <b>2 Cells</b>
              <span>Crossings</span>
            </div>
            <div className="route-metric">
              <b>{twinMetrics.severity}</b>
              <span>Exposure Level</span>
            </div>
          </div>
        </div>

        {/* Priority Response Queue & Decision Brief */}
        <div className="panel-surface exposure-card">
          <div className="panel-title">
            <div>
              <ShieldAlert size={15} />
              <h3>Priority Operational Response Queue</h3>
            </div>
            <span className="meta-tag">RANKED ACTION</span>
          </div>

          <div className="priority-list">
            <div className="priority-item">
              <span className="priority-rank">01</span>
              <div className="priority-text">
                <b>NH-81 Underpass near Tiruppur</b>
                <small>High waterlogging probability; prepare alternate ambulance route before T+20 min</small>
              </div>
              <span className="severity-chip severity-severe">CRITICAL</span>
            </div>

            <div className="priority-item">
              <span className="priority-rank">02</span>
              <div className="priority-text">
                <b>Coimbatore Metro &amp; Northern Arterial</b>
                <small>{formatNumber(twinMetrics.estimatedPopulationExposed)} people in projected path; flash rain advisory</small>
              </div>
              <span className="severity-chip severity-warning">IMMEDIATE</span>
            </div>

            <div className="priority-item">
              <span className="priority-rank">03</span>
              <div className="priority-text">
                <b>Palladam Power Grid 400kV Node</b>
                <small>Severe lightning strike density; engage surge suppression banks</small>
              </div>
              <span className="severity-chip severity-alert">MONITOR</span>
            </div>
          </div>

          {/* Decision Support Brief */}
          <div className="decision-brief-box">
            <div className="decision-brief-title">
              <Check size={13} />
              <b>DECISION SYNTHESIS SUMMARY</b>
            </div>
            <p>
              1. Restrict heavy transit across NH-81 underpass and activate auxiliary sump pumps before T+20 min.
              <br />
              2. Advise Tiruppur &amp; Coimbatore dispatch to route emergency vehicles along Avinashi Elevated Expressway.
              <br />
              3. Issue localized CAP bulletins in English, Hindi, and Tamil to citizens in the 15 km risk swath.
            </p>
          </div>

          <button
            className="primary-action"
            onClick={() => navigate('alerts')}
            title="Open Alert Center to review generated CAP warnings"
          >
            <span>REVIEW IN ALERT CENTER</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
