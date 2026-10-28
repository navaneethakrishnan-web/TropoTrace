import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  Compass,
  Hospital,
  MapPin,
  Plane,
  Route,
  School,
  ShieldAlert,
  Siren,
  Target,
  Tractor,
  Zap,
} from 'lucide-react'
import { StormMap } from '../components/StormMap'
import { useApp } from '../context/AppContext'
import type { Mode } from '../domain/types'

const formatNumber = (val: number) => new Intl.NumberFormat('en-IN').format(Math.round(val))

export function ImpactIntelligenceView() {
  const { snapshot, mode, setMode, navigate } = useApp()
  const [routeOrigin, setRouteOrigin] = useState('Coimbatore Central')
  const [routeDest, setRouteDest] = useState('Tiruppur North (NH-81)')

  const modeIcons = {
    EMERGENCY: Siren,
    AVIATION: Plane,
    AGRICULTURE: Tractor,
    URBAN: Building2,
  }

  const ModeIcon = modeIcons[mode]

  const assets = [
    { label: 'Exposed Population', value: formatNumber(snapshot.impact.population), detail: 'within 15 km risk cone', icon: Building2 },
    { label: 'Intersected Villages', value: snapshot.impact.villages.toString(), detail: 'rural habitations in path', icon: MapPin },
    { label: 'Schools & Colleges', value: snapshot.impact.schools.toString(), detail: 'educational campuses', icon: School },
    { label: 'Hospitals & Clinics', value: snapshot.impact.hospitals.toString(), detail: 'emergency health facilities', icon: Hospital },
    { label: 'Highway Segments', value: snapshot.impact.roads.toString(), detail: 'arterial logistics corridors', icon: Route },
    { label: 'Power Substations', value: snapshot.impact.substations.toString(), detail: 'high-voltage grid nodes', icon: Zap },
    { label: 'Agricultural Land', value: `${snapshot.impact.agricultureKm2} km²`, detail: 'crop & plantation zone', icon: Tractor },
    { label: 'Airports & Airstrips', value: snapshot.impact.airports.toString(), detail: 'CJB airport sector watch', icon: Plane },
  ]

  return (
    <div className="view-stack impact-intelligence-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 04 · ASSET EXPOSURE &amp; DECISION SUPPORT</span>
          </div>
          <h2>Impact Intelligence</h2>
          <p>
            Translate convective storm kinematics and probabilistic hazard envelopes into actionable
            infrastructure exposure and operational consequences.
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

      {/* Mode Priority Banner */}
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
          <span>GIS Exposure Synchronized</span>
        </div>
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

      {/* Impact Spatial Corridor Map */}
      <div className="panel-surface impact-map-container">
        <div className="panel-header map-panel-header">
          <div>
            <div className="panel-kicker">
              <Target size={14} />
              <span>SPATIAL EXPOSURE CORRIDOR</span>
            </div>
            <h3>Projected Storm Path vs Infrastructure Assets</h3>
          </div>
          <span className="demo-label">TRANSLUCENT HAZARD CONE</span>
        </div>
        <StormMap height="460px" showImpactCorridor={true} />
      </div>

      {/* Lower Row: Route-Risk Prototype + Priority Response Queue + Decision Brief */}
      <div className="impact-lower">
        {/* Route Risk Prototype */}
        <div className="panel-surface route-card">
          <div className="panel-title">
            <div>
              <Route size={15} />
              <h3>Corridor Travel-Risk Prototype</h3>
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
              <span>HIGH INTERSECTION RISK · ARRIVAL T+38 MIN</span>
            </div>
          </div>

          <div className="route-metrics-grid">
            <div className="route-metric">
              <b>42%</b>
              <span>Current Risk</span>
            </div>
            <div className="route-metric">
              <b>85%</b>
              <span>+30m Risk Peak</span>
            </div>
            <div className="route-metric">
              <b>2 Cells</b>
              <span>Crossings</span>
            </div>
            <div className="route-metric">
              <b>SEVERE</b>
              <span>Lightning Exposure</span>
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
                <b>Coimbatore Metro &amp; Northern Arterial</b>
                <small>{formatNumber(snapshot.impact.population)} people in projected path; flash rain advisory</small>
              </div>
              <span className="severity-chip severity-severe">IMMEDIATE</span>
            </div>

            <div className="priority-item">
              <span className="priority-rank">02</span>
              <div className="priority-text">
                <b>NH-81 Logistics Corridor / Avinashi Bypass</b>
                <small>{snapshot.impact.roads} road segments with waterlogging and wind shear</small>
              </div>
              <span className="severity-chip severity-warning">WARNING</span>
            </div>

            <div className="priority-item">
              <span className="priority-rank">03</span>
              <div className="priority-text">
                <b>Palladam Power Grid &amp; Substation Subnet</b>
                <small>{snapshot.impact.substations} transmission nodes with high lightning strike risk</small>
              </div>
              <span className="severity-chip severity-alert">MONITOR</span>
            </div>
          </div>

          {/* Decision Support Brief */}
          <div className="decision-brief-box">
            <div className="decision-brief-title">
              <Check size={13} />
              <b>ASSESSMENT &amp; OPERATIONAL NEXT STEPS</b>
            </div>
            <p>
              1. Issue multi-language CAP alert for Coimbatore urban perimeter before T+20 min.
              <br />
              2. Advise civil transit to divert heavy vehicles away from flood-prone NH-81 underpasses.
              <br />
              3. Alert CJB airport ground handling crews regarding lightning strikes within 10 km.
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
