import type { SimulationSnapshot, StormCell } from './types'
import { formatEta } from './simulation'
import { fetchLiveWeather, extractCityFromQuery, type LiveWeatherData } from '../services/weatherService'

export interface PromptTemplate {
  category: 'STORM' | 'HAZARDS' | 'IMPACT' | 'OBSERVATORY' | 'VERIFICATION' | 'WEATHER'
  question: string
  shortLabel: string
}

export const SUGGESTED_PROMPTS: PromptTemplate[] = [
  { category: 'WEATHER', question: 'What is the current real-world temperature, humidity, and weather in Coimbatore?', shortLabel: 'Current live temperature' },
  { category: 'STORM', question: 'Explain the selected storm cell and its current lifecycle state.', shortLabel: 'Explain cell lifecycle' },
  { category: 'STORM', question: 'Why is this cell classified as severe?', shortLabel: 'Why severe rating?' },
  { category: 'STORM', question: 'What changed in this storm over the last 15 minutes?', shortLabel: 'What changed recently?' },
  { category: 'HAZARDS', question: 'What hazards are active, and what evidence triggers them?', shortLabel: 'Active hazards & triggers' },
  { category: 'HAZARDS', question: 'Will Coimbatore or Tiruppur experience cloudburst conditions?', shortLabel: 'Cloudburst risk assessment' },
  { category: 'IMPACT', question: 'What critical infrastructure and population are in the projected path?', shortLabel: 'Exposed assets & corridor' },
  { category: 'OBSERVATORY', question: 'What is the multi-source data agreement and are any sensors delayed?', shortLabel: 'Sensor health & consensus' },
  { category: 'VERIFICATION', question: 'How is model skill verified and what are the known uncertainties?', shortLabel: 'Verification metrics & limits' },
]

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-120b'

