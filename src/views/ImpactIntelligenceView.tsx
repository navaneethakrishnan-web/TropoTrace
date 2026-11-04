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
  WORKFLOW_STAGES,
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
    lat: 11.1085,
    lng: 77.2600,
    intensity: 78,
    speedKmh: 42,
    directionDeg: 78,
    arrivalMinutes: 28,
    dbz: 58,
    vil: 44,
    meshMm: 24,
    poshPct: 82,
    trend: 'INTENSIFYING',
    hazardTypes: ['CLOUDBURST', 'LIGHTNING', 'EXTREME_RAINFALL'],
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
    <div className="view-stack impact-intelligence-view space-y-6">
      {/* View Header */}
      <div className="view-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <span className="eyebrow-line" />
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold">
              MODULE 04 · ANIMATED ADAPTIVE IMPACT TWIN &amp; DECISION INTELLIGENCE
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1">
            Adaptive Impact Twin
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
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
      <div className="impact-mode-banner panel-surface flex items-center justify-between p-4 rounded-xl border border-slate-700/60 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="mode-banner-icon p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
            <ModeIcon size={22} />
          </div>
          <div className="mode-banner-text">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              OPERATIONAL LENS: {mode} PRIORITY
            </div>
            <div className="text-xs font-medium text-slate-200 mt-0.5">
              {mode === 'EMERGENCY'
                ? 'Civil defense prioritization: Population evacuation zones, shelters, arterial roads, and trauma centers.'
                : mode === 'AVIATION'
                ? 'Aviation logistics: Runway crosswinds, low-level windshear, approach holding, and ramp lightning stoppage.'
                : mode === 'AGRICULTURE'
                ? 'Horticultural protection: Hail damage to cash crops, standing water inundation, and livestock shelter.'
                : 'Urban infrastructure: Storm drain capacity, subway underpasses, power substations, and transit corridors.'}
            </div>
          </div>
        </div>
        <div className="mode-banner-status flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Adaptive Twin Synced</span>
        </div>
      </div>

      {/* Interactive Weather Hazard Selector Toolbar */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Select Weather Hazard Layer for Simulation:
          </span>
          <span className="font-mono text-cyan-400 text-[11px]">
            Active: {HAZARD_PROFILES[selectedHazard].name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {hazardButtons.map((hb) => {
            const isSelected = selectedHazard === hb.key
            const Icon = hb.icon
            return (
              <button
                key={hb.key}
                onClick={() => setSelectedHazard(hb.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: hb.color,
                        boxShadow: `0 0 14px ${hb.color}33`,
                      }
                    : {}
                }
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: hb.color }} />
                <span className="truncate">{hb.label}</span>
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
      <div className="panel-surface impact-map-container rounded-2xl border border-slate-700 overflow-hidden shadow-2xl bg-slate-950 p-0 relative">
        <div className="panel-header map-panel-header px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="panel-kicker text-xs uppercase tracking-wider font-mono text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>GEOGRAPHIC ADAPTIVE TWIN CANVAS · HIGHWAY &amp; URBAN ASSETS</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Live Convective Swath vs Vulnerable Infrastructure
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              Storm: {activeStormCell.id} · {activeStormCell.intensity}% Intensity
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800/60">
              Severity: {twinMetrics.severity}
            </span>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="w-full relative" style={{ minHeight: '520px' }}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          arrivalMinute={activeStormCell.arrivalMinutes}
          onMinuteChange={setTimelineMinute}
        />
      </div>

      {/* Asset Decision Intelligence & Inspector */}
      <div className="space-y-3">
        {/* Quick Asset Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Inspect Critical Infrastructure Nodes:
          </span>
          <span className="text-xs text-slate-400">
            Click any pin on map or button below to inspect decision status
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {TWIN_ASSETS.map((asset) => {
            const isSelected = selectedAsset.id === asset.id
            return (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-cyan-600 text-white font-bold border-cyan-400 shadow-md'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                {asset.name}
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
