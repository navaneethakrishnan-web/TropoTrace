import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { signOut as firebaseSignOut, subscribeToAuth } from '../integrations/firebase'
import { createSnapshot, SCENARIOS } from '../domain/simulation'
import { getDataProvider } from '../services/dataProvider'
import type {
  HazardKey,
  Mode,
  ScenarioKey,
  SimulationSnapshot,
  UserSettings,
  ViewId,
} from '../domain/types'

export type Phenomenon = 'ALL' | 'LIGHTNING' | 'HAIL' | 'CLOUDBURST' | 'DOWNBURST'

export const routeByView: Record<ViewId, string> = {
  command: '/',
  storm: '/storm-intelligence',
  hazards: '/hazard-explorer',
  impact: '/impact-intelligence',
  alerts: '/alert-center',
  observatory: '/data-observatory',
  simulation: '/simulation-lab',
  verification: '/verification',
  analyst: '/analyst',
  settings: '/settings',
}

export const viewFromPath = (pathname: string): ViewId => {
  const match = (Object.entries(routeByView) as [ViewId, string][]).find(([, path]) => path === pathname)
  return match?.[0] ?? 'command'
}

interface AppContextType {
  activeView: ViewId
  setActiveView: (view: ViewId) => void
  navigate: (view: ViewId) => void
  scenario: ScenarioKey
  setScenario: (scenario: ScenarioKey) => void
  minute: number
  setMinute: (minute: number | ((prev: number) => number)) => void
  isStreaming: boolean
  setIsStreaming: (streaming: boolean | ((s: boolean) => boolean)) => void
  playbackSpeed: 1 | 2 | 4
  setPlaybackSpeed: (speed: 1 | 2 | 4) => void
  mode: Mode
  setMode: (mode: Mode) => void
  phenomenon: Phenomenon
  setPhenomenon: (p: Phenomenon) => void
  selectedHazard: HazardKey
  setSelectedHazard: (h: HazardKey) => void
  selectedCellId: string
  setSelectedCellId: (id: string) => void
  reviewedAlertIds: Set<string>
  toggleAcknowledgeAlert: (id: string) => void
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
  snapshot: SimulationSnapshot
  user: User | null
  authLoading: boolean
  loginAsJudge: (email?: string) => void
  signOut: () => Promise<void>
  runScenario: (scenario: ScenarioKey) => void
  investigateStorm: (stormId: string) => void
  stepTimeline: (deltaMin: number) => void
  resetTimeline: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  scenarioRunCount: number
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ViewId>(() => viewFromPath(window.location.pathname))
  const [scenario, setScenario] = useState<ScenarioKey>('rapid-thunderstorm')
  const [minute, setMinute] = useState(0)
  const [isStreaming, setIsStreaming] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1)
  const [mode, setMode] = useState<Mode>('EMERGENCY')
  const [phenomenon, setPhenomenon] = useState<Phenomenon>('ALL')
  const [selectedHazard, setSelectedHazard] = useState<HazardKey>('composite')
  const [selectedCellId, setSelectedCellId] = useState<string>('VX-1A7')
  const [reviewedAlertIds, setReviewedAlertIds] = useState<Set<string>>(() => new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [scenarioRunCount, setScenarioRunCount] = useState(0)

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (window.localStorage.getItem('tt-theme') as 'dark' | 'light' | null) ?? 'dark'
  })

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = window.localStorage.getItem('tt-settings')
      if (stored) return JSON.parse(stored)
    } catch (_) { /* ignore */ }
    return {
      showDemoBanner: true,
      reducedMotion: false,
      highContrast: false,
      autoStart: true,
      basemap: 'satellite',
      soundEnabled: true,
    }
  })

  // Firebase auth state
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('tt-judge-session')
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser({
          uid: 'judge-dexathon-lead',
          email: parsed.email || 'operator@tropotrace.moes.gov.in',
          displayName: 'MoES Lead Operator (Judge)',
        } as unknown as User)
      }
    } catch (_) { /* ignore */ }

    const unsubscribe = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
      }
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  // Auto-start simulation if setting enabled
  useEffect(() => {
    if (settings.autoStart && user) {
      setIsStreaming(true)
    }
  }, [user, settings.autoStart])

  // Sync route on popstate
  useEffect(() => {
    const onPopState = () => setActiveView(viewFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Persist theme
  useEffect(() => {
    window.localStorage.setItem('tt-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Persist settings
  useEffect(() => {
    window.localStorage.setItem('tt-settings', JSON.stringify(settings))
  }, [settings])

  // Timer loop for streaming simulation
  useEffect(() => {
    if (!isStreaming) return
    const step = 0.5 * playbackSpeed
    const intervalMs = 1000 / playbackSpeed
    const timer = window.setInterval(() => {
      setMinute((current) => (current + step) % 360)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [isStreaming, playbackSpeed])

  const modeFactor = mode === 'EMERGENCY' ? 1.08 : mode === 'AVIATION' ? 0.86 : mode === 'AGRICULTURE' ? 1.14 : 1.02
  const dataProvider = useMemo(() => getDataProvider(), [])

  const snapshot = useMemo(() => {
    return dataProvider.getSnapshot(scenario, minute, modeFactor, selectedCellId)
  }, [dataProvider, scenario, minute, modeFactor, selectedCellId])

  const navigate = (view: ViewId) => {
    window.history.pushState({}, '', routeByView[view])
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const toggleAcknowledgeAlert = (id: string) => {
    setReviewedAlertIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runScenario = (nextScenario: ScenarioKey) => {
    setScenario(nextScenario)
    setMinute(0)
    setIsStreaming(true)
    setScenarioRunCount((c) => c + 1)
    const lensForScenario: Partial<Record<ScenarioKey, Phenomenon>> = {
      hailstorm: 'HAIL',
      cloudburst: 'CLOUDBURST',
      downburst: 'DOWNBURST',
      initiation: 'LIGHTNING',
      'multi-cell': 'ALL',
    }
    setPhenomenon(lensForScenario[nextScenario] ?? 'ALL')
    const primaryHazardForScenario = SCENARIOS.find((s) => s.key === nextScenario)?.primaryHazard ?? 'composite'
    setSelectedHazard(primaryHazardForScenario)
    navigate('command')
  }

  const investigateStorm = (stormId: string) => {
    setSelectedCellId(stormId)
    navigate('storm')
  }

  const stepTimeline = (deltaMin: number) => {
    setMinute((prev) => Math.max(0, Math.min(360, prev + deltaMin)))
  }

  const resetTimeline = () => {
    setMinute(0)
    setIsStreaming(false)
  }

  const loginAsJudge = (demoEmail = 'operator@tropotrace.moes.gov.in') => {
    const dummyUser = {
      uid: 'judge-dexathon-lead',
      email: demoEmail,
      displayName: 'MoES Lead Operator (Judge)',
    } as unknown as User
    setUser(dummyUser)
    try {
      window.localStorage.setItem('tt-judge-session', JSON.stringify({ email: demoEmail }))
    } catch (_) { /* ignore */ }
  }

  const handleSignOut = async () => {
    try {
      window.localStorage.removeItem('tt-judge-session')
    } catch (_) { /* ignore */ }
    setUser(null)
    try {
      await firebaseSignOut()
    } catch (err) {
      console.error('Sign-out error:', err)
    }
  }

  const contextValue: AppContextType = {
    activeView,
    setActiveView,
    navigate,
    scenario,
    setScenario,
    minute,
    setMinute,
    isStreaming,
    setIsStreaming,
    playbackSpeed,
    setPlaybackSpeed,
    mode,
    setMode,
    phenomenon,
    setPhenomenon,
    selectedHazard,
    setSelectedHazard,
    selectedCellId,
    setSelectedCellId,
    reviewedAlertIds,
    toggleAcknowledgeAlert,
    settings,
    updateSetting,
    theme,
    toggleTheme,
    snapshot,
    user,
    authLoading,
    loginAsJudge,
    signOut: handleSignOut,
    runScenario,
    investigateStorm,
    stepTimeline,
    resetTimeline,
    mobileMenuOpen,
    setMobileMenuOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    scenarioRunCount,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
