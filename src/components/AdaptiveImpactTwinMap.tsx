import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Compass,
  RotateCcw,
  Sliders,
} from 'lucide-react'
import type {
  ImpactTwinHazard,
  TwinAsset,
  WorkflowStageId,
} from '../domain/impactTwin'
import { HAZARD_PROFILES, TWIN_ASSETS } from '../domain/impactTwin'
import type { StormCell } from '../domain/types'

interface AdaptiveImpactTwinMapProps {
  hazard: ImpactTwinHazard
  activeCell: StormCell
  timelineMinute: number
  selectedAsset: TwinAsset | null
  onSelectAsset: (asset: TwinAsset) => void
  currentStage: WorkflowStageId
  beforeAfterMode: 'BEFORE' | 'AFTER' | 'SLIDER'
  sliderValue: number // 0 (Before) to 100 (After)
  height?: string
}

export function AdaptiveImpactTwinMap({
  hazard,
  activeCell,
  timelineMinute,
  selectedAsset,
  onSelectAsset,
  currentStage,
  beforeAfterMode,
  sliderValue,
  height = '540px',
}: AdaptiveImpactTwinMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const [basemap, setBasemap] = useState<'satellite' | 'street'>('satellite')

  // Center around Coimbatore-Tiruppur corridor in Tamil Nadu
  const defaultCenter: [number, number] = [11.08, 77.16]

  // Calculate dynamic storm center based on speed, direction, and timeline
  const getDynamicStormPos = (): [number, number] => {
    const elapsedHrs = (timelineMinute - 0) / 60
    const speed = typeof activeCell.speed === 'number' ? activeCell.speed : 42
    const dir = typeof activeCell.direction === 'string' ? activeCell.direction : 'ENE'
    const latShift = (elapsedHrs * speed * 0.007) * (dir.includes('N') ? 1 : -0.5)
    const lngShift = (elapsedHrs * speed * 0.009) * (dir.includes('E') ? 1 : -0.5)
    return [11.06 + latShift, 77.08 + lngShift]
  }

  // Initialize Map
  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return

    const map = L.map(mapHostRef.current, {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true,
    }).setView(defaultCenter, 10)

    mapRef.current = map
    overlayRef.current = L.layerGroup().addTo(map)

    const timer = window.setTimeout(() => map.invalidateSize(), 150)

    return () => {
      window.clearTimeout(timer)
      map.remove()
      mapRef.current = null
      overlayRef.current = null
      tileLayerRef.current = null
    }
  }, [])

  // Basemap Tile Layer
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    tileLayerRef.current?.remove()

    const url =
      basemap === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

    const attribution =
      basemap === 'satellite'
        ? 'Tiles &copy; Esri, Maxar, Earthstar Geographics'
        : 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap'

    tileLayerRef.current = L.tileLayer(url, { maxZoom: 18, attribution }).addTo(map)
  }, [basemap])

  // Camera focus on stage change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const stormPos = getDynamicStormPos()

    if (selectedAsset) {
      map.flyTo([selectedAsset.lat, selectedAsset.lng], 12, { duration: 1.0 })
    } else if (currentStage === 'STAGE_1_DETECTION') {
      map.flyTo(stormPos, 11, { duration: 1.0 })
    } else if (currentStage === 'STAGE_2_IMPACT_ZONE' || currentStage === 'STAGE_3_POPULATION') {
      map.flyTo(defaultCenter, 10, { duration: 1.0 })
    } else if (currentStage === 'STAGE_4_INFRASTRUCTURE' || currentStage === 'STAGE_6_PRECAUTIONS') {
      // Focus on NH-81 corridor
      map.flyTo([11.1120, 77.3380], 12, { duration: 1.2 })
    }
  }, [currentStage, selectedAsset?.id])

  // Render Overlays
  useEffect(() => {
    const map = mapRef.current
    const overlay = overlayRef.current
    if (!map || !overlay) return

    overlay.clearLayers()

    const profile = HAZARD_PROFILES[hazard]
    const stormPos = getDynamicStormPos()

    // Determine impact intensity factor based on Before/After mode and slider
    // 0 = 100% Before (nominal/clean), 1.0 = 100% After (full impact predicted)
    let impactFactor = 1.0
    if (beforeAfterMode === 'BEFORE') {
      impactFactor = 0.0
    } else if (beforeAfterMode === 'SLIDER') {
      impactFactor = Math.max(0, Math.min(1, sliderValue / 100))
    }

    const cssIcon = (className: string, content = '', size = 38) => {
      return L.divIcon({
        className: `leaflet-vajra-icon ${className}`,
        html: content,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
    }

    // =========================================================================
    // 1. BASELINE INFRASTRUCTURE LAYERS (Always Visible in Both Before & After)
    // =========================================================================

    // Arterial Highway NH-81 & NH-544 Corridors
    const nh81Points: L.LatLngExpression[] = [
      [10.98, 76.88],
      [11.02, 76.96], // Coimbatore
      [11.06, 77.12], // Sulur / Irugur
      [11.09, 77.24], // Palladam junction
      [11.1120, 77.3380], // Tiruppur Underpass
      [11.16, 77.46],
      [11.34, 77.72], // Erode junction
    ]

    const nh544Points: L.LatLngExpression[] = [
      [10.82, 76.92],
      [10.99, 76.96],
      [11.15, 77.06],
      [11.30, 77.22],
    ]

    // Highway baseline lines
    L.polyline(nh81Points, {
      color: impactFactor > 0.4 ? '#FF8343' : '#64B5F6',
      weight: impactFactor > 0.4 ? 4 : 3,
      opacity: 0.85,
      dashArray: impactFactor > 0.4 ? '8 6' : undefined,
      className: impactFactor > 0.4 ? 'animated-highway-impact' : '',
    })
      .bindTooltip('<b>NH-81 CORRIDOR</b><br/>Coimbatore – Tiruppur – Erode Transport Spine', { direction: 'top' })
      .addTo(overlay)

    L.polyline(nh544Points, {
      color: '#4ADE80',
      weight: 2.5,
      opacity: 0.6,
    }).addTo(overlay)

    // =========================================================================
    // 2. BEFORE STATE VISUALS (Nominal / Clear Skies / Green Baseline)
    // =========================================================================
    if (impactFactor < 0.25) {
      // Clear sky nominal zone indicator
      L.circle(defaultCenter, {
        radius: 22000,
        color: '#4ADE80',
        weight: 1.5,
        dashArray: '4 6',
        opacity: 0.5,
        fillColor: '#4ADE80',
        fillOpacity: 0.04,
      })
        .bindTooltip('<b>BASELINE STATUS: NOMINAL</b><br/>Clear operational corridors before predicted hazard.', { direction: 'top' })
        .addTo(overlay)
    }

    // =========================================================================
    // 3. AFTER STATE VISUALS (Predicted Hazard Footprint, Impact Zones, Swaths)
    // =========================================================================
    if (impactFactor > 0.05) {
      const radiusPrimary = profile.primaryRiskRadiusMeters * (0.4 + impactFactor * 0.6)
      const radiusSecondary = profile.secondaryRiskRadiusMeters * (0.4 + impactFactor * 0.6)

      // A. Secondary Risk Buffer Zone (Expanding Peripheral Impact)
      L.circle(stormPos, {
        radius: radiusSecondary,
        color: profile.color,
        weight: 1.5,
        dashArray: '6 8',
        opacity: 0.7 * impactFactor,
        fillColor: profile.color,
        fillOpacity: 0.08 * impactFactor,
        className: 'twin-secondary-zone-circle',
      })
        .bindTooltip(`<b>SECONDARY IMPACT ZONE (${Math.round(radiusSecondary / 1000)} km)</b><br/>Peripheral exposure buffer`, { direction: 'top' })
        .addTo(overlay)

      // B. Primary Severe Convective Core Zone
      L.circle(stormPos, {
        radius: radiusPrimary,
        color: '#FF4D4D',
        weight: 2,
        opacity: 0.85 * impactFactor,
        fillColor: profile.color,
        fillOpacity: 0.18 * impactFactor,
        className: 'twin-primary-zone-circle',
      })
        .bindTooltip(`<b>PRIMARY SEVERE CORE (${Math.round(radiusPrimary / 1000)} km)</b><br/>${profile.name}`, { direction: 'top' })
        .addTo(overlay)

      // C. Rotating Doppler Radar Beam Scanning Sweep
      const radarHtml = `
        <div class="radar-station-container ${impactFactor > 0.3 ? 'active-scan' : 'idle-scan'}">
          <div class="radar-sweep-beam"></div>
          <div class="radar-range-ring ring-1"></div>
          <div class="radar-range-ring ring-2"></div>
          <div class="radar-station-center">
            <span class="station-core"></span>
          </div>
        </div>
      `
      L.marker(stormPos, {
        icon: L.divIcon({
          className: 'leaflet-radar-sweep-marker',
          html: radarHtml,
          iconSize: [220, 220],
          iconAnchor: [110, 110],
        }),
        interactive: false,
        zIndexOffset: -50,
      }).addTo(overlay)

      // D. Hazard-Specific Animated Signatures
      if (hazard === 'LIGHTNING' || hazard === 'COMPOSITE') {
        // Active 3D Golden Lightning Strokes
        Array.from({ length: 5 }, (_, i) => {
          const angle = i * ((Math.PI * 2) / 5) + 0.3
          const strokeDist = 0.03 + (i % 2) * 0.015
          const lat = stormPos[0] + Math.sin(angle) * strokeDist
          const lng = stormPos[1] + Math.cos(angle) * strokeDist

          L.marker([lat, lng], {
            icon: cssIcon('lightning-marker', `<span class="gold-lightning-line lightning-line-${(i % 4) + 1}"></span>`, 44),
            interactive: false,
          }).addTo(overlay)
        })
      }

      if (hazard === 'CLOUDBURST' || hazard === 'EXTREME_RAINFALL' || hazard === 'COMPOSITE') {
        // Cascading Rain Curtains & Inundation Water Accumulation Polygons
        L.marker(stormPos, {
          icon: cssIcon('cloudburst-marker', '<span class="cloudburst-glyph">☔</span><div class="storm-rain-curtain"></div>', 60),
          interactive: false,
        }).addTo(overlay)

        // Low-lying Inundation Pool around NH-81 Tiruppur Underpass
        L.circle([11.1120, 77.3380], {
          radius: 1800 * impactFactor,
          color: '#38E4C0',
          weight: 2,
          opacity: 0.9,
          fillColor: '#00B4D8',
          fillOpacity: 0.35 * impactFactor,
          className: 'animated-flood-pool-polygon',
        })
          .bindTooltip('<b>PREDICTED RUNOFF CONVERGENCE POOL</b><br/>Water accumulation depth: >45 cm projected', { direction: 'top' })
          .addTo(overlay)
      }

      if (hazard === 'HAILSTORM') {
        // Hail hydrometeors aloft footprint
        Array.from({ length: 18 }, (_, idx) => {
          const lat = stormPos[0] + 0.035 - (idx % 5) * 0.016
          const lng = stormPos[1] - 0.03 + Math.floor(idx / 5) * 0.018
          L.marker([lat, lng], {
            icon: cssIcon('hail-marker', '<span class="hail-glyph">●</span>', 26),
            interactive: false,
          }).addTo(overlay)
        })
      }

      if (hazard === 'THUNDERSTORM') {
        // Downdraft Outflow Vectors
        Array.from({ length: 6 }, (_, idx) => {
          const angle = idx * (Math.PI / 3)
          const lat = stormPos[0] + Math.sin(angle) * 0.04
          const lng = stormPos[1] + Math.cos(angle) * 0.05
          L.marker([lat, lng], {
            icon: cssIcon('downburst-marker', '<span class="downburst-glyph">↘</span>', 28),
            interactive: false,
          }).addTo(overlay)
        })
      }

      // Projected Motion Trajectory Vector & Uncertainty Swath Cone
      const forecastPoints: L.LatLngExpression[] = [
        stormPos,
        [stormPos[0] + 0.04, stormPos[1] + 0.06],
        [stormPos[0] + 0.08, stormPos[1] + 0.12],
      ]
      L.polyline(forecastPoints, {
        color: '#FFC857',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '8 6',
        className: 'flowing-track-polyline',
      }).addTo(overlay)
    }

    // =========================================================================
    // 4. INTERACTIVE INFRASTRUCTURE ASSETS & POPULATION MARKERS
    // =========================================================================
    TWIN_ASSETS.forEach((asset) => {
      const isSelected = selectedAsset?.id === asset.id
      const isExposed = impactFactor > 0.3 && (asset.hazardFocus.includes(hazard) || hazard === 'COMPOSITE')

      // Category Icon Glyph
      let categoryGlyph = '⚡'
      if (asset.category === 'UNDERPASS') categoryGlyph = '🌊'
      else if (asset.category === 'HIGHWAY') categoryGlyph = '🛣️'
      else if (asset.category === 'AVIATION') categoryGlyph = '✈️'
      else if (asset.category === 'HOSPITAL') categoryGlyph = '🏥'
      else if (asset.category === 'AGRICULTURE') categoryGlyph = '🌾'
      else if (asset.category === 'INDUSTRIAL') categoryGlyph = '🏭'
      else if (asset.category === 'COMMUNITY') categoryGlyph = '👥'

      // Severity Color
      const badgeColor =
        asset.vulnerability === 'CRITICAL'
          ? '#FF4D4D'
          : asset.vulnerability === 'HIGH'
          ? '#FF8343'
          : asset.vulnerability === 'MODERATE'
          ? '#FFC857'
          : '#4ADE80'

      const markerHtml = `
        <div class="twin-asset-pin ${isSelected ? 'is-selected' : ''} ${isExposed ? 'is-exposed' : 'is-nominal'} vulnerability-${asset.vulnerability.toLowerCase()}">
          <div class="pin-ring" style="border-color: ${badgeColor}"></div>
          <div class="pin-core" style="background-color: ${badgeColor}">
            <span>${categoryGlyph}</span>
          </div>
          ${isSelected ? '<div class="pin-ping"></div>' : ''}
          ${isExposed ? `<span class="pin-alert-badge" style="background: ${badgeColor}">${asset.vulnerability.slice(0, 1)}</span>` : ''}
        </div>
      `

      const marker = L.marker([asset.lat, asset.lng], {
        icon: L.divIcon({
          className: 'leaflet-twin-asset-marker',
          html: markerHtml,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
        }),
        zIndexOffset: isSelected ? 200 : isExposed ? 100 : 10,
      })

      marker.bindTooltip(
        `<div class="gis-tooltip-box ${isExposed ? 'impact-alert' : ''}">
          <div class="tooltip-header">
            <b>${asset.name}</b>
            <span class="tooltip-badge" style="background: ${badgeColor}">${asset.vulnerability}</span>
          </div>
          <small>${asset.category} · ETA: T+${asset.timeToImpactMin}m</small>
          <div class="tooltip-desc">${asset.impactTitle}</div>
          <div class="tooltip-click-hint">Click to inspect decision brief →</div>
        </div>`,
        { direction: 'top', className: 'gis-custom-tooltip' }
      )

      marker.on('click', () => {
        onSelectAsset(asset)
      })

      marker.addTo(overlay)
    })
  }, [
    hazard,
    activeCell.id,
    activeCell.intensity,
    activeCell.speed,
    activeCell.direction,
    timelineMinute,
    selectedAsset?.id,
    currentStage,
    beforeAfterMode,
    sliderValue,
    basemap,
  ])

  const resetView = () => {
    mapRef.current?.flyTo(defaultCenter, 10, { duration: 1.0 })
  }

  return (
    <div className="adaptive-twin-map-wrapper">
      {/* Top Map Control Strip */}
      <div className="map-toolbar-strip twin-map-strip">
        <div className="toolbar-left">
          <span className="toolbar-label">
            <Compass size={13} />
            <span>ADAPTIVE IMPACT TWIN MAP</span>
          </span>

          <div className="basemap-pills">
            <button
              className={`basemap-btn ${basemap === 'satellite' ? 'active' : ''}`}
              onClick={() => setBasemap('satellite')}
            >
              ESRI SATELLITE
            </button>
            <button
              className={`basemap-btn ${basemap === 'street' ? 'active' : ''}`}
              onClick={() => setBasemap('street')}
            >
              STREET GRID
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {selectedAsset && (
            <div className="selected-asset-chip">
              <span className="dot amber" />
              <span>INSPECTING: <b>{selectedAsset.name}</b></span>
            </div>
          )}

          <button className="map-action-btn" onClick={resetView} title="Reset camera to regional overview">
            <RotateCcw size={12} />
            <span>RESET VIEW</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="map-canvas-container twin-map-canvas" style={{ height }}>
        <div ref={mapHostRef} className="leaflet-storm-container leaflet-map map-svg" />

        {/* Ambient Top Tag */}
        <div className="map-canvas-overlay-header">
          <span className="gis-tag">
            <span className="status-dot green" />
            <span>ADAPTIVE IMPACT TWIN · HIGH RESOLUTION 1–3 KM MESH</span>
          </span>
          <span className="gis-cell-tag">
            HAZARD: <b style={{ color: HAZARD_PROFILES[hazard].color }}>{HAZARD_PROFILES[hazard].name}</b>
          </span>
        </div>

        {/* Before / After Slider Floating Visual Indicator */}
        {beforeAfterMode === 'SLIDER' && (
          <div className="map-slider-overlay-pill">
            <Sliders size={13} />
            <span>COMPARISON: <b>{sliderValue}% IMPACT PREDICTED</b></span>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="map-canvas-overlay-footer twin-overlay-footer">
          <div className="map-legend-pills">
            <span className="legend-item">
              <i className="legend-box" style={{ background: '#FF4D4D', opacity: 0.6 }} />
              <span>Primary Core</span>
            </span>
            <span className="legend-item">
              <i className="legend-box" style={{ background: HAZARD_PROFILES[hazard].color, opacity: 0.4 }} />
              <span>Secondary Risk Swath</span>
            </span>
            <span className="legend-item">
              <i className="legend-line amber" />
              <span>Corridor NH-81</span>
            </span>
            <span className="legend-item">
              <i className="legend-dot red" />
              <span>Critical Asset</span>
            </span>
            <span className="legend-item">
              <i className="legend-dot yellow" />
              <span>High Risk Node</span>
            </span>
          </div>

          <div className="map-scale-readout">
            <span>TAMIL NADU CONVECTIVE BASIN · 15 KM RISK ENVELOPE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
