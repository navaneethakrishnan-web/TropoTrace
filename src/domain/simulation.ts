import type {
  DataSource,
  HazardKey,
  HazardResult,
  ImpactAssets,
  ScenarioDefinition,
  ScenarioKey,
  SimulationSnapshot,
  StormCell,
} from './types'

export const SCENARIOS: ScenarioDefinition[] = [
  { key: 'rapid-thunderstorm', label: 'Rapid Thunderstorm', descriptor: 'Fast intensification / lightning surge', accent: '#ffb547', baseX: 28, baseY: 60, vectorX: 19, vectorY: -10, baseIntensity: 58, intensityGrowth: 34, baseLightning: 42, lightningGrowth: 58, baseRainfall: 48, rainfallGrowth: 64, primaryHazard: 'composite' },
  { key: 'hailstorm', label: 'Hailstorm', descriptor: 'Elevated hail core / strong echo tops', accent: '#9eafff', baseX: 32, baseY: 44, vectorX: 17, vectorY: 4, baseIntensity: 62, intensityGrowth: 24, baseLightning: 34, lightningGrowth: 28, baseRainfall: 38, rainfallGrowth: 33, primaryHazard: 'hail' },
  { key: 'cloudburst', label: 'Cloudburst', descriptor: 'High rainfall accumulation / flash flood', accent: '#4ecbff', baseX: 24, baseY: 68, vectorX: 12, vectorY: -5, baseIntensity: 52, intensityGrowth: 29, baseLightning: 22, lightningGrowth: 22, baseRainfall: 70, rainfallGrowth: 70, primaryHazard: 'cloudburst' },
  { key: 'downburst', label: 'Downburst', descriptor: 'Severe wind / outflow boundary', accent: '#ff7e68', baseX: 39, baseY: 55, vectorX: 22, vectorY: 2, baseIntensity: 64, intensityGrowth: 20, baseLightning: 27, lightningGrowth: 20, baseRainfall: 42, rainfallGrowth: 28, primaryHazard: 'wind' },
  { key: 'initiation', label: 'Rapid Convective Initiation', descriptor: 'New cell forming along convergence', accent: '#d7ff76', baseX: 45, baseY: 72, vectorX: 11, vectorY: -18, baseIntensity: 31, intensityGrowth: 51, baseLightning: 8, lightningGrowth: 82, baseRainfall: 18, rainfallGrowth: 54, primaryHazard: 'lightning' },
  { key: 'multi-cell', label: 'Multi-cell Storm', descriptor: 'Cluster interaction / compound hazard', accent: '#e28cff', baseX: 22, baseY: 53, vectorX: 26, vectorY: -8, baseIntensity: 60, intensityGrowth: 25, baseLightning: 48, lightningGrowth: 42, baseRainfall: 54, rainfallGrowth: 50, primaryHazard: 'rainfall' },
]

const getDefinition = (scenario: ScenarioKey) => SCENARIOS.find((item) => item.key === scenario) ?? SCENARIOS[0]
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const wave = (minute: number, speed = 1, offset = 0) => Math.sin((minute + offset) / 19 * speed)
const round = (value: number) => Math.round(value)

function createPoints(definition: ScenarioDefinition, minute: number, progress: number): { current: { x: number; y: number }; track: { x: number; y: number }[]; forecast: { x: number; y: number }[]; cone: { x: number; y: number }[] } {
  const current = {
    x: definition.baseX + definition.vectorX * progress + wave(minute, 0.7, 7) * 1.8,
    y: definition.baseY + definition.vectorY * progress + wave(minute, 0.55, 3) * 1.1,
  }
  const track = Array.from({ length: 7 }, (_, index) => ({
    x: definition.baseX + definition.vectorX * (index / 6) * progress + wave(index * 9, 0.5) * 1.2,
    y: definition.baseY + definition.vectorY * (index / 6) * progress + wave(index * 9, 0.4, 4) * 1.1,
  }))
  const forecast = Array.from({ length: 7 }, (_, index) => ({
    x: current.x + definition.vectorX * (index / 6) * 0.48,
    y: current.y + definition.vectorY * (index / 6) * 0.48,
  }))
  const cone = [
    { x: current.x - 2.8, y: current.y + 2.8 },
    { x: current.x + definition.vectorX * 0.45 - 5.4, y: current.y + definition.vectorY * 0.45 + 4.2 },
    { x: current.x + definition.vectorX * 0.48 + 5.4, y: current.y + definition.vectorY * 0.48 - 4.2 },
    { x: current.x + 2.8, y: current.y - 2.8 },
  ]
  return { current, track, forecast, cone }
}

