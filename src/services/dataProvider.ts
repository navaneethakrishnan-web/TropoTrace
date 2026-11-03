import type { DataStreamMode, ScenarioKey, SimulationSnapshot } from '../domain/types'
import { createSnapshot } from '../domain/simulation'
import { createRealTimeSnapshot } from '../domain/realTimeSnapshot'
import type { LiveWeatherData } from './weatherService'

export interface VajraDataProvider {
  getSnapshot: (
    scenario: ScenarioKey,
    minute: number,
    modeFactor?: number,
    selectedCellId?: string,
    liveWeather?: LiveWeatherData | null
  ) => SimulationSnapshot
}

// 1. Synthetic Simulation Mode Provider (Pre-built Severe Weather Scenarios)
export const demoProvider: VajraDataProvider = {
  getSnapshot: (scenario, minute, modeFactor = 1, selectedCellId?: string) => {
    const snap = createSnapshot(scenario, minute, modeFactor, selectedCellId)
    snap.dataStreamMode = 'SYNTHETIC'
    return snap
  },
}

// 2. Real-Time Telemetry Mode Provider (Live OpenWeather API & Ground Mesonet)
export const realTimeProvider: VajraDataProvider = {
  getSnapshot: (_scenario, _minute, modeFactor = 1, selectedCellId?: string, liveWeather?: LiveWeatherData | null) => {
    if (liveWeather) {
      return createRealTimeSnapshot(liveWeather, modeFactor, selectedCellId)
    }
    // Fallback if weather is still fetching
    const snap = createSnapshot('rapid-thunderstorm', 0, modeFactor, selectedCellId)
    snap.dataStreamMode = 'REAL_TIME'
    snap.scenarioLabel = 'Live OpenWeather Initializing…'
    return snap
  },
}

export const getDataProvider = (mode: DataStreamMode = 'SYNTHETIC'): VajraDataProvider => {
  return mode === 'REAL_TIME' ? realTimeProvider : demoProvider
}
