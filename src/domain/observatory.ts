import type { RawObservationRecord, SimulationSnapshot } from './types'

export function getRawObservations(snapshot: SimulationSnapshot): RawObservationRecord[] {
  const cell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]
  const time = snapshot.timestamp.slice(11, 19) + ' UTC'
  const lat = (13.6 - cell.centroid.y * 0.045).toFixed(3)
  const lon = (74.8 + cell.centroid.x * 0.045).toFixed(3)
  const coord = `${lat}°N, ${lon}°E`

  return [
    {
      id: 'REC-DWR-01',
      source: 'Doppler Weather Radar (S-Band)',
      variable: 'Equivalent Radar Reflectivity (Z)',
      value: cell.reflectivity,
      unit: 'dBZ',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-DWR-02',
      source: 'Doppler Weather Radar (S-Band)',
      variable: 'Radial Velocity (Vr)',
      value: (cell.speed * 0.278).toFixed(1),
      unit: 'm/s',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-SAT-01',
      source: 'INSAT-3D/3DR Geostationary',
      variable: 'TIR-1 Brightness Temperature (BT)',
      value: Math.round(-38 - cell.intensity * 0.35),
      unit: '°C',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-SAT-02',
      source: 'INSAT-3D/3DR Geostationary',
      variable: 'Water Vapor Channel (6.8 µm)',
      value: Math.min(99, Math.round(62 + cell.intensity * 0.38)),
      unit: '%',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-GLDN-01',
      source: 'Ground Lightning Detection Network',
      variable: 'Total Lightning Flash Rate',
      value: cell.lightningRate,
      unit: 'flashes/min',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-AWS-01',
      source: 'Surface Automatic Weather Station',
      variable: 'Surface Pressure Drop (ΔP / 15m)',
      value: (-(1.2 + cell.intensity * 0.03)).toFixed(1),
      unit: 'hPa',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-AWS-02',
      source: 'Surface Automatic Weather Station',
      variable: 'Estimated Surface Wind Gust',
      value: Math.round(34 + cell.intensity * 0.48),
      unit: 'km/h',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-NWP-01',
      source: 'NCMRWF Unified Model Guidance',
      variable: 'Convective Available Potential Energy (CAPE)',
      value: Math.round(1800 + cell.intensity * 16),
      unit: 'J/kg',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
    {
      id: 'REC-NWP-02',
      source: 'NCMRWF Unified Model Guidance',
      variable: 'Vertically Integrated Liquid (VIL)',
      value: (24 + cell.intensity * 0.42).toFixed(1),
      unit: 'kg/m²',
      status: 'SYNTHETIC',
      timestamp: time,
      coordinates: coord,
    },
  ]
}

export interface PipelineStage {
  step: string
  name: string
  description: string
  status: 'IMPLEMENTED' | 'SIMULATED' | 'PROPOSED'
  active: boolean
  inputs: string[]
  outputs: string[]
}

export function getDataPipelineStages(): PipelineStage[] {
  return [
    {
      step: '01',
      name: 'Synthetic Sensor Ingestion',
      description: 'Ingests multi-modal radar reflectivity, satellite IR, lightning flashes, and surface AWS data packets.',
      status: 'SIMULATED',
      active: true,
      inputs: ['DWR dBZ stream', 'INSAT IR BT', 'GLDN RF pulses', 'Surface AWS'],
      outputs: ['Normalized observation tensor'],
    },
    {
      step: '02',
      name: 'Quality Control & Consensus',
      description: 'Evaluates stream latency, missing frames, and consensus agreement; dynamically triggers degradation protocol.',
      status: 'IMPLEMENTED',
      active: true,
      inputs: ['Normalized observation tensor'],
      outputs: ['Consensus score (0–100%)', 'Sensor health map'],
    },
    {
      step: '03',
      name: 'Convective Cell Identification & Tracking (TITAN/SCIT)',
      description: 'Isolates storm centroids, tracks 3D centroids, estimates storm vector velocity and lifecycle stage.',
      status: 'SIMULATED',
      active: true,
      inputs: ['Consensus score', 'Radar core clusters'],
      outputs: ['StormCell state (VX-01)', '0–6h Projected Trajectory', 'Uncertainty Cone'],
    },
    {
      step: '04',
      name: 'Probabilistic Multi-Hazard Nowcasting',
      description: 'Calculates 1–3 km grid probability fields for lightning jumps, hail cores, extreme rain, and downbursts.',
      status: 'SIMULATED',
      active: true,
      inputs: ['StormCell state', 'CAPE / VIL / Shear'],
      outputs: ['Hazard probabilities', 'High-risk area polygon'],
    },
    {
      step: '05',
      name: 'Impact Corridor & Asset Exposure Engine',
      description: 'Intersects storm trajectory with critical infrastructure layers (airports, hospitals, roads, population).',
      status: 'SIMULATED',
      active: true,
      inputs: ['Uncertainty Cone', 'Spatial Infrastructure GIS'],
      outputs: ['Exposed population', 'Critical asset counts', 'Route risk profile'],
    },
    {
      step: '06',
      name: 'Decision Support & Multi-Language Warning Dispatch',
      description: 'Formats evidence-backed CAP alerts in 8 Indian languages with text-to-speech and print synthesis.',
      status: 'IMPLEMENTED',
      active: true,
      inputs: ['Hazard fields', 'Impact counts'],
      outputs: ['Alert bulletins', 'CAP XML/JSON', 'Audio broadcasts'],
    },
  ]
}

export interface ProposedIntegration {
  name: string
  agency: string
  protocol: string
  targetStatus: 'PROPOSED'
  notes: string
}

export const PROPOSED_INTEGRATIONS: ProposedIntegration[] = [
  {
    name: 'IMD Doppler Weather Radar Network (S-Band / C-Band)',
    agency: 'India Meteorological Department (IMD)',
    protocol: 'REST / NetCDF-4 / HDF5',
    targetStatus: 'PROPOSED',
    notes: 'Operational Doppler feeds from Kochi, Karaikal, and Chennai radars for real-time volumetric scans.',
  },
  {
    name: 'MOSDAC INSAT-3D / 3DR Geostationary Imagery',
    agency: 'Space Applications Centre (ISRO / SAC)',
    protocol: 'WMS / GeoTIFF / OGC API',
    targetStatus: 'PROPOSED',
    notes: 'Rapid-scan 4km Thermal Infrared (TIR) and Water Vapor channels for deep convective cloud-top tracking.',
  },
  {
    name: 'Damini / IITM Lightning Detection Network',
    agency: 'Indian Institute of Tropical Meteorology (IITM)',
    protocol: 'WebSocket / GeoJSON feed',
    targetStatus: 'PROPOSED',
    notes: 'Sub-minute ground and cloud-to-ground lightning flash strikes across the southern peninsula.',
  },
  {
    name: 'NCMRWF Unified Model (NCUM) Regional High-Res NWP',
    agency: 'National Centre for Medium Range Weather Forecasting (NCMRWF)',
    protocol: 'GRIB2 / S3 Object Store',
    targetStatus: 'PROPOSED',
    notes: 'Convection-permitting 1.5 km regional NWP initialization for 0–6 hour thermodynamic background state.',
  },
]
