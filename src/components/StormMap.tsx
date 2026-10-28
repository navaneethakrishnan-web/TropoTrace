import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Layers3,
  MapPin,
  Navigation,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { LayerKey, StormCell } from '../domain/types'

interface StormMapProps {
  showImpactCorridor?: boolean
  highlightHazard?: boolean
  height?: string
}

export function StormMap({ showImpactCorridor = false, highlightHazard = false, height = '560px' }: StormMapProps) {
  const {
    snapshot,
    phenomenon,
    isStreaming,
    selectedCellId,
    setSelectedCellId,
    investigateStorm,
    settings,
  } = useApp()

  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const [basemap, setBasemap] = useState<'satellite' | 'street'>(settings.basemap || 'satellite')
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    riskGrid: true,
    radar: true,
    tracks: true,
    lightning: true,
    assets: true,
    roads: true,
  })

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'FOUND' | 'DENIED'>('IDLE')

  const activeCell = snapshot.cells.find((c) => c.id === selectedCellId) ?? snapshot.cells[0]

  // Convert normalized scenario coordinate to geographic latitude/longitude in South India
  const toLatLng = (point: { x: number; y: number }): [number, number] => [
    13.6 - point.y * 0.045,
    74.8 + point.x * 0.045,
  ]

  const toggleLayer = (key: LayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Geolocation handler
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('DENIED')
      return
    }
    setLocationStatus('LOCATING')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next: [number, number] = [coords.latitude, coords.longitude]
        setUserLocation(next)
        setLocationStatus('FOUND')
        mapRef.current?.flyTo(next, 10, { duration: 1.2 })
      },
      () => setLocationStatus('DENIED'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Initialize Map
  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return

    const initialCenter = toLatLng(activeCell.centroid)
    const map = L.map(mapHostRef.current, {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true,
    }).setView(initialCenter, 8)

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

  // Reset view to active cell
  const resetView = () => {
    const map = mapRef.current
    if (!map) return
    map.flyTo(toLatLng(activeCell.centroid), 9, { duration: 1.0 })
  }

  // Render Overlays
  useEffect(() => {
    const map = mapRef.current
    const overlay = overlayRef.current
    if (!map || !overlay) return

    overlay.clearLayers()

    const domainCenter = toLatLng(activeCell.centroid)
    const center = userLocation ?? domainCenter
    const shift: [number, number] = [center[0] - domainCenter[0], center[1] - domainCenter[1]]

    const placePoint = (point: { x: number; y: number }): [number, number] => {
      const ll = toLatLng(point)
      return [ll[0] + shift[0], ll[1] + shift[1]]
    }

    const cssIcon = (className: string, content = '', size = 48) => {
      const defaultSize = className.includes('storm-twin')
        ? 100
        : className.includes('lightning') ||
          className.includes('cloudburst') ||
          className.includes('downburst')
        ? 64
        : size
      return L.divIcon({
        className: `leaflet-vajra-icon ${className}`,
        html: content,
        iconSize: [defaultSize, defaultSize],
        iconAnchor: [defaultSize / 2, defaultSize / 2],
      })
    }

    // 1. Radar Overlay (Rotating Doppler S-Band Sweep & Breathing Core)
    if (layers.radar) {
      // Rotating Doppler S-Band Sweep Arc and Range Rings
      const radarSweepHtml = `
        <div class="radar-station-container ${isStreaming ? 'active-scan' : 'idle-scan'}">
          <div class="radar-sweep-beam"></div>
          <div class="radar-range-ring ring-1"></div>
          <div class="radar-range-ring ring-2"></div>
          <div class="radar-range-ring ring-3"></div>
          <div class="radar-station-center">
            <span class="station-core"></span>
          </div>
        </div>
      `
      L.marker(center, {
        icon: L.divIcon({
          className: 'leaflet-radar-sweep-marker',
          html: radarSweepHtml,
          iconSize: [280, 280],
          iconAnchor: [140, 140],
        }),
        interactive: false,
        zIndexOffset: -80,
      }).addTo(overlay)

      // Outer storm boundary with 3D breathing animation
      L.circle(center, {
        radius: 28000,
        color: '#3dc8cf',
        weight: 1.2,
        opacity: 0.45,
        fillColor: '#194f67',
        fillOpacity: 0.14,
        className: 'radar-field',
      }).addTo(overlay)

      // Severe convective core with throbbing 3D pulse
      L.circle(center, {
        radius: 12000 + activeCell.intensity * 120,
        color: '#ffb547',
        weight: 1.3,
        opacity: 0.65,
        fillColor: '#ff705e',
        fillOpacity: 0.18,
        className: 'radar-core',
      }).addTo(overlay)
    }

    // 2. Tracks & Animated Flowing Convective Trajectory Vectors
    if (layers.tracks) {
      const trackLatLngs = activeCell.track.map(placePoint)
      const forecastLatLngs = activeCell.forecast.map(placePoint)

      // Historical track (Observed / Past)
      L.polyline(trackLatLngs, {
        color: '#56CFFF',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8 8',
      }).addTo(overlay)

      // Projected track (Forecast 0–6h with flowing animated energy particles)
      L.polyline(forecastLatLngs, {
        color: '#FFC857',
        weight: 4,
        opacity: 0.95,
        dashArray: '10 8',
        className: 'flowing-track-polyline',
      }).addTo(overlay)

      // Flowing directional chevrons along forecast track showing movement vector
      if (forecastLatLngs.length > 1) {
        for (let i = 0; i < forecastLatLngs.length - 1; i++) {
          const p1 = forecastLatLngs[i]
          const p2 = forecastLatLngs[i + 1]
          const midLat = (p1[0] + p2[0]) / 2
          const midLng = (p1[1] + p2[1]) / 2
          const angleDeg = (Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180) / Math.PI
          L.marker([midLat, midLng], {
            icon: L.divIcon({
              className: 'leaflet-track-particle-marker',
              html: `<span class="track-flow-arrow" style="transform: rotate(${90 - angleDeg}deg)">›</span>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            }),
            interactive: false,
          }).addTo(overlay)
        }
      }

      // Uncertainty corridor cone / Animated Impact Swath
      const conePoints = activeCell.uncertaintyCone.map(placePoint)
      L.polygon(conePoints, {
        color: '#FFC857',
        weight: showImpactCorridor ? 2 : 1.2,
        dashArray: '6 6',
        fillColor: '#FFC857',
        fillOpacity: showImpactCorridor ? 0.28 : 0.14,
        className: showImpactCorridor ? 'animated-impact-corridor-polygon' : '',
      }).addTo(overlay)
    }

    // 3. Roads & Arterial Corridors
    if (layers.roads) {
      const roadSegments: L.LatLngExpression[][] = [
        // NH-81 Coimbatore to Tiruppur to Erode
        [
          [10.95, 76.12],
          [11.02, 76.55],
          [11.08, 76.96],
          [11.12, 77.34],
          [11.34, 77.72],
          [11.66, 78.14],
        ],
        // NH-544 / Bypass
        [
          [10.65, 76.7],
          [10.92, 76.95],
          [11.28, 77.16],
          [11.55, 77.7],
        ],
        // Mettupalayam corridor
        [
          [11.02, 76.96],
          [11.3, 76.94],
          [11.42, 76.7],
        ],
      ]
      roadSegments.forEach((road) => {
        L.polyline(road, {
          color: '#84B4A8',
          weight: 2,
          opacity: 0.38,
        }).addTo(overlay)
      })
    }

    // 4. Critical Assets Markers (Illuminated when in impact zone)
    if (layers.assets) {
      const keyAssets: [number, number, string, string][] = [
        [11.0168, 76.9558, 'COIMBATORE METRO', 'URBAN'],
        [11.1085, 77.3411, 'TIRUPPUR NORTH', 'INDUSTRIAL'],
        [11.341, 77.7172, 'ERODE JUNCTION', 'TRANSPORT'],
        [10.9287, 77.0434, 'COIMBATORE INTL AIRPORT (CJB)', 'AVIATION'],
        [11.028, 76.938, 'GOVT MEDICAL COLLEGE HOSPITAL', 'HOSPITAL'],
        [11.085, 77.21, 'PALLADAM 400KV SUBSTATION', 'GRID'],
      ]

      keyAssets.forEach(([lat, lng, name, type]) => {
        const isImpacted = showImpactCorridor && (lat >= 10.9 && lat <= 11.35 && lng >= 76.9 && lng <= 77.4)
        const marker = L.marker([lat, lng], {
          icon: cssIcon(
            `asset-gis-marker ${isImpacted ? 'asset-intersected-pulse' : ''}`,
            `<span class="asset-type-badge">${type.slice(0, 1)}</span>${isImpacted ? '<span class="asset-alert-ring"></span>' : ''}`,
            34
          ),
        })
        marker.bindTooltip(
          `<div class="gis-tooltip-box ${isImpacted ? 'impact-alert' : ''}">
            <b>${name}</b>
            <small>CRITICAL ASSET · ${type}</small>
            ${isImpacted ? '<div class="impact-warning-tag">⚠ DIRECT CORRIDOR INTERSECTION</div>' : ''}
          </div>`,
          { direction: 'top', className: 'gis-custom-tooltip' }
        )
        marker.addTo(overlay)
      })
    }

    // 5. Risk Grid Outline
    if (layers.riskGrid) {
      const bounds = L.latLngBounds(
        [center[0] - 0.75, center[1] - 0.75],
        [center[0] + 0.75, center[1] + 0.75]
      )
      L.rectangle(bounds, {
        color: '#38E4C0',
        weight: 1,
        opacity: 0.3,
        fill: false,
        dashArray: '4 8',
      }).addTo(overlay)
    }

    // 6. User Current Location Ring & Pulsing 3D Pin
    if (userLocation) {
      L.circle(userLocation, {
        radius: 650,
        color: '#65f2d2',
        weight: 2,
        opacity: 0.85,
        fillColor: '#65f2d2',
        fillOpacity: 0.12,
        className: 'user-location-ring',
      }).addTo(overlay)

      L.marker(userLocation, {
        icon: cssIcon('user-location-marker', '<span>⌖</span>'),
      })
        .bindTooltip('<b>YOUR CURRENT LOCATION</b>', { direction: 'top', className: 'gis-custom-tooltip' })
        .addTo(overlay)
    }

    // 7. Active 3D Gold Energy Lightning Strokes
    if (layers.lightning && (phenomenon === 'ALL' || phenomenon === 'LIGHTNING')) {
      Array.from({ length: 4 }, (_, index) => {
        const angle = index * (Math.PI / 2)
        const lat = center[0] + Math.sin(angle) * 0.018
        const lng = center[1] + Math.cos(angle) * 0.022
        return L.marker([lat, lng], {
          icon: cssIcon(
            'lightning-marker',
            `<span class="gold-lightning-line lightning-line-${index + 1}"></span>`
          ),
        }).addTo(overlay)
      })
    }

    // 8. Phenomenon-Specific 3D Indicators (Hail, Cloudburst, Downburst)
    if (phenomenon === 'HAIL') {
      Array.from({ length: 24 }, (_, index) =>
        L.marker(
          [
            center[0] + 0.03 - (index % 6) * 0.01,
            center[1] - 0.025 + Math.floor(index / 6) * 0.011,
          ],
          {
            icon: cssIcon('hail-marker', '<span class="hail-glyph">●</span>'),
          }
        ).addTo(overlay)
      )
    } else if (phenomenon === 'CLOUDBURST') {
      L.marker(center, {
        icon: cssIcon('cloudburst-marker', '<span class="cloudburst-glyph">☔</span>'),
      }).addTo(overlay)
    } else if (phenomenon === 'DOWNBURST') {
      Array.from({ length: 8 }, (_, index) =>
        L.marker(
          [
            center[0] + Math.sin(index) * 0.018,
            center[1] + Math.cos(index) * 0.025,
          ],
          {
            icon: cssIcon('downburst-marker', '<span class="downburst-glyph">↘</span>'),
          }
        ).addTo(overlay)
      )
    }

    // 9. All Storm Cells with 3D Billowing Twin-Cloud & Throbbing Core
    snapshot.cells.forEach((cellItem) => {
      const cellPos = placePoint(cellItem.centroid)
      const isSelected = cellItem.id === selectedCellId

      const stormVisual =
        phenomenon === 'CLOUDBURST'
          ? '<div class="storm-twin-cloud cloud-a"></div><div class="storm-twin-cloud cloud-b"></div><div class="storm-rain-curtain"></div><div class="storm-twin-core rain-core"></div>'
          : phenomenon === 'HAIL'
          ? '<div class="storm-twin-cloud cloud-a hail-cloud"></div><div class="storm-twin-cloud cloud-b hail-cloud"></div><div class="storm-hail-core">•••</div><div class="storm-twin-core hail-core"></div>'
          : phenomenon === 'DOWNBURST'
          ? '<div class="storm-twin-cloud cloud-a wind-cloud"></div><div class="storm-twin-cloud cloud-b wind-cloud"></div><div class="storm-wind-ring"></div><div class="storm-twin-core wind-core"></div>'
          : '<div class="storm-twin-cloud cloud-a"></div><div class="storm-twin-cloud cloud-b"></div><div class="storm-gold-burst"><i></i><i></i><i></i><i></i></div><div class="storm-twin-core"></div>'

      const reticleVisual = isSelected
        ? '<div class="selected-cell-reticle"><span class="reticle-ring"></span><span class="reticle-cross-h"></span><span class="reticle-cross-v"></span><span class="reticle-ping"></span></div>'
        : ''

      const marker = L.marker(cellPos, {
        icon: cssIcon(
          `storm-twin-marker storm-twin-${phenomenon.toLowerCase()} ${isSelected ? 'selected' : ''}`,
          `${stormVisual}${reticleVisual}<b>${cellItem.id}</b>`
        ),
      })

      marker.bindTooltip(
        `<div class="gis-tooltip-box">
          <b>${cellItem.name} (${cellItem.id})</b>
          <div>Stage: <strong>${cellItem.lifecycle}</strong> · Intensity: <strong>${cellItem.intensity}%</strong></div>
          <div>Moving: <strong>${cellItem.direction} at ${cellItem.speed} km/h</strong></div>
          <small>Click to inspect storm intelligence</small>
        </div>`,
        { direction: 'top', className: 'gis-custom-tooltip' }
      )

      marker.on('click', () => {
        setSelectedCellId(cellItem.id)
        investigateStorm(cellItem.id)
      })

      marker.addTo(overlay)
    })
  }, [
    snapshot.scenario,
    snapshot.minute,
    selectedCellId,
    layers,
    phenomenon,
    userLocation,
    showImpactCorridor,
    isStreaming,
  ])

  return (
    <div className="storm-map-wrapper">
      {/* Top Map Toolbar: Basemap + Location + Layer Status */}
      <div className="map-toolbar-strip">
        <div className="toolbar-left">
          <span className="toolbar-label">
            <MapPin size={12} />
            <span>BASEMAP</span>
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
              STREET MAP
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <button
            className={`location-btn ${locationStatus === 'FOUND' ? 'active' : ''}`}
            onClick={requestLocation}
            title="Locate my position on the storm radar"
          >
            <Navigation size={12} />
            <span>
              {locationStatus === 'LOCATING'
                ? 'LOCATING…'
                : locationStatus === 'FOUND'
                ? 'LOCATION LOCKED'
                : 'MY LOCATION'}
            </span>
          </button>

          <button
            className="map-action-btn"
            onClick={resetView}
            title="Reset view to active storm core"
          >
            <RotateCcw size={12} />
            <span>FOCUS STORM</span>
          </button>
        </div>
      </div>

      {/* Map Host Canvas */}
      <div className={`map-canvas-container real-gis-stage phenomenon-${phenomenon.toLowerCase()} scenario-run-${snapshot.scenario} ${isStreaming ? 'is-streaming' : ''}`} style={{ height }}>
        <div ref={mapHostRef} className="leaflet-storm-container leaflet-map map-svg" />

        {/* Ambient Map Header Overlay */}
        <div className="map-canvas-overlay-header">
          <span className="gis-tag">
            <span className="status-dot green" />
            <span>REAL GIS · 1–3 KM NOWCAST GRID</span>
          </span>
          <span className="gis-cell-tag">
            ACTIVE CELL: <b>{activeCell.id}</b> ({activeCell.direction} · {activeCell.speed} km/h)
          </span>
          <div className="radar-live-scan-badge">
            <span className="scan-radar-blip"></span>
            <span>RADAR: 0.5° S-BAND · 12 RPM</span>
          </div>
        </div>

        {/* Interactive Map Layers Drawer */}
        <div className="map-layers-floating-panel">
          <div className="layers-panel-header">
            <Layers3 size={13} />
            <span>MAP LAYERS</span>
          </div>
          <div className="layers-toggle-list">
            {(
              [
                ['radar', 'Radar Reflectivity (Z)'],
                ['tracks', 'Projected Trajectory'],
                ['riskGrid', 'Hazard Grid (1 km)'],
                ['lightning', 'Lightning Flashes'],
                ['assets', 'Critical Assets'],
                ['roads', 'Highway Network'],
              ] as [LayerKey, string][]
            ).map(([key, label]) => (
              <label key={key} className="layer-toggle-row">
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={() => toggleLayer(key)}
                />
                <span className="toggle-switch" />
                <span className="toggle-label">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bottom Legend & Scale */}
        <div className="map-canvas-overlay-footer">
          <div className="map-legend-pills">
            <span className="legend-item">
              <i className="legend-line cyan" />
              <span>Past Track</span>
            </span>
            <span className="legend-item">
              <i className="legend-line amber" />
              <span>Projected Path</span>
            </span>
            <span className="legend-item">
              <i className="legend-box amber-fill" />
              <span>Uncertainty Cone</span>
            </span>
            <span className="legend-item">
              <i className="legend-dot red" />
              <span>Severe Core (&gt;55 dBZ)</span>
            </span>
          </div>

          <div className="map-scale-readout">
            <span>SCALE: ~1:250,000 · TAMIL NADU</span>
          </div>
        </div>
      </div>
    </div>
  )
}