function buildSystemPrompt(snapshot: SimulationSnapshot, cell: StormCell, liveWeather: LiveWeatherData): string {
  const etaStr = formatEta(cell.arrivalMinutes)
  const delayedSource = snapshot.sources.find((s) => s.status !== 'ONLINE')
  const topHazards = snapshot.hazards
    .filter((h) => h.probability > 20)
    .map((h) => `${h.label}: ${h.probability}% probability (${h.value}), Trend: ${h.trend}`)
    .join('\n  ')

  return `You are **TROPO**, an advanced meteorological AI copilot for the VAJRA-X Convective Intelligence Command Center. You operate under a strict ZERO-HALLUCINATION policy — every response must be grounded in the live convective nowcast data and the real-world ambient weather telemetry provided below. You are an expert in severe convective weather — thunderstorms, supercells, hailstorms, cloudbursts, downbursts, and mesoscale convective systems.

## REAL-WORLD CURRENT WEATHER OBSERVATIONS (${liveWeather.source})
- **Location Target:** ${liveWeather.city}, ${liveWeather.country} (${liveWeather.lat.toFixed(3)}°N, ${liveWeather.lon.toFixed(3)}°E)
- **Current Temperature:** **${liveWeather.temp}°C** (Feels like: **${liveWeather.feelsLike}°C**)
- **Today's Range:** Min **${liveWeather.tempMin}°C** / Max **${liveWeather.tempMax}°C**
- **Atmospheric Condition:** **${liveWeather.condition}** (${liveWeather.description})
- **Relative Humidity:** **${liveWeather.humidity}%**
- **Atmospheric Pressure:** **${liveWeather.pressure} hPa**
- **Surface Wind:** **${liveWeather.windSpeedKmH} km/h** from ${liveWeather.windDirection} (${liveWeather.windDeg}°)
- **Visibility:** **${liveWeather.visibilityKm} km**
${liveWeather.rain1h !== undefined ? `- **Surface Precipitation (Past 1h):** **${liveWeather.rain1h} mm**` : ''}
- **Telemetry Updated:** ${liveWeather.fetchedAt} IST

## YOUR ACTIVE CONVECTIVE NOWCAST STATE (Ground Truth)
- **Scenario:** ${snapshot.scenarioLabel} (${snapshot.scenario})
- **Simulation Time:** T+${Math.round(snapshot.minute)} minutes
- **Timestamp:** ${snapshot.timestamp}
- **Overall Severity:** ${snapshot.severity}
- **System Confidence:** ${snapshot.confidence}%
- **Multi-Sensor Consensus:** ${snapshot.consensus}%
- **High-Risk Area:** ${snapshot.highRiskAreaKm2} km²
- **Total Lightning:** ${snapshot.lightningTotal} flashes

## SELECTED STORM CELL: ${cell.id} (${cell.name})
- **Lifecycle Stage:** ${cell.lifecycle}
- **Intensity Index:** ${cell.intensity}%
- **Radar Reflectivity:** ${cell.reflectivity} dBZ
- **Movement:** ${cell.speed} km/h heading ${cell.direction} (${cell.directionDegrees}°)
- **Estimated Arrival:** ${etaStr} (T+${Math.round(cell.arrivalMinutes)} min)
- **Lightning Rate:** ${cell.lightningRate} flashes/min
- **Rainfall Rate:** ${Math.round(cell.rainfallRate)} mm/h
- **Hail Probability:** ${cell.hailProbability}%
- **Wind Probability:** ${cell.windProbability}%
- **Cloudburst Probability:** ${cell.cloudburstProbability}%
- **Cell Confidence:** ${cell.confidence}%
- **Storm Area:** ${cell.areaKm2} km²
- **Cell Age:** ${cell.ageMinutes} minutes

## ACTIVE HAZARDS
  ${topHazards}

## IMPACT ASSESSMENT
- Exposed Population: ~${new Intl.NumberFormat('en-IN').format(snapshot.impact.population)} persons
- Critical Facilities: ${snapshot.impact.hospitals} hospitals, ${snapshot.impact.schools} schools
- Logistics: ${snapshot.impact.roads} major road segments (including NH-81 Coimbatore–Tiruppur)
- Infrastructure: ${snapshot.impact.substations} power substations, ${snapshot.impact.airports} airports on watch
- Agriculture: ${snapshot.impact.agricultureKm2} km² farmland exposed

## DATA SOURCES
${snapshot.sources.map((s) => `- ${s.name} (${s.shortName}): ${s.status} — Latency: ${s.latency}, Confidence: ${s.confidence}%, Quality: ${s.quality}`).join('\n')}
${delayedSource ? `\n⚠ **${delayedSource.name}** is currently **${delayedSource.status}** (${delayedSource.latency} latency). Auto-reweighting active.` : ''}

## RECENT CHANGES (ΔT = 10–15 min)
${snapshot.changes.map((c) => `- ${c.label}: ${c.value} (${c.trend === 'up' ? '↗ increasing' : c.trend === 'down' ? '↘ decreasing' : '→ stable'})`).join('\n')}

## RESPONSE GUIDELINES
1. **Always ground responses** in the data above.
2. **Current Weather & Temperature Questions**: When asked about the current temperature, weather outside, humidity, surface wind, or conditions in Coimbatore, Tiruppur, Chennai, or anywhere, ALWAYS quote the real-world metrics from the **REAL-WORLD CURRENT WEATHER OBSERVATIONS** section above (e.g., "${liveWeather.temp}°C, feels like ${liveWeather.feelsLike}°C, with ${liveWeather.description}"). NEVER say "insufficient data" for temperature or ambient weather questions!
3. **Storm & Nowcast Questions**: For storm kinematics, cell severity, radar reflectivity, or cloudburst risks, cite the Convective Nowcast State.
4. **Format responses** with bold text for key numerical values and structured bullet points where appropriate.
5. **Be concise and direct** — operator-grade intelligence briefings, approximately 100-200 words.
6. **Cite your data sources** accurately (e.g. OpenWeatherMap Live Telemetry, Doppler S-Band Radar, GLDN Lightning Network).`
}