const getLifecycle = (intensity: number): StormCell['lifecycle'] => {
  if (intensity < 38) return 'INITIATING'
  if (intensity < 56) return 'DEVELOPING'
  if (intensity < 74) return 'INTENSIFYING'
  if (intensity < 89) return 'MATURE'
  return 'DECAYING'
}

const sourceSet = (minute: number): DataSource[] => {
  const delayed = Math.floor(minute / 26) % 5 === 3
  return [
    { name: 'Doppler Radar', shortName: 'RADAR', status: 'ONLINE', latency: '21 sec', confidence: 93, quality: 'STRONG' },
    { name: 'Geostationary Satellite', shortName: 'SATELLITE', status: 'ONLINE', latency: '2m 14s', confidence: 88, quality: 'STRONG' },
    { name: 'Lightning Network', shortName: 'LIGHTNING', status: 'ONLINE', latency: '11 sec', confidence: 96, quality: 'STRONG' },
    { name: 'AWS / Environmental', shortName: 'AWS', status: 'ONLINE', latency: '38 sec', confidence: 78, quality: 'MODERATE' },
    { name: 'NWP Guidance', shortName: 'NWP', status: delayed ? 'DELAYED' : 'ONLINE', latency: delayed ? '12m 08s' : '4m 50s', confidence: delayed ? 54 : 71, quality: delayed ? 'WEAK' : 'MODERATE', note: delayed ? 'Forecast confidence reduced.' : undefined },
  ]
}

function createCell(definition: ScenarioDefinition, minute: number, index = 0): StormCell {
  const phase = clamp(minute / 95, 0, 1)
  const intensity = clamp(definition.baseIntensity + definition.intensityGrowth * phase + wave(minute, 0.72, index * 15) * 2.4)
  const points = createPoints({ ...definition, baseX: definition.baseX + index * 11, baseY: definition.baseY + index * 6, vectorX: definition.vectorX * (index ? 0.72 : 1), vectorY: definition.vectorY * (index ? 0.7 : 1) }, minute, phase)
  return {
    id: `VX-${index + 1}A7`,
    name: index ? 'CELL-02 / FEEDER' : 'CELL-01 / COIMBATORE',
    centroid: points.current,
    intensity: round(intensity),
    reflectivity: round(clamp(40 + intensity * 0.52)),
    speed: round(18 + intensity * 0.17 + index * 3),
    direction: index ? 'ENE' : 'NE',
    directionDegrees: index ? 62 : 47,
    ageMinutes: round(18 + minute * 0.9 + index * 12),
    lifecycle: getLifecycle(intensity),
    lightningRate: round(clamp(definition.baseLightning + definition.lightningGrowth * phase + wave(minute, 0.8, 4 + index) * 3)),
    rainfallRate: round(clamp(definition.baseRainfall + definition.rainfallGrowth * phase + wave(minute, 0.5, 8 + index) * 4)),
    hailProbability: round(clamp(22 + intensity * 0.54 + (definition.primaryHazard === 'hail' ? 14 : 0))),
    windProbability: round(clamp(24 + intensity * 0.48 + (definition.primaryHazard === 'wind' ? 17 : 0))),
    cloudburstProbability: round(clamp(18 + intensity * 0.48 + (definition.primaryHazard === 'cloudburst' ? 19 : 0))),
    confidence: round(clamp(78 + Math.sin(minute / 15 + index) * 4 - (Math.floor(minute / 26) % 5 === 3 ? 11 : 0))),
    arrivalMinutes: round(Math.max(14, 48 - minute * 0.24 + index * 15)),
    areaKm2: round(120 + intensity * 3.9 + index * 64),
    track: points.track,
    forecast: points.forecast,
    uncertaintyCone: points.cone,
  }
}

const labelForHazard: Record<HazardKey, { label: string; color: string }> = {
  composite: { label: 'Composite risk', color: '#ffb547' },
  lightning: { label: 'Lightning', color: '#f4ed65' },
  hail: { label: 'Hail', color: '#9eafff' },
  wind: { label: 'Wind / downburst', color: '#ff7e68' },
  rainfall: { label: 'Heavy rainfall', color: '#4ecbff' },
  cloudburst: { label: 'Cloudburst', color: '#d7ff76' },
}

