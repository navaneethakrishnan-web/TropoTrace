export type ViewId =
  | 'command'
  | 'storm'
  | 'hazards'
  | 'impact'
  | 'alerts'
  | 'observatory'
  | 'simulation'
  | 'verification'
  | 'analyst'
  | 'settings'

export type ScenarioKey =
  | 'rapid-thunderstorm'
  | 'hailstorm'
  | 'cloudburst'
  | 'downburst'
  | 'initiation'
  | 'multi-cell'

export type LifecycleStage = 'INITIATING' | 'DEVELOPING' | 'INTENSIFYING' | 'MATURE' | 'DECAYING'
export type Severity = 'NORMAL' | 'WATCH' | 'ALERT' | 'WARNING' | 'SEVERE'
export type Mode = 'EMERGENCY' | 'AVIATION' | 'AGRICULTURE' | 'URBAN'
export type HazardKey = 'composite' | 'lightning' | 'hail' | 'wind' | 'rainfall' | 'cloudburst'
export type LayerKey = 'riskGrid' | 'radar' | 'tracks' | 'lightning' | 'assets' | 'roads'

export interface Point {
  x: number
  y: number
}

export interface StormCell {
  id: string
  name: string
  centroid: Point
  intensity: number
  reflectivity: number
  speed: number
  direction: string
  directionDegrees: number
  ageMinutes: number
  lifecycle: LifecycleStage
  lightningRate: number
  rainfallRate: number
  hailProbability: number
  windProbability: number
  cloudburstProbability: number
  confidence: number
  arrivalMinutes: number
  areaKm2: number
  track: Point[]
  forecast: Point[]
  uncertaintyCone: Point[]
}

export interface DataSource {
  name: string
  shortName: string
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE'
  latency: string
  confidence: number
  quality: 'STRONG' | 'MODERATE' | 'WEAK'
  note?: string
}

export interface ImpactAssets {
  population: number
  villages: number
  schools: number
  hospitals: number
  roads: number
  airports: number
  substations: number
  agricultureKm2: number
  shelters: number
}

export interface HazardResult {
  key: HazardKey
  label: string
  probability: number
  confidence: number
  value: string
  trend: 'RISING' | 'STABLE' | 'FALLING'
  color: string
}

export interface SimulationSnapshot {
  scenario: ScenarioKey
  scenarioLabel: string
  minute: number
  timestamp: string
  cells: StormCell[]
  selectedCellId: string
  hazards: HazardResult[]
  sources: DataSource[]
  consensus: number
  impact: ImpactAssets
  severity: Severity
  highRiskAreaKm2: number
  nextArrivalMinutes: number
  confidence: number
  lightningTotal: number
  changes: { label: string; value: string; trend: 'up' | 'down' | 'flat' }[]
}

export interface ScenarioDefinition {
  key: ScenarioKey
  label: string
  descriptor: string
  accent: string
  baseX: number
  baseY: number
  vectorX: number
  vectorY: number
  baseIntensity: number
  intensityGrowth: number
  baseLightning: number
  lightningGrowth: number
  baseRainfall: number
  rainfallGrowth: number
  primaryHazard: HazardKey
}
