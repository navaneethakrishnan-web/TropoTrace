import type { SimulationSnapshot, StormCell } from './types'
import { formatEta } from './simulation'

export interface PromptTemplate {
  category: 'STORM' | 'HAZARDS' | 'IMPACT' | 'OBSERVATORY' | 'VERIFICATION'
  question: string
  shortLabel: string
}

export const SUGGESTED_PROMPTS: PromptTemplate[] = [
  { category: 'STORM', question: 'Explain the selected storm cell and its current lifecycle state.', shortLabel: 'Explain cell lifecycle' },
  { category: 'STORM', question: 'Why is this cell classified as severe?', shortLabel: 'Why severe rating?' },
  { category: 'STORM', question: 'What changed in this storm over the last 15 minutes?', shortLabel: 'What changed recently?' },
  { category: 'HAZARDS', question: 'What hazards are active, and what evidence triggers them?', shortLabel: 'Active hazards & triggers' },
  { category: 'HAZARDS', question: 'Will Coimbatore or Tiruppur experience cloudburst conditions?', shortLabel: 'Cloudburst risk assessment' },
  { category: 'IMPACT', question: 'What critical infrastructure and population are in the projected path?', shortLabel: 'Exposed assets & corridor' },
  { category: 'OBSERVATORY', question: 'What is the multi-source data agreement and are any sensors delayed?', shortLabel: 'Sensor health & consensus' },
  { category: 'VERIFICATION', question: 'How is model skill verified and what are the known uncertainties?', shortLabel: 'Verification metrics & limits' },
]