function buildHazards(cell: StormCell, definition: ScenarioDefinition): HazardResult[] {
  const composite = clamp(Math.round(cell.intensity * 0.9 + cell.lightningRate * 0.16))
  const values: Record<HazardKey, number> = {
    composite,
    lightning: cell.lightningRate,
    hail: cell.hailProbability,
    wind: cell.windProbability,
    rainfall: clamp(Math.round(cell.rainfallRate * 0.92)),
    cloudburst: cell.cloudburstProbability,
  }
  return (Object.keys(values) as HazardKey[]).map((key) => ({
    key,
    label: labelForHazard[key].label,
    probability: values[key],
    confidence: clamp(cell.confidence - (key === definition.primaryHazard ? -4 : 5)),
    value: key === 'rainfall' ? `${Math.round(cell.rainfallRate)} mm/h` : key === 'wind' ? `${Math.round(32 + cell.intensity * 0.42)} km/h` : `${values[key]}%`,
    trend: values[key] > 72 ? 'RISING' : values[key] > 48 ? 'STABLE' : 'RISING',
    color: labelForHazard[key].color,
  }))
}

function buildImpact(cell: StormCell, modeFactor = 1): ImpactAssets {
  const factor = cell.intensity / 100 * modeFactor
  return {
    population: round(128400 * factor + 32000),
    villages: round(16 + factor * 18),
    schools: round(21 + factor * 24),
    hospitals: round(4 + factor * 6),
    roads: round(8 + factor * 13),
    airports: round(1 + factor * 1),
    substations: round(1 + factor * 4),
    agricultureKm2: round(42 + factor * 62),
    shelters: round(6 + factor * 12),
  }
}

export function createSnapshot(scenario: ScenarioKey, minute: number, modeFactor = 1, selectedCellId?: string): SimulationSnapshot {
  const definition = getDefinition(scenario)
  const normalizedMinute = ((minute % 360) + 360) % 360
  const primary = createCell(definition, normalizedMinute)
  const cells = scenario === 'multi-cell' ? [primary, createCell(definition, normalizedMinute + 17, 1)] : [primary]
  const activeCell = cells.find((c) => c.id === selectedCellId) ?? primary
  const sources = sourceSet(normalizedMinute)
  const consensus = round(sources.reduce((sum, source) => sum + source.confidence, 0) / sources.length)
  const confidence = round(clamp(activeCell.confidence * 0.64 + consensus * 0.36))
  const hazards = buildHazards(activeCell, definition)
  const severe = activeCell.intensity >= 76 || hazards.some((hazard) => hazard.probability >= 82)
  const severity: SimulationSnapshot['severity'] = severe ? 'SEVERE' : activeCell.intensity >= 62 ? 'WARNING' : activeCell.intensity >= 49 ? 'ALERT' : activeCell.intensity >= 35 ? 'WATCH' : 'NORMAL'
  const localDate = new Date(Date.UTC(2026, 9, 3, 11, 34, 0) + normalizedMinute * 60000)
  return {
    scenario,
    scenarioLabel: definition.label,
    minute: normalizedMinute,
    timestamp: localDate.toISOString(),
    cells,
    selectedCellId: activeCell.id,
    hazards,
    sources,
    consensus,
    impact: buildImpact(activeCell, modeFactor),
    severity,
    highRiskAreaKm2: round(activeCell.areaKm2 * (0.38 + activeCell.intensity / 180)),
    nextArrivalMinutes: activeCell.arrivalMinutes,
    confidence,
    lightningTotal: round(activeCell.lightningRate * (1.7 + normalizedMinute / 120)),
    changes: [
      { label: 'Lightning', value: `+${round(31 + activeCell.lightningRate * 0.2)}%`, trend: 'up' },
      { label: 'Reflectivity', value: `+${round(12 + activeCell.intensity * 0.09)}%`, trend: 'up' },
      { label: 'Storm area', value: `+${round(6 + activeCell.areaKm2 / 75)}%`, trend: 'up' },
      { label: 'Wind', value: `+${round(8 + activeCell.intensity * 0.06)} km/h`, trend: 'up' },
      { label: 'Rainfall', value: `+${round(11 + activeCell.rainfallRate * 0.12)} mm/h`, trend: 'up' },
    ],
  }
}

export const formatEta = (minutes: number) => {
  const seconds = Math.max(0, Math.round(minutes * 60))
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const polygonPath = (points: { x: number; y: number }[]) => points.map((point) => `${point.x * 8.8},${point.y * 5.8}`).join(' ')
export const pointPath = (points: { x: number; y: number }[]) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 8.8} ${point.y * 5.8}`).join(' ')
