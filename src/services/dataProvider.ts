import type { ScenarioKey, SimulationSnapshot } from '../domain/types'
import { createSnapshot } from '../domain/simulation'

export interface VajraDataProvider {
  getSnapshot: (scenario: ScenarioKey, minute: number, modeFactor?: number) => SimulationSnapshot
}

export const demoProvider: VajraDataProvider = {
  getSnapshot: (scenario, minute, modeFactor = 1) => createSnapshot(scenario, minute, modeFactor),
}

// Future Antigravity/Firebase adapter seam:
// - authenticate the operator with Firebase Auth
// - persist saved alerts and scenario runs in Firestore
// - replace getSnapshot with a Firestore listener or API/WebSocket source
export const getDataProvider = (): VajraDataProvider => demoProvider
