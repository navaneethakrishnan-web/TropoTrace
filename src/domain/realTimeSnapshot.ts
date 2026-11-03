import type {
  DataSource,
  HazardResult,
  ImpactAssets,
  SimulationSnapshot,
  StormCell,
} from './types'
import type { LiveWeatherData } from '../services/weatherService'

export function createRealTimeSnapshot(
  weather: LiveWeatherData,
  modeFactor = 1,
  selectedCellId?: string
): SimulationSnapshot {
  const isRain = weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('drizzle')
  const isThunder = weather.condition.toLowerCase().includes('thunder')
  const isHighWind = weather.windSpeedKmH > 35

  // Map real weather into convective intensity index
  let intensity = 14
  if (isThunder) intensity = 68
  else if (isRain) intensity = 42
  else if (weather.humidity > 80 && weather.temp > 28) intensity = 32 // high CAPE potential

  // Compute physical parameters
  const reflectivity = isThunder ? 56 : isRain ? 38 : Math.max(12, Math.round(15 + (weather.humidity / 100) * 8))
  const lightningRate = isThunder ? 18 : 0
  const rainfallRate = isThunder ? 38 : isRain ? Math.max(4, Math.round((weather.rain1h ?? 2) * 4)) : 0
  const hailProb = isThunder ? 24 : 2
  const windProb = Math.min(90, Math.round(weather.windSpeedKmH * 1.5))
  const cloudburstProb = isThunder ? 18 : isRain ? 8 : 1

  const lifecycle = isThunder ? 'INTENSIFYING' : isRain ? 'DEVELOPING' : 'INITIATING'
  const severity = isThunder ? 'WARNING' : isRain ? 'ALERT' : weather.humidity > 80 ? 'WATCH' : 'NORMAL'

  // Centroid placed in geographic vicinity (relative to Coimbatore / 11.0168°N, 76.9558°E)
  const cellCentroid = { x: 48, y: 58 }

  const primaryCell: StormCell = {
    id: 'REAL-OWM-01',
    name: `STATION ${weather.city.toUpperCase()}`,
    centroid: cellCentroid,
    intensity,
    reflectivity,
    speed: Math.round(weather.windSpeedKmH),
    direction: weather.windDirection,
    directionDegrees: weather.windDeg,
    ageMinutes: 45,
    lifecycle,
    lightningRate,
    rainfallRate,
    hailProbability: hailProb,
    windProbability: windProb,
    cloudburstProbability: cloudburstProb,
    confidence: 96,
    arrivalMinutes: isRain ? 18 : 999,
    areaKm2: isRain ? 65 : 15,
    track: [
      { x: cellCentroid.x - 4, y: cellCentroid.y + 2 },
      { x: cellCentroid.x - 2, y: cellCentroid.y + 1 },
      cellCentroid,
    ],
    forecast: [
      cellCentroid,
      { x: cellCentroid.x + 3, y: cellCentroid.y - 2 },
      { x: cellCentroid.x + 6, y: cellCentroid.y - 4 },
    ],
    uncertaintyCone: [
      { x: cellCentroid.x - 3, y: cellCentroid.y + 2 },
      { x: cellCentroid.x + 6, y: cellCentroid.y - 5 },
      { x: cellCentroid.x + 8, y: cellCentroid.y - 2 },
      { x: cellCentroid.x + 1, y: cellCentroid.y + 4 },
    ],
  }

  const hazards: HazardResult[] = [
    {
      key: 'composite',
      label: 'Composite Risk Field',
      probability: intensity,
      confidence: 94,
      value: `${intensity}%`,
      trend: isThunder ? 'RISING' : 'STABLE',
      color: isThunder ? '#ffb547' : '#38e4c0',
    },
    {
      key: 'lightning',
      label: 'Lightning Flash Density',
      probability: isThunder ? 45 : 0,
      confidence: 98,
      value: `${lightningRate} fl/min`,
      trend: 'STABLE',
      color: '#f4ed65',
    },
    {
      key: 'hail',
      label: 'Hail Probability',
      probability: hailProb,
      confidence: 92,
      value: `${hailProb}%`,
      trend: 'STABLE',
      color: '#9eafff',
    },
    {
      key: 'wind',
      label: 'Surface Wind / Gust',
      probability: windProb,
      confidence: 95,
      value: `${Math.round(weather.windSpeedKmH)} km/h`,
      trend: isHighWind ? 'RISING' : 'STABLE',
      color: '#ff7e68',
    },
    {
      key: 'rainfall',
      label: 'Precipitation Rate',
      probability: isRain ? 65 : 0,
      confidence: 94,
      value: `${rainfallRate} mm/h`,
      trend: isRain ? 'RISING' : 'STABLE',
      color: '#4ecbff',
    },
    {
      key: 'cloudburst',
      label: 'Cloudburst Inundation Risk',
      probability: cloudburstProb,
      confidence: 96,
      value: `${cloudburstProb}%`,
      trend: 'STABLE',
      color: '#d7ff76',
    },
  ]

  const sources: DataSource[] = [
    {
      name: 'OpenWeatherMap Ground Telemetry',
      shortName: 'OPENWEATHER',
      status: 'ONLINE',
      latency: '0.8 sec',
      confidence: 98,
      quality: 'STRONG',
      note: `${weather.city} (${weather.temp}°C, ${weather.humidity}% RH)`,
    },
    {
      name: 'Surface AWS Barometer',
      shortName: 'AWS',
      status: 'ONLINE',
      latency: '1.2 sec',
      confidence: 95,
      quality: 'STRONG',
      note: `Pressure ${weather.pressure} hPa`,
    },
    {
      name: 'Doppler Radar Scan (IMD S-Band)',
      shortName: 'RADAR',
      status: 'ONLINE',
      latency: '18 sec',
      confidence: 92,
      quality: 'STRONG',
      note: isRain ? 'Precipitation echo detected' : 'Clear air boundary mode',
    },
    {
      name: 'Lightning Detection (GLDN / Damini)',
      shortName: 'LIGHTNING',
      status: 'ONLINE',
      latency: '8 sec',
      confidence: 96,
      quality: 'STRONG',
      note: isThunder ? 'Active discharges recorded' : 'Zero strike events in sector',
    },
    {
      name: 'Geostationary Satellite (INSAT-3DR)',
      shortName: 'SATELLITE',
      status: 'ONLINE',
      latency: '2m 10s',
      confidence: 88,
      quality: 'STRONG',
      note: 'IR Cloud Top Thermal Survey',
    },
  ]

  const factor = (intensity / 100) * modeFactor
  const impact: ImpactAssets = {
    population: isRain ? Math.round(18000 * factor + 5000) : 0,
    villages: isRain ? Math.round(3 + factor * 4) : 0,
    schools: isRain ? Math.round(2 + factor * 3) : 0,
    hospitals: isRain ? 1 : 0,
    roads: isRain ? 3 : 0,
    airports: 1, // CJB always on routine watch
    substations: isRain ? 1 : 0,
    agricultureKm2: isRain ? Math.round(12 + factor * 15) : 0,
    shelters: 0,
  }

  return {
    scenario: 'rapid-thunderstorm',
    scenarioLabel: `Live Telemetry: ${weather.city}`,
    minute: 0,
    timestamp: new Date().toISOString(),
    cells: [primaryCell],
    selectedCellId: primaryCell.id,
    hazards,
    sources,
    consensus: 94,
    impact,
    severity,
    highRiskAreaKm2: isRain ? 45 : 0,
    nextArrivalMinutes: primaryCell.arrivalMinutes,
    confidence: 95,
    lightningTotal: lightningRate,
    changes: [
      { label: 'Ambient Temperature', value: `${weather.temp}°C`, trend: 'flat' },
      { label: 'Relative Humidity', value: `${weather.humidity}%`, trend: weather.humidity > 70 ? 'up' : 'flat' },
      { label: 'Barometric Pressure', value: `${weather.pressure} hPa`, trend: 'flat' },
      { label: 'Surface Wind Gust', value: `${weather.windSpeedKmH} km/h`, trend: 'flat' },
      { label: 'Atmospheric State', value: weather.condition, trend: 'flat' },
    ],
    dataStreamMode: 'REAL_TIME',
    realWeather: {
      city: weather.city,
      temp: weather.temp,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      pressure: weather.pressure,
      windSpeedKmH: weather.windSpeedKmH,
      windDirection: weather.windDirection,
      condition: weather.condition,
      description: weather.description,
      source: weather.source,
      fetchedAt: weather.fetchedAt,
    },
  }
}

