import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { signOut as firebaseSignOut, subscribeToAuth } from '../integrations/firebase'
import { createSnapshot, SCENARIOS } from '../domain/simulation'
import { getDataProvider } from '../services/dataProvider'
import type {
  DataStreamMode,
  HazardKey,
  Mode,
  ScenarioKey,
  SimulationSnapshot,
  UserSettings,
  ViewId,
} from '../domain/types'
import { fetchLiveWeather, getWeatherRateLimitStatus, type LiveWeatherData } from '../services/weatherService'
import type { RateLimitStatus } from '../services/rateLimiter'
import { checkRealTimeHazardInRadius, type HazardCheckResult } from '../domain/hazardDetection'

export type Phenomenon = 'ALL' | 'LIGHTNING' | 'HAIL' | 'CLOUDBURST' | 'DOWNBURST'

export interface DetectionModalState {
  type: 'LOCATION_REQUIRED' | 'NO_HAZARD_DETECTED' | 'HAZARD_DETECTED'
  phenomenon: Phenomenon
  title: string
  message: string
  metrics?: HazardCheckResult['metrics']
  coordinates?: [number, number] | null
}

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
  dataStreamMode: DataStreamMode
  setDataStreamMode: (mode: DataStreamMode) => void
  toggleDataStreamMode: () => void
  liveWeather: LiveWeatherData | null
  refreshLiveWeather: () => Promise<void>
  rateLimitStatus: RateLimitStatus
  userLocation: [number, number] | null
  locationStatus: 'IDLE' | 'LOCATING' | 'FOUND' | 'DENIED'
  requestLocation: () => Promise<[number, number] | null>
  clearLocation: () => void
  realTimeDetectionModal: DetectionModalState | null
  setRealTimeDetectionModal: (modal: DetectionModalState | null) => void
  handlePhenomenonSelect: (p: Phenomenon) => Promise<void>
  isHazardDetectedInRadius: (p: Phenomenon) => boolean
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

  // Top-Level Data Stream Mode: Synthetic Simulation vs Real-Time Telemetry
  const [dataStreamMode, setDataStreamMode] = useState<DataStreamMode>('SYNTHETIC')
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null)
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>(() => getWeatherRateLimitStatus())

  // Device Geolocation & 3 km Surveillance Zone State
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'FOUND' | 'DENIED'>('IDLE')
  const [realTimeDetectionModal, setRealTimeDetectionModal] = useState<DetectionModalState | null>(null)

  const requestLocation = async (): Promise<[number, number] | null> => {
    if (!navigator.geolocation) {
      setLocationStatus('DENIED')
      return null
    }
    setLocationStatus('LOCATING')
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const next: [number, number] = [coords.latitude, coords.longitude]
          setUserLocation(next)
          setLocationStatus('FOUND')
          try {
            const weather = await fetchLiveWeather({ lat: next[0], lon: next[1] })
            setLiveWeather(weather)
            setRateLimitStatus(getWeatherRateLimitStatus())
          } catch (_) {}
          resolve(next)
        },
        () => {
          setLocationStatus('DENIED')
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  const clearLocation = () => {
    setUserLocation(null)
    setLocationStatus('IDLE')
  }

  const refreshLiveWeather = async () => {
    try {
      const data = await fetchLiveWeather(
        userLocation ? { lat: userLocation[0], lon: userLocation[1] } : undefined
      )
      setLiveWeather(data)
      setRateLimitStatus(getWeatherRateLimitStatus())
    } catch (err) {
      console.warn('Failed to refresh live weather telemetry:', err)
    }
  }

  const toggleDataStreamMode = () => {
    setDataStreamMode((prev) => {
      const next = prev === 'SYNTHETIC' ? 'REAL_TIME' : 'SYNTHETIC'
      if (next === 'SYNTHETIC') {
        setRealTimeDetectionModal(null)
      } else {
        refreshLiveWeather()
      }
      return next
    })
  }

  const isHazardDetectedInRadius = (p: Phenomenon): boolean => {
    if (dataStreamMode === 'SYNTHETIC') return true
    const check = checkRealTimeHazardInRadius(p, liveWeather, snapshot)
    return check.detected
  }

  const handlePhenomenonSelect = async (p: Phenomenon) => {
    if (dataStreamMode === 'SYNTHETIC') {
      setPhenomenon(p)
      setRealTimeDetectionModal(null)
      return
    }

    // REAL_TIME MODE: 1. Check if location is enabled
    if (locationStatus !== 'FOUND' || !userLocation) {
      setRealTimeDetectionModal({
        type: 'LOCATION_REQUIRED',
        phenomenon: p,
        title: `Turn on your location to detect ${p.toLowerCase()}`,
        message: `In Real Data Mode, TropoTrace scans Doppler radar, ground AWS, and lightning sensor telemetry within your 3 km operational radius. Turn on your location to detect ${p.toLowerCase()} in real time.`,
        coordinates: null,
      })
      return
    }

    // 2. Location is enabled: Evaluate real-time hazard within 3 km radius
    const check = checkRealTimeHazardInRadius(p, liveWeather, snapshot)
    if (check.detected) {
      setPhenomenon(p)
      setRealTimeDetectionModal({
        type: 'HAZARD_DETECTED',
        phenomenon: p,
        title: `Real ${p} Activity Detected in 3 km Radius`,
        message: check.reason,
        metrics: check.metrics,
        coordinates: userLocation,
      })
    } else {
      // In real-time mode with calm weather, do NOT activate fake animation
      setRealTimeDetectionModal({
        type: 'NO_HAZARD_DETECTED',
        phenomenon: p,
        title: `No ${p.toLowerCase()} detected in your location radius`,
        message: `No ${p.toLowerCase()} activity detected within your 3 kilometer radius around coordinates ${userLocation[0].toFixed(4)}°N, ${userLocation[1].toFixed(4)}°E.`,
        metrics: check.metrics,
        coordinates: userLocation,
      })
    }
  }

  // Initial and periodic weather polling with client-side rate limiting
  useEffect(() => {
    refreshLiveWeather()
    const timer = window.setInterval(() => {
      refreshLiveWeather()
    }, 60000)
    return () => window.clearInterval(timer)
  }, [])

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (window.localStorage.getItem('tt-theme') as 'dark' | 'light' | null) ?? 'dark'
  })

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = window.localStorage.getItem('tt-settings')
      if (stored) return JSON.parse(stored)
    } catch (_) { /* ignore */ }
    return {
      showDemoBanner: false,
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
          displayName: 'MoES Lead Meteorologist',
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
  const dataProvider = useMemo(() => getDataProvider(dataStreamMode), [dataStreamMode])

  const snapshot = useMemo(() => {
    return dataProvider.getSnapshot(scenario, minute, modeFactor, selectedCellId, liveWeather)
  }, [dataProvider, scenario, minute, modeFactor, selectedCellId, liveWeather])

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
      displayName: 'MoES Lead Meteorologist',
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
    dataStreamMode,
    setDataStreamMode,
    toggleDataStreamMode,
    liveWeather,
    refreshLiveWeather,
    rateLimitStatus,
    userLocation,
    locationStatus,
    requestLocation,
    clearLocation,
    realTimeDetectionModal,
    setRealTimeDetectionModal,
    handlePhenomenonSelect,
    isHazardDetectedInRadius,
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