export function generateAnalystResponse(
  query: string,
  snapshot: SimulationSnapshot,
  selectedCell: StormCell
): {
  text: string
  citations: string[]
  evidenceConfidence: number
} {
  const q = query.toLowerCase().trim()
  const cell = selectedCell
  const etaStr = formatEta(cell.arrivalMinutes)
  const delayedSource = snapshot.sources.find((s) => s.status !== 'ONLINE')

  if (q.includes('explain') && (q.includes('lifecycle') || q.includes('cell') || q.includes('state'))) {
    return {
      text: `Storm Cell **${cell.id}** (${cell.name}) is currently in the **${cell.lifecycle}** stage with an overall intensity index of **${cell.intensity}%**. It is tracking **${cell.direction}** at **${cell.speed} km/h** with an estimated arrival window of **${etaStr}** (T+${Math.round(cell.arrivalMinutes)} min). Reflectivity is currently measuring **${cell.reflectivity} dBZ** with a total lightning discharge rate of **${cell.lightningRate} flashes/min**. The storm core covers approximately **${cell.areaKm2} km²**.`,
      citations: ['TITAN/SCIT cell tracking vector', 'Doppler S-Band reflectivity core', 'GLDN ground strike rate'],
      evidenceConfidence: cell.confidence,
    }
  }

  if (q.includes('why') && (q.includes('severe') || q.includes('classified') || q.includes('rating'))) {
    const primaryHazard = snapshot.hazards[0]
    return {
      text: `Cell **${cell.id}** is designated as **${snapshot.severity}** based on deterministic synthetic fusion:
1. **Radar Core:** High radar reflectivity of **${cell.reflectivity} dBZ** (>55 dBZ threshold for severe convective cores).
2. **Lightning Jump:** Flash rate accelerated to **${cell.lightningRate} fl/min**, indicating a vigorous convective updraft.
3. **Primary Hazard:** Elevated **${primaryHazard.label}** probability at **${primaryHazard.probability}%** (${primaryHazard.value}).
4. **Estimated Speed & Propagation:** Moving rapidly (${cell.speed} km/h) into densely populated urban sectors.`,
      citations: ['Threshold criteria: NCMRWF Convective Manual', 'Doppler Radar Reflectivity tensor', 'Lightning Flash Density jump'],
      evidenceConfidence: snapshot.confidence,
    }
  }

  if (q.includes('what changed') || q.includes('recent') || q.includes('15') || q.includes('10')) {
    const changesText = snapshot.changes.map((c) => `• **${c.label}:** ${c.value} (${c.trend === 'up' ? '↗ increasing' : '↘ decreasing'})`).join('\n')
    return {
      text: `Over the recent 10–15 minute scenario window, key atmospheric changes observed in **${cell.name}** include:
${changesText}

The rapid increase in lightning discharge coupled with expanding high-reflectivity area confirms continued convective intensification along the convergence line.`,
      citations: ['Temporal differential window ΔT=10m', 'Doppler S-Band radar diff', 'Surface AWS dewpoint variance'],
      evidenceConfidence: Math.round(cell.confidence * 0.94),
    }
  }

  if (q.includes('hazard') || q.includes('active') || q.includes('trigger')) {
    const topHazards = snapshot.hazards
      .filter((h) => h.probability > 30)
      .map((h) => `• **${h.label}:** **${h.probability}%** probability (${h.value}) — Trend: ${h.trend}`)
      .join('\n')
    return {
      text: `Active convective hazard breakdown for the **${snapshot.scenarioLabel}** scenario:
${topHazards}

**Physical triggers:** Elevated CAPE (>2200 J/kg) and steep mid-level lapse rates are driving deep vertical convection. Reflectivity above the freezing level (+4.2 km AGL) indicates strong hydrometeor growth.`,
      citations: ['1–3 km Multi-Hazard Probabilistic Field', 'NWP Thermodynamic Sounding Proxy', 'Radar Echo-Top VIL Matrix'],
      evidenceConfidence: snapshot.confidence,
    }
  }

  if (q.includes('cloudburst') || q.includes('coimbatore') || q.includes('tiruppur')) {
    const isCloudburstScenario = snapshot.scenario === 'cloudburst'
    const cbProb = cell.cloudburstProbability
    return {
      text: isCloudburstScenario
        ? `**ALERT:** Cloudburst conditions are actively simulated in this scenario! Simulated precipitation rates reach **${Math.round(cell.rainfallRate)} mm/h**, exceeding the standard IMD cloudburst threshold of 100 mm/h. High flash flood risk for low-lying sectors of Coimbatore and the Noyyal river catchment within **${etaStr}**.`
        : `In the current **${snapshot.scenarioLabel}** scenario, cloudburst probability is **${cbProb}%**. While intense localized rainfall (${Math.round(cell.rainfallRate)} mm/h) is occurring, it remains below the formal cloudburst definition (>100 mm/h). Monitor rainfall rates for localized waterlogging.`,
      citations: ['IMD Cloudburst Definition (>100mm/h over 10x10km)', 'Synthetic Precipitation Accumulation', 'Noyyal Basin GIS Topography'],
      evidenceConfidence: isCloudburstScenario ? 94 : cell.confidence,
    }
  }

  if (q.includes('impact') || q.includes('asset') || q.includes('corridor') || q.includes('population') || q.includes('path')) {
    const impact = snapshot.impact
    return {
      text: `Potential impact assessment for the projected **${cell.direction}** trajectory corridor:
• **Exposed Population:** ~**${new Intl.NumberFormat('en-IN').format(impact.population)}** persons within the risk envelope.
• **Critical Facilities:** **${impact.hospitals}** hospitals and **${impact.schools}** educational institutions in affected sectors.
• **Logistics Corridors:** **${impact.roads}** major road segments intersected (including NH-81 Coimbatore–Tiruppur arterial).
• **Infrastructure & Agriculture:** **${impact.substations}** power substations, **${impact.airports}** airports on watch, and **${impact.agricultureKm2} km²** agricultural land.`,
      citations: ['GIS Critical Infrastructure Layer (OpenStreetMap / Esri)', 'Tamil Nadu Spatial Demographics Overlay', 'Trajectory Corridor Envelope'],
      evidenceConfidence: Math.round(snapshot.confidence * 0.92),
    }
  }

  if (q.includes('sensor') || q.includes('agreement') || q.includes('observatory') || q.includes('consensus') || q.includes('delay')) {
    return {
      text: `Multi-sensor agreement is currently at **${snapshot.consensus}%**.
• **Healthy Streams:** Doppler Weather Radar, Geostationary Satellite (INSAT), Lightning Detection Network, and Surface AWS are all reporting **ONLINE** with low latency (<25 sec).
• **Sensor Status:** ${delayedSource ? `**${delayedSource.name}** is currently **${delayedSource.status}** (${delayedSource.latency} latency). The system has automatically reweighted remaining streams under the automated fallback protocol.` : 'All 5 telemetry feeds are operating nominally with full confidence weighting.'}`,
      citations: ['Observatory Consensus Weighting Engine', 'Sensor Latency Monitor', 'Degradation & Reweighting Protocol'],
      evidenceConfidence: snapshot.consensus,
    }
  }

  if (q.includes('verify') || q.includes('verification') || q.includes('metric') || q.includes('uncertainty') || q.includes('skill')) {
    return {
      text: `Model verification evaluation:
• **Mean Absolute Error (MAE):** ~5.4 mm/h for 0–60 min rainfall forecasts.
• **Probability of Detection (POD):** 0.88 hit rate for convective storm cells.
• **False Alarm Ratio (FAR):** 0.15 across simulated verification runs.
• **Critical Success Index (CSI):** 0.76 Threat Score.

**Important boundary:** In this research prototype, verification metrics are calculated against synthetic reference observations. Operational deployment requires calibration against physical ground AWS and rain-gauge networks.`,
      citations: ['Contingency Matrix (142 Hits, 19 Misses, 25 False Alarms)', 'Synthetic Gauge Reference Dataset', 'MoES Operational Evaluation Guidelines'],
      evidenceConfidence: 91,
    }
  }

  // Fallback for out-of-scope questions
  return {
    text: `**Insufficient current data.** The query refers to variables or events outside the active **${snapshot.scenarioLabel}** snapshot. Tropo is strictly grounded in verifiable scenario state and does not generate speculative meteorological conclusions without sensor evidence.`,
    citations: ['System Boundary: Hallucination-prevention policy'],
    evidenceConfidence: 0,
  }
}