function extractCitations(response: string, liveWeatherSource: string): string[] {
  const citations: string[] = []
  const lowerResponse = response.toLowerCase()

  // Weather / Temperature citations
  if (
    lowerResponse.includes('temperature') ||
    lowerResponse.includes('°c') ||
    lowerResponse.includes('celsius') ||
    lowerResponse.includes('humidity') ||
    lowerResponse.includes('weather') ||
    lowerResponse.includes('feels like') ||
    lowerResponse.includes('ambient')
  ) {
    citations.push(liveWeatherSource.includes('OpenWeather') ? 'OpenWeatherMap Live Telemetry' : 'Surface AWS / Live Mesonet')
  }

  const keywords: Record<string, string> = {
    'radar': 'Doppler S-Band Radar',
    'reflectivity': 'Radar Reflectivity Core',
    'dbz': 'Radar Reflectivity Core',
    'lightning': 'Lightning Detection Network (GLDN)',
    'satellite': 'Geostationary Satellite (INSAT-3DR)',
    'aws': 'Surface AWS Network',
    'cape': 'NWP Thermodynamic Sounding Proxy',
    'sounding': 'NWP Thermodynamic Sounding Proxy',
    'gis': 'GIS Critical Infrastructure Layer',
    'population': 'Tamil Nadu Spatial Demographics Overlay',
    'consensus': 'Observatory Consensus Engine',
    'sensor': 'Sensor Latency Monitor',
    'verification': 'Contingency Matrix / Verification Engine',
    'csi': 'Contingency Matrix / Verification Engine',
    'mae': 'Contingency Matrix / Verification Engine',
    'rainfall': 'Synthetic Precipitation Accumulation',
    'cloudburst': 'IMD Cloudburst Definition (>100mm/h)',
    'hail': 'Multi-Hazard Probabilistic Field',
    'wind': 'Multi-Hazard Probabilistic Field',
    'nwp': 'NWP Model Ensemble',
    'trajectory': 'TITAN/SCIT Cell Tracking',
    'track': 'TITAN/SCIT Cell Tracking',
  }

  for (const [keyword, citation] of Object.entries(keywords)) {
    if (lowerResponse.includes(keyword) && !citations.includes(citation)) {
      citations.push(citation)
    }
    if (citations.length >= 4) break
  }

  if (citations.length === 0) {
    citations.push('Live Convective State Snapshot')
  }

  return citations
}

export async function generateAnalystResponseAsync(
  query: string,
  snapshot: SimulationSnapshot,
  selectedCell: StormCell
): Promise<{
  text: string
  citations: string[]
  evidenceConfidence: number
}> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey) {
    return {
      text: '**Configuration Error:** Groq API key is not set. Please add `VITE_GROQ_API_KEY` to your environment variables.',
      citations: ['System Configuration'],
      evidenceConfidence: 0,
    }
  }

  // Determine geographic coordinates from the selected cell
  const cellLat = 13.6 - selectedCell.centroid.y * 0.045
  const cellLon = 74.8 + selectedCell.centroid.x * 0.045
  const detectedCity = extractCityFromQuery(query)

  // Fetch live real-world weather from OpenWeatherMap (with high-res mesonet fallback)
  const liveWeather = await fetchLiveWeather(
    detectedCity ? { city: detectedCity } : { lat: cellLat, lon: cellLon }
  )

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(snapshot, selectedCell, liveWeather),
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = (errorData as { error?: { message?: string } })?.error?.message || response.statusText
      throw new Error(`Groq API error (${response.status}): ${errorMsg}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const assistantText = data.choices?.[0]?.message?.content ?? 'No response generated.'

    const citations = extractCitations(assistantText, liveWeather.source)
    const evidenceConfidence = Math.round(snapshot.confidence * 0.95)

    return {
      text: assistantText,
      citations,
      evidenceConfidence,
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return {
      text: `**Live Weather Telemetry (${liveWeather.city}):** Currently **${liveWeather.temp}°C** (${liveWeather.condition}, ${liveWeather.description}) with **${liveWeather.humidity}%** humidity and wind at **${liveWeather.windSpeedKmH} km/h** from ${liveWeather.windDirection}.\n\n_Note: Groq LLM reasoning backend experienced a timeout (${errMsg}). Raw telemetry stream delivered above._`,
      citations: [liveWeather.source, 'Local Convective State Snapshot'],
      evidenceConfidence: 90,
    }
  }
}
