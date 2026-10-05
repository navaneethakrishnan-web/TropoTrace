import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  CloudLightning,
  CloudRain,
  Compass,
  Copy,
  Crosshair,
  Database,
  Download,
  Eye,
  Gauge,
  Grid3X3,
  Hospital,
  Info,
  LogOut,
  LockKeyhole,
  Layers3,
  MapPin,
  Maximize2,
  Menu,
  Mic,
  Moon,
  Navigation,
  Pause,
  Plane,
  Play,
  Printer,
  Radio,
  RadioTower,
  RefreshCw,
  Route,
  School,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Square,
  Target,
  Sun,
  Tractor,
  Volume2,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { firebaseConnectionLabel, signInWithEmail, createAccount, signOut as firebaseSignOut, subscribeToAuth, saveUserProfile, type User } from '../integrations/firebase'
import { createSnapshot, formatEta, pointPath, polygonPath, SCENARIOS } from '../domain/simulation'
import { getDataProvider } from '../services/dataProvider'
import type { DataSource, HazardKey, LayerKey, Mode, ScenarioKey, Severity, SimulationSnapshot, ViewId } from '../domain/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const navItems: { id: ViewId; label: string; icon: LucideIcon; group?: string }[] = [
  { id: 'command', label: 'Command Center', icon: Crosshair, group: 'Operations' },
  { id: 'storm', label: 'Storm Intelligence', icon: Activity },
  { id: 'hazards', label: 'Hazard Explorer', icon: CloudLightning },
  { id: 'impact', label: 'Impact Intelligence', icon: ShieldAlert },
  { id: 'alerts', label: 'Alert Center', icon: Bell, group: 'Response' },
  { id: 'observatory', label: 'Data Observatory', icon: RadioTower },
  { id: 'simulation', label: 'Simulation Lab', icon: RefreshCw, group: 'Analysis' },
  { id: 'verification', label: 'Verification', icon: BarChart3 },
  { id: 'analyst', label: 'TropoTrace Analyst', icon: Bot, group: 'Tools' },
  { id: 'settings', label: 'System Settings', icon: Settings2 },
]

const routeByView: Record<ViewId, string> = {
  command: '/', storm: '/storm-intelligence', hazards: '/hazard-explorer', impact: '/impact-intelligence', alerts: '/alert-center', observatory: '/data-observatory', simulation: '/simulation-lab', verification: '/verification', analyst: '/analyst', settings: '/settings',
}

const viewFromPath = (pathname: string): ViewId => {
  const match = (Object.entries(routeByView) as [ViewId, string][]).find(([, path]) => path === pathname)
  return match?.[0] ?? 'command'
}

type Phenomenon = 'ALL' | 'LIGHTNING' | 'HAIL' | 'CLOUDBURST' | 'DOWNBURST'

const severityCopy: Record<Severity, string> = {
  NORMAL: 'Baseline conditions', WATCH: 'Monitor development', ALERT: 'Actionable risk', WARNING: 'Severe weather expected', SEVERE: 'Immediate response',
}

const languageLabels: Record<string, string> = { English: 'EN', Hindi: 'HI', Tamil: 'TA', Telugu: 'TE', Malayalam: 'ML', Kannada: 'KN', Marathi: 'MR', Bengali: 'BN' }
const languageMessage: Record<string, string> = {
  English: 'A rapidly intensifying convective cell is moving northeast at approximately 31 km/h. Elevated lightning activity and strong radar echoes are detected. Areas along the projected path may experience intense rainfall, lightning and damaging winds within the next 35–50 minutes.',
  Hindi: 'एक तेजी से तीव्र होता संवहनी सेल लगभग 31 किमी/घंटा की गति से उत्तर-पूर्व की ओर बढ़ रहा है। मार्ग के क्षेत्रों में अगले 35–50 मिनट में तेज वर्षा, बिजली और तेज हवाएं हो सकती हैं।',
  Tamil: 'ஒரு வேகமாக வலுப்பெறும் இடியுடன் கூடிய மழை அமைப்பு மணிக்கு 31 கி.மீ வேகத்தில் வடகிழக்கு நோக்கி நகர்கிறது. அடுத்த 35–50 நிமிடங்களில் கனமழை, மின்னல் மற்றும் பலத்த காற்று ஏற்படலாம்.',
  Telugu: 'వేగంగా బలపడుతున్న తుఫాను కణం గంటకు 31 కి.మీ వేగంతో ఈశాన్య దిశగా కదులుతోంది. రాబోయే 35–50 నిమిషాల్లో భారీ వర్షం, పిడుగులు మరియు బలమైన గాలులు సంభవించవచ్చు.',
  Malayalam: 'വേഗത്തിൽ ശക്തിപ്പെടുന്ന ഇടിമിന്നൽ കോശം മണിക്കൂറിൽ 31 കി.മീ വേഗത്തിൽ വടക്കുകിഴക്കോട്ട് നീങ്ങുന്നു. അടുത്ത 35–50 മിനിറ്റിനുള്ളിൽ ശക്തമായ മഴയും ഇടിമിന്നലും കാറ്റും ഉണ്ടാകാം.',
  Kannada: 'ವೇಗವಾಗಿ ಬಲಗೊಳ್ಳುತ್ತಿರುವ ಬಿರುಗಾಳಿ ಕೋಶವು ಗಂಟೆಗೆ 31 ಕಿ.ಮೀ ವೇಗದಲ್ಲಿ ಈಶಾನ್ಯಕ್ಕೆ ಚಲಿಸುತ್ತಿದೆ. ಮುಂದಿನ 35–50 ನಿಮಿಷಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆ, ಮಿಂಚು ಮತ್ತು ಬಲವಾದ ಗಾಳಿ ಸಾಧ್ಯ.',
  Marathi: 'वेगाने तीव्र होणारा संवहनी सेल ताशी 31 किमी वेगाने ईशान्येकडे सरकत आहे. पुढील 35–50 मिनिटांत मुसळधार पाऊस, वीज आणि जोरदार वारे येऊ शकतात.',
  Bengali: 'দ্রুত তীব্র হওয়া বজ্রঝড়ের কোষটি ঘণ্টায় প্রায় 31 কিমি বেগে উত্তর-পূর্ব দিকে এগোচ্ছে। পরবর্তী 35–50 মিনিটে প্রবল বৃষ্টি, বজ্রপাত ও ঝোড়ো হাওয়া হতে পারে।',
}

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(Math.round(value))
const pad = (value: number) => String(Math.max(0, Math.round(value))).padStart(2, '0')
const prettyTimestamp = (iso: string) => {
  const date = new Date(iso)
  return `${pad(date.getUTCHours() + 5 > 23 ? date.getUTCHours() - 19 : date.getUTCHours() + 5)}:${pad(date.getUTCMinutes())} IST`
}
const classForSeverity = (severity: Severity) => `severity-${severity.toLowerCase()}`

function App() {
  const [activeView, setActiveView] = useState<ViewId>(() => viewFromPath(window.location.pathname))
  const [scenario, setScenario] = useState<ScenarioKey>('rapid-thunderstorm')
  const [minute, setMinute] = useState(0)
  const [isStreaming, setIsStreaming] = useState(false)
  const [mode, setMode] = useState<Mode>('EMERGENCY')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotice, setShowNotice] = useState(true)
  const [settings, setSettings] = useState({ showDemoBanner: true, reducedMotion: false, highContrast: true, autoStart: true })
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (window.localStorage.getItem('tt-theme') as 'dark' | 'light' | null) ?? 'dark')
  const [phenomenon, setPhenomenon] = useState<Phenomenon>('ALL')
  const [scenarioRunId, setScenarioRunId] = useState(0)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sessionEmail, setSessionEmail] = useState('')

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setFirebaseUser(user)
      setSessionEmail(user?.email ?? '')
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const isAuthenticated = !!firebaseUser

  const modeFactor = mode === 'EMERGENCY' ? 1.08 : mode === 'AVIATION' ? 0.86 : mode === 'AGRICULTURE' ? 1.14 : 1.02
  const dataProvider = useMemo(() => getDataProvider(), [])
  const snapshot = useMemo(() => dataProvider.getSnapshot(scenario, minute, modeFactor), [dataProvider, scenario, minute, modeFactor])

  useEffect(() => {
    if (!isStreaming) return
    const timer = window.setInterval(() => setMinute((current) => (current + 0.5) % 360), 1000)
    return () => window.clearInterval(timer)
  }, [isStreaming])

  useEffect(() => {
    window.localStorage.setItem('tt-theme', theme)
  }, [theme])

  useEffect(() => {
    const onPopState = () => setActiveView(viewFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (view: ViewId) => {
    window.history.pushState({}, '', routeByView[view])
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  const runScenario = (nextScenario: ScenarioKey) => {
    setScenario(nextScenario)
    setMinute(0)
    setIsStreaming(true)
    setScenarioRunId((current) => current + 1)
    const lensForScenario: Partial<Record<ScenarioKey, Phenomenon>> = { hailstorm: 'HAIL', cloudburst: 'CLOUDBURST', downburst: 'DOWNBURST' }
    setPhenomenon(lensForScenario[nextScenario] ?? 'ALL')
    setActiveView('command')
  }

  const signOut = async () => {
    try { await firebaseSignOut() } catch (_) { /* ignore */ }
  }

  if (authLoading) return <div className={`login-screen theme-${theme}`}><div className="login-atmosphere" /><div style={{ color: 'var(--cyan, #39d6d0)', fontFamily: 'var(--mono, monospace)', fontSize: '12px', letterSpacing: '.1em' }}>AUTHENTICATING…</div></div>
  if (!isAuthenticated) return <LoginPage theme={theme} onSuccess={() => {}} />

  return (
    <div className={`app-shell theme-${theme} ${settings.reducedMotion ? 'reduced-motion' : ''} ${settings.highContrast ? 'high-contrast' : ''}`}>
      <aside className={`side-nav ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup" onClick={() => navigate('command')} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && navigate('command')} role="button" tabIndex={0}>
          <div className="brand-mark"><span /><span /><span /><span /></div>
          <div>
            <div className="brand-name">TROPO<span>TRACE</span></div>
            <div className="brand-subtitle">CONVECTIVE INTELLIGENCE</div>
          </div>
        </div>
        <div className="nav-scroll">
          {navItems.map((item, index) => (
            <div key={item.id}>
              {item.group && <div className="nav-group-label">{item.group}</div>}
              {!item.group && index === 0 && <div className="nav-group-label">Operations</div>}
              <button className={`nav-item ${activeView === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)} aria-current={activeView === item.id ? 'page' : undefined}>
                <item.icon size={17} strokeWidth={activeView === item.id ? 2.5 : 1.8} />
                <span>{item.label}</span>
                {item.id === 'alerts' && <span className="nav-badge">03</span>}
              </button>
            </div>
          ))}
        </div>
        <div className="side-footer">
          <div className="operator-row"><span className="online-dot" /> <span>OPERATOR SESSION</span><span className="operator-id">TT-01</span></div>
          <div className="side-footer-note">TropoTrace · v0.1.0</div>
        </div>
      </aside>

      <main className="main-stage">
        <header className="top-bar">
          <button className="mobile-menu-button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="top-context">
            <span className="live-pip" />
            <span className="top-context-label">LIVE CONVECTIVE COMMAND CENTER</span>
            <span className="top-separator" />
            <span className="top-region"><MapPin size={13} /> SOUTH INDIA / TAMIL NADU</span>
          </div>
          <div className="top-actions">
            <div className="clock-readout"><Clock3 size={14} /> {prettyTimestamp(snapshot.timestamp)}</div>
            <div className="system-health"><span className="health-bars"><i /><i /><i /><i /></span><span>SYSTEM HEALTH <b>98%</b></span></div>
            <button className="top-icon-button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="top-icon-button" onClick={() => setShowNotice((visible) => !visible)} aria-label="Toggle demo notice"><Info size={17} /></button>
            <button className="session-pill" onClick={signOut} aria-label={`Sign out ${sessionEmail}`}><span>TT-01</span><LogOut size={14} /></button>
          </div>
        </header>

        {showNotice && settings.showDemoBanner && <div className="demo-banner"><div><span className="banner-label">DEMO MODE</span><span className="banner-copy">Simulated sensor stream · demonstration model · not operational meteorological guidance</span></div><button onClick={() => setShowNotice(false)} aria-label="Dismiss demo notice"><X size={15} /></button></div>}

        <div className="stage-content">
          {activeView === 'command' && <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> {activeView === 'command' ? 'SITUATIONAL AWARENESS' : navItems.find((item) => item.id === activeView)?.label.toUpperCase()}</div>
              <h1>{activeView === 'command' ? 'Live convective intelligence' : navItems.find((item) => item.id === activeView)?.label}</h1>
              <p>{activeView === 'command' ? 'Observe, detect, fuse and act across the next six hours.' : viewDescription(activeView)}</p>
            </div>
            <div className="heading-actions">
              <div className="mode-select-wrap"><SlidersHorizontal size={14} /><select value={mode} onChange={(event) => setMode(event.target.value as Mode)} aria-label="Select operational mode"><option value="EMERGENCY">Emergency mode</option><option value="AVIATION">Aviation mode</option><option value="AGRICULTURE">Agriculture mode</option><option value="URBAN">Urban mode</option></select><ChevronDown size={13} /></div>
              <button className={`stream-button ${isStreaming ? 'streaming' : ''}`} onClick={() => setIsStreaming((streaming) => !streaming)}><span className="button-dot" /> {isStreaming ? 'Live stream' : 'Stream paused'}</button>
            </div>
          </div>}

          {activeView === 'command' ? <CommandCenter snapshot={snapshot} minute={minute} scenarioRunId={scenarioRunId} phenomenon={phenomenon} setPhenomenon={(nextPhenomenon) => { setPhenomenon(nextPhenomenon); setIsStreaming(true); if (scenarioRunId === 0) setScenarioRunId(1) }} isStreaming={isStreaming} setIsStreaming={setIsStreaming} onMinuteChange={(nextMinute) => setMinute(Math.max(0, Math.min(360, nextMinute)))} onNavigate={navigate} onRunScenario={runScenario} /> : <OperationalView view={activeView} snapshot={snapshot} onNavigate={navigate} onMinuteChange={(nextMinute) => setMinute(Math.max(0, Math.min(360, nextMinute)))} isStreaming={isStreaming} setIsStreaming={setIsStreaming} onRunScenario={runScenario} settings={settings} onSettingChange={(key, value) => { setSettings((current) => ({ ...current, [key]: value })); if (key === 'showDemoBanner') setShowNotice(value) }} />}
        </div>
      </main>
    </div>
  )
}

function viewDescription(view: ViewId) {
  const descriptions: Record<ViewId, string> = {
    command: '', storm: 'Track cell lifecycle, movement vectors, confidence and evidence.', hazards: 'Explore probabilistic hazard fields across the 1–3 km grid.', impact: 'Estimate exposed assets and operational consequences.', alerts: 'Compose explainable, geo-targeted warnings for response teams.', observatory: 'Monitor the health, latency and agreement of every signal source.', simulation: 'Run deterministic event scenarios and replay sensor evolution.', verification: 'Compare prototype predictions with synthetic observations.', analyst: 'Ask structured questions of the current application state.', settings: 'Control presentation state and future data-service connections.',
  }
  return descriptions[view]
}

function CommandCenter({ snapshot, minute, scenarioRunId, phenomenon, setPhenomenon, isStreaming, setIsStreaming, onMinuteChange, onNavigate, onRunScenario }: { snapshot: SimulationSnapshot; minute: number; scenarioRunId: number; phenomenon: Phenomenon; setPhenomenon: (value: Phenomenon) => void; isStreaming: boolean; setIsStreaming: (value: boolean) => void; onMinuteChange: (minute: number) => void; onNavigate: (view: ViewId) => void; onRunScenario: (scenario: ScenarioKey) => void }) {
  const [storyStep, setStoryStep] = useState(-1)
  const [showChanges, setShowChanges] = useState(false)
  const storyFrames = ['Storm formation', 'Convective initiation', 'Rapid intensification', 'Lightning increase', 'Hazard emergence', 'Forecast branching', 'Impact prediction', 'Verification', 'Learning']
  useEffect(() => {
    if (storyStep < 0) return
    const timer = window.setInterval(() => setStoryStep((current) => current >= storyFrames.length - 1 ? -1 : current + 1), 1400)
    return () => window.clearInterval(timer)
  }, [storyStep, storyFrames.length])
  return <>
    <KpiStrip snapshot={snapshot} />
    <div className="command-layout">
      <section className="map-panel panel-surface">
        <div className="panel-header map-panel-header">
          <div><div className="panel-kicker"><span className="status-dot cyan" /> SPATIAL INTELLIGENCE</div><h2>Convective activity / nowcast field</h2></div>
          <div className="map-header-tools"><span className="map-time"><Radio size={13} /> FRAME {Math.round(snapshot.minute).toString().padStart(3, '0')} · T+{Math.round(snapshot.minute).toString().padStart(2, '0')}</span><MapLayerLegend /></div>
        </div>
        <div className="map-control-deck"><PhenomenonLens phenomenon={phenomenon} setPhenomenon={setPhenomenon} storyStep={storyStep} setStoryStep={setStoryStep} showChanges={showChanges} setShowChanges={setShowChanges} /></div>
        <MapCanvas key={`${snapshot.scenario}-${scenarioRunId}`} snapshot={snapshot} scenarioRunId={scenarioRunId} phenomenon={phenomenon} showChanges={showChanges} isStreaming={isStreaming} />
        <TimelineBar snapshot={snapshot} minute={minute} isStreaming={isStreaming} setIsStreaming={setIsStreaming} onMinuteChange={onMinuteChange} />
      </section>
      <IntelligenceRail snapshot={snapshot} onNavigate={onNavigate} onRunScenario={onRunScenario} />
    </div>
    <DataHealthStrip sources={snapshot.sources} consensus={snapshot.consensus} onNavigate={onNavigate} />
  </>
}

function KpiStrip({ snapshot }: { snapshot: SimulationSnapshot }) {
  const primary = snapshot.cells[0]
  const items = [
    { label: 'ACTIVE CELLS', value: snapshot.cells.length.toString().padStart(2, '0'), note: `${snapshot.cells.filter((cell) => cell.intensity > 62).length} severe`, icon: CloudLightning, tone: 'cyan' },
    { label: 'SEVERE CELLS', value: snapshot.cells.filter((cell) => cell.intensity > 62).length.toString().padStart(2, '0'), note: snapshot.severity, icon: ShieldAlert, tone: 'amber' },
    { label: 'LIGHTNING RATE', value: `${primary.lightningRate}`, suffix: 'fl/min', note: '+43% / 10m', icon: CloudLightning, tone: 'yellow' },
    { label: 'HIGH-RISK AREA', value: `${snapshot.highRiskAreaKm2}`, suffix: 'km²', note: '1 km grid', icon: Grid3X3, tone: 'red' },
    { label: 'NEXT ARRIVAL', value: formatEta(snapshot.nextArrivalMinutes), note: 'Coimbatore sector', icon: Navigation, tone: 'blue' },
    { label: 'DATA CONFIDENCE', value: `${snapshot.confidence}`, suffix: '%', note: snapshot.confidence > 80 ? 'High agreement' : 'Reduced / NWP delayed', icon: Gauge, tone: 'green' },
  ]
  return <div className="kpi-strip">{items.map((item) => <div className="kpi-cell" key={item.label}><div className={`kpi-icon ${item.tone}`}><item.icon size={16} /></div><div className="kpi-copy"><div className="kpi-label">{item.label}</div><div className="kpi-value">{item.value}<small>{item.suffix}</small></div><div className="kpi-note">{item.note}</div></div></div>)}</div>
}

function PhenomenonLens({ phenomenon, setPhenomenon, storyStep, setStoryStep, showChanges, setShowChanges }: { phenomenon: Phenomenon; setPhenomenon: (value: Phenomenon) => void; storyStep: number; setStoryStep: (value: number) => void; showChanges: boolean; setShowChanges: (value: boolean) => void }) {
  const items: { id: Phenomenon; label: string; className: string }[] = [
    { id: 'ALL', label: 'ALL', className: 'all' },
    { id: 'LIGHTNING', label: 'LIGHTNING', className: 'lightning' },
    { id: 'HAIL', label: 'HAIL', className: 'hail' },
    { id: 'CLOUDBURST', label: 'CLOUDBURST', className: 'cloudburst' },
    { id: 'DOWNBURST', label: 'DOWNBURST', className: 'downburst' },
  ]
  return <div className="phenomenon-lens"><div className="lens-heading"><span><span className="status-dot cyan" /> ATMOSPHERIC LENS</span><b>{phenomenon === 'ALL' ? 'FULL STORM TWIN' : `${phenomenon} MODE`}</b></div><div className="lens-pills">{items.map((item) => <button key={item.id} className={`${item.className} ${phenomenon === item.id ? 'active' : ''}`} onClick={() => setPhenomenon(item.id)}>{item.label}</button>)}</div><div className="lens-actions"><button className="story-button" onClick={() => setStoryStep(storyStep >= 0 ? -1 : 0)}><Sparkles size={12} /> {storyStep >= 0 ? 'PAUSE STORY' : 'TELL ME THE STORM'}</button><button className={`changes-button ${showChanges ? 'active' : ''}`} onClick={() => setShowChanges(!showChanges)}>WHAT CHANGED?</button></div>{storyStep >= 0 && <div className="story-progress"><span>STORY {String(storyStep + 1).padStart(2, '0')} / 09</span><b>{['FORMATION', 'INITIATION', 'INTENSIFICATION', 'LIGHTNING', 'HAZARD', 'FUTURES', 'IMPACT', 'VERIFICATION', 'LEARNING'][storyStep]}</b></div>}</div>
}

function MapCanvas({ snapshot, scenarioRunId, phenomenon, showChanges, isStreaming }: { snapshot: SimulationSnapshot; scenarioRunId: number; phenomenon: Phenomenon; showChanges: boolean; isStreaming: boolean }) {
  const mapHost = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ riskGrid: true, radar: true, tracks: true, lightning: true, assets: true, roads: true })
  const [basemap, setBasemap] = useState<'street' | 'satellite'>('satellite')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationStatus, setLocationStatus] = useState<'REQUESTING' | 'FOUND' | 'DENIED' | 'UNAVAILABLE'>('REQUESTING')
  const cell = snapshot.cells[0]
  const toLatLng = (point: { x: number; y: number }): [number, number] => [13.6 - point.y * .045, 74.8 + point.x * .045]
  const toggleLayer = (key: LayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }))
  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('UNAVAILABLE'); return }
    setLocationStatus('REQUESTING')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const next: [number, number] = [coords.latitude, coords.longitude]
      setUserLocation(next)
      setLocationStatus('FOUND')
      mapRef.current?.flyTo(next, 10, { duration: 1.1, easeLinearity: .2 })
    }, () => setLocationStatus('DENIED'), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 })
  }

  useEffect(() => {
    if (!mapHost.current || mapRef.current) return
    const map = L.map(mapHost.current, { zoomControl: false, preferCanvas: true, attributionControl: true }).setView([11.02, 76.96], 8)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
    overlayRef.current = L.layerGroup().addTo(map)
    window.setTimeout(() => map.invalidateSize(), 100)
    return () => { map.remove(); mapRef.current = null; overlayRef.current = null; tileLayerRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    tileLayerRef.current?.remove()
    const url = basemap === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    const attribution = basemap === 'satellite'
      ? 'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      : 'Tiles &copy; Esri — Source: Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
    tileLayerRef.current = L.tileLayer(url, { maxZoom: 19, attribution }).addTo(map)
  }, [basemap])

  useEffect(() => { requestLocation() }, [])

  useEffect(() => {
    const map = mapRef.current
    const overlay = overlayRef.current
    if (!map || !overlay) return
    overlay.clearLayers()
    const domainCenter = toLatLng(cell.centroid)
    const center = userLocation ?? domainCenter
    const shift: [number, number] = [center[0] - domainCenter[0], center[1] - domainCenter[1]]
    const placePoint = (point: { x: number; y: number }): [number, number] => { const ll = toLatLng(point); return [ll[0] + shift[0], ll[1] + shift[1]] }
    const trackLatLngs = cell.track.map(placePoint)
    const forecastLatLngs = cell.forecast.map(placePoint)
    const cssIcon = (className: string, content = '') => {
      const size = className.includes('storm-twin') ? 110 : className.includes('lightning') || className.includes('cloudburst') || className.includes('downburst') ? 64 : 48
      return L.divIcon({ className: `leaflet-vajra-icon ${className}`, html: content, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
    }
    if (layers.radar) {
      L.circle(center, { radius: 28000, color: '#3dc8cf', weight: 1, opacity: .4, fillColor: '#194f67', fillOpacity: .12, className: 'radar-field' }).addTo(overlay)
      L.circle(center, { radius: 12000 + cell.intensity * 120, color: '#ffb547', weight: 1, opacity: .55, fillColor: '#ff705e', fillOpacity: .16, className: 'radar-core' }).addTo(overlay)
    }
    if (layers.tracks) {
      L.polyline(trackLatLngs, { color: '#8aaeb1', weight: 3, opacity: .75, dashArray: '8 10' }).addTo(overlay)
      L.polyline(forecastLatLngs, { color: '#ffb547', weight: 4, opacity: .9, dashArray: '14 8' }).addTo(overlay)
      L.polygon([placePoint(cell.uncertaintyCone[0]), placePoint(cell.uncertaintyCone[1]), placePoint(cell.uncertaintyCone[2]), placePoint(cell.uncertaintyCone[3])], { color: '#ffb547', weight: 1, dashArray: '5 7', fillColor: '#ffb547', fillOpacity: .12 }).addTo(overlay)
    }
    if (layers.roads) {
      const roads: L.LatLngExpression[][] = [[[10.95, 76.12], [11.05, 76.55], [11.15, 76.96], [11.1, 77.45], [11.25, 78.05]], [[10.65, 76.7], [10.9, 76.95], [11.3, 77.15], [11.55, 77.7]], [[11.2, 76.65], [11.75, 76.85], [12.1, 77.3]]]
      roads.forEach((road) => L.polyline(road, { color: '#c8d8c4', weight: 2, opacity: .32 }).addTo(overlay))
    }
    if (layers.riskGrid) {
      const bounds = L.latLngBounds([center[0] as number - .8, center[1] as number - .8], [center[0] as number + .8, center[1] as number + .8])
      L.rectangle(bounds, { color: '#ffb547', weight: 1, opacity: .25, fill: false, dashArray: '3 7' }).addTo(overlay)
    }
    if (layers.assets) {
      ;[[11.02, 76.96, 'COIMBATORE'], [11.1, 77.34, 'TIRUPPUR'], [11.34, 77.72, 'ERODE'], [10.92, 76.95, 'AIRPORT']].forEach(([lat, lng, label]) => L.marker([lat as number, lng as number], { icon: cssIcon('asset-marker', `<span>${String(label).slice(0, 1)}</span>`) }).bindTooltip(String(label), { direction: 'top', className: 'gis-tooltip' }).addTo(overlay))
    }
    if (userLocation) {
      L.circle(userLocation, { radius: 650, color: '#65f2d2', weight: 2, opacity: .85, fillColor: '#65f2d2', fillOpacity: .12, className: 'user-location-ring' }).addTo(overlay)
      L.marker(userLocation, { icon: cssIcon('user-location-marker', '<span>⌖</span>') }).bindTooltip('YOUR CURRENT LOCATION', { direction: 'top', className: 'gis-tooltip' }).addTo(overlay)
    }
    const playbackActive = scenarioRunId > 0 && isStreaming
    if (playbackActive && layers.lightning && (phenomenon === 'ALL' || phenomenon === 'LIGHTNING')) {
      Array.from({ length: 4 }, (_, index) => { const angle = index * (Math.PI / 2); const lat = center[0] as number + Math.sin(angle) * .018; const lng = center[1] as number + Math.cos(angle) * .022; return L.marker([lat, lng], { icon: cssIcon('lightning-marker', `<span class="gold-lightning-line lightning-line-${index + 1}"></span>`) }).addTo(overlay) })
    }
    if (playbackActive && phenomenon === 'HAIL') Array.from({ length: 24 }, (_, index) => L.marker([(center[0] as number) + .03 - (index % 6) * .01, (center[1] as number) - .025 + Math.floor(index / 6) * .011], { icon: cssIcon('hail-marker', '<span class="hail-glyph">●</span>') }).addTo(overlay))
    if (playbackActive && phenomenon === 'CLOUDBURST') L.marker(center, { icon: cssIcon('cloudburst-marker', '<span class="cloudburst-glyph">☔</span>') }).addTo(overlay)
    if (playbackActive && phenomenon === 'DOWNBURST') Array.from({ length: 8 }, (_, index) => L.marker([(center[0] as number) + Math.sin(index) * .018, (center[1] as number) + Math.cos(index) * .025], { icon: cssIcon('downburst-marker', '<span class="downburst-glyph">↘</span>') }).addTo(overlay))
    const stormVisual = !playbackActive
      ? '<div class="storm-twin-cloud cloud-a"></div><div class="storm-twin-cloud cloud-b"></div><div class="storm-twin-core"></div>'
      : phenomenon === 'CLOUDBURST'
      ? '<div class="storm-twin-cloud cloud-a"></div><div class="storm-twin-cloud cloud-b"></div><div class="storm-rain-curtain"></div><div class="storm-twin-core rain-core"></div>'
      : phenomenon === 'HAIL'
        ? '<div class="storm-twin-cloud cloud-a hail-cloud"></div><div class="storm-twin-cloud cloud-b hail-cloud"></div><div class="storm-hail-core">•••</div><div class="storm-twin-core hail-core"></div>'
        : phenomenon === 'DOWNBURST'
          ? '<div class="storm-twin-cloud cloud-a wind-cloud"></div><div class="storm-twin-cloud cloud-b wind-cloud"></div><div class="storm-wind-ring"></div><div class="storm-twin-core wind-core"></div>'
          : '<div class="storm-twin-cloud cloud-a"></div><div class="storm-twin-cloud cloud-b"></div><div class="storm-gold-burst"><i></i><i></i><i></i><i></i></div><div class="storm-twin-core"></div>'
    L.marker(center, { icon: cssIcon(`storm-twin-marker storm-twin-${phenomenon.toLowerCase()}`, `${stormVisual}<b>CELL-01</b>`) }).bindTooltip(`${cell.name} · ${cell.lifecycle} · ${cell.intensity}% intensity`, { direction: 'top', className: 'gis-tooltip' }).addTo(overlay)
  }, [snapshot.scenario, layers, phenomenon, showChanges, userLocation, scenarioRunId, isStreaming])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.flyTo(userLocation ?? toLatLng(cell.centroid), userLocation ? 10 : 9, { duration: 1.1, easeLinearity: .18 })
  }, [scenarioRunId, userLocation])

  return <><div className="map-basemap-toolbar"><span><MapPin size={13} /> BASEMAP</span><button className={basemap === 'street' ? 'active' : ''} onClick={() => setBasemap('street')}>STREET</button><button className={basemap === 'satellite' ? 'active' : ''} onClick={() => setBasemap('satellite')}>SATELLITE</button><button className="location-button" onClick={requestLocation}>⌖ {locationStatus === 'FOUND' ? 'LOCATION FOUND' : locationStatus === 'REQUESTING' ? 'REQUESTING LOCATION…' : 'USE MY LOCATION'}</button><small>{basemap === 'satellite' ? 'ESRI WORLD IMAGERY' : 'ESRI WORLD STREET MAP'}</small></div><div className={`map-stage real-gis-stage phenomenon-${phenomenon.toLowerCase()} ${showChanges ? 'show-changes' : ''}`}><div ref={mapHost} className="leaflet-map" aria-label="Real Esri satellite GIS view with simulated convective overlays centered on the user location when permitted" /><div className="gis-atmosphere-label"><span className="status-dot cyan" /> REAL GIS / ESRI SATELLITE <small>{userLocation ? 'YOUR LOCATION · SIMULATED WEATHER OVERLAY' : 'SIMULATED WEATHER OVERLAY'}</small></div><div className="map-layer-panel"><div className="layer-panel-title"><Layers3 size={14} /> MAP LAYERS</div>{([['riskGrid', 'Risk field'], ['radar', 'Radar field'], ['tracks', 'Forecast track'], ['lightning', 'Lightning'], ['assets', 'Critical assets'], ['roads', 'Road network']] as [LayerKey, string][]).map(([key, label]) => <label className="layer-toggle" key={key}><input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} /><span className="toggle-ui" /><span>{label}</span></label>)}</div><div className="map-scale"><span className="north-arrow">N</span><span className="scale-line" /><span>REAL MAP · {Math.round(cell.speed)} km/h</span></div></div>
  </>
}

function MapLayerLegend() {
  return <div className="map-legend"><span><i className="legend-dot cyan" />Track</span><span><i className="legend-dot amber" />Forecast</span><span><i className="legend-dot red" />Risk core</span></div>
}

function TimelineBar({ snapshot, minute, isStreaming, setIsStreaming, onMinuteChange }: { snapshot: SimulationSnapshot; minute: number; isStreaming: boolean; setIsStreaming: (value: boolean) => void; onMinuteChange: (minute: number) => void }) {
  const forecastTimestamp = new Date(new Date(snapshot.timestamp).getTime() + 360 * 60000).toISOString()
  return <div className="timeline-bar"><div className="timeline-head"><div className="timeline-label"><button className="timeline-play" onClick={() => setIsStreaming(!isStreaming)}>{isStreaming ? <Pause size={14} /> : <Play size={14} />}</button><span>NOWCAST TIMELINE</span><b>T+{Math.round(minute).toString().padStart(2, '0')} MIN</b></div><div className="timeline-actions"><button onClick={() => onMinuteChange(0)}>NOW</button><button onClick={() => onMinuteChange(Math.min(360, minute + 15))}>+15 MIN</button><button onClick={() => onMinuteChange(Math.min(360, minute + 30))}>+30 MIN</button><button onClick={() => onMinuteChange(Math.min(360, minute + 60))}>+1 HR</button><span className="forecast-window">0–6 HR PROBABILISTIC FIELD</span></div></div><div className="timeline-track"><div className="timeline-progress" style={{ width: `${(minute / 360) * 100}%` }} /><div className="timeline-markers">{['NOW', '+15', '+30', '+45', '+60', '+2H', '+3H', '+4H', '+5H', '+6H'].map((marker, index) => <span key={marker} style={{ left: `${(index / 9) * 100}%` }}>{marker}</span>)}</div><input aria-label="Forecast timeline" type="range" min="0" max="360" step="1" value={Math.round(minute)} onChange={(event) => { onMinuteChange(Number(event.target.value)); setIsStreaming(false) }} /></div><div className="timeline-foot"><span>OBSERVED <b>{prettyTimestamp(new Date(new Date(snapshot.timestamp).getTime() - minute * 60000).toISOString())}</b></span><span className="timeline-now">CURRENT FRAME <b>{prettyTimestamp(snapshot.timestamp)}</b></span><span>FORECAST HORIZON <b>{prettyTimestamp(forecastTimestamp)}</b></span></div></div>
}

function IntelligenceRail({ snapshot, onNavigate, onRunScenario }: { snapshot: SimulationSnapshot; onNavigate: (view: ViewId) => void; onRunScenario: (scenario: ScenarioKey) => void }) {
  const cell = snapshot.cells[0]
  const primaryHazards = snapshot.hazards.filter((hazard) => hazard.key !== 'composite').slice(0, 3)
  return <aside className="intelligence-rail">
    <div className="rail-section rail-cell"><div className="rail-label-row"><span className="panel-kicker"><span className="status-dot red" /> SELECTED CELL</span><button className="rail-more" onClick={() => onNavigate('storm')} aria-label="Open selected cell details"><MoreDots /></button></div><div className="cell-title-row"><div><h2>{cell.name}</h2><div className="cell-id">{cell.id} · {cell.ageMinutes} MIN OLD</div></div><span className={`severity-chip ${classForSeverity(snapshot.severity)}`}>{snapshot.severity}</span></div><div className="cell-status"><span className="pulse-ring" /><b>{cell.lifecycle}</b><span className="divider-dot" /> intensity <strong>{cell.intensity}%</strong></div><div className="movement-row"><div className="movement-icon"><ArrowUpRight size={20} /></div><div><span>MOVING {cell.direction}</span><b>{cell.speed} km/h</b></div><div className="arrival-mini"><span>ARRIVAL</span><b>{formatEta(cell.arrivalMinutes)}</b></div></div></div>
    <div className="rail-section"><div className="section-title-row"><span>HAZARD PROBABILITY</span><span className="confidence-pill">{cell.confidence}% CONF.</span></div><div className="hazard-bars">{primaryHazards.map((hazard) => <div className="hazard-bar-row" key={hazard.key}><div className="hazard-bar-label"><span>{hazard.label}</span><b>{hazard.probability}%</b></div><div className="bar-track"><div className="bar-fill" style={{ width: `${hazard.probability}%`, background: hazard.color }} /></div><div className="hazard-bar-meta"><span>{hazard.value}</span><span className="trend-up">↗ {hazard.trend.toLowerCase()}</span></div></div>)}</div></div>
    <div className="rail-section why-section"><div className="section-title-row"><span>WHY HIGH RISK?</span><Info size={14} /></div><div className="why-list"><WhyRow label="Radar intensity" value="29%" /><WhyRow label="Lightning acceleration" value="24%" /><WhyRow label="Satellite cloud growth" value="18%" /><WhyRow label="Rainfall intensity" value="15%" /><WhyRow label="Wind / instability" value="14%" /></div><div className="evidence-list"><div className="evidence-title">EVIDENCE</div><span><Check size={13} /> Reflectivity increasing</span><span><Check size={13} /> Lightning density increasing</span><span><Check size={13} /> Cell moving toward target</span></div></div>
    <div className="rail-section impact-mini"><div className="section-title-row"><span>PROJECTED EXPOSURE</span><button className="text-link" onClick={() => onNavigate('impact')}>VIEW IMPACT <ArrowRight size={12} /></button></div><div className="impact-mini-grid"><MiniMetric icon={Building2} label="POPULATION" value={formatNumber(snapshot.impact.population)} /><MiniMetric icon={School} label="SCHOOLS" value={snapshot.impact.schools.toString()} /><MiniMetric icon={Hospital} label="HOSPITALS" value={snapshot.impact.hospitals.toString()} /><MiniMetric icon={Route} label="ROADS" value={snapshot.impact.roads.toString()} /></div></div>
    <div className="rail-action"><button className="primary-action" onClick={() => onNavigate('alerts')}><Siren size={15} /> OPEN RESPONSE BRIEF <ArrowRight size={15} /></button></div>
  </aside>
}

function MoreDots() { return <span className="more-dots"><i /><i /><i /></span> }
function WhyRow({ label, value }: { label: string; value: string }) { return <div className="why-row"><span>{label}</span><div className="why-line" /><b>{value}</b></div> }
function MiniMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div className="mini-metric"><Icon size={14} /><span>{label}</span><b>{value}</b></div> }

function DataHealthStrip({ sources, consensus, onNavigate }: { sources: DataSource[]; consensus: number; onNavigate: (view: ViewId) => void }) {
  return <div className="data-health-strip panel-surface"><div className="health-overview"><div className="panel-kicker"><Database size={14} /> DATA OBSERVATORY</div><b>Multi-source consensus</b><div className="consensus-score"><strong>{consensus}%</strong><span>MODEL AGREEMENT</span></div></div><div className="source-row">{sources.map((source) => <div className="source-chip" key={source.shortName}><span className={`status-dot ${source.status === 'ONLINE' ? 'green' : source.status === 'DELAYED' ? 'amber' : 'red'}`} /><span className="source-short">{source.shortName}</span><span className="source-status">{source.status}</span><span className="source-latency">{source.latency}</span></div>)}</div><button className="strip-link" onClick={() => onNavigate('observatory')}>OPEN OBSERVATORY <ArrowRight size={13} /></button></div>
}

function OperationalView({ view, snapshot, onNavigate, onMinuteChange, isStreaming, setIsStreaming, onRunScenario, settings, onSettingChange }: { view: Exclude<ViewId, 'command'>; snapshot: SimulationSnapshot; onNavigate: (view: ViewId) => void; onMinuteChange: (minute: number) => void; isStreaming: boolean; setIsStreaming: (value: boolean) => void; onRunScenario: (scenario: ScenarioKey) => void; settings: { showDemoBanner: boolean; reducedMotion: boolean; highContrast: boolean; autoStart: boolean }; onSettingChange: (key: 'showDemoBanner' | 'reducedMotion' | 'highContrast' | 'autoStart', value: boolean) => void }) {
  if (view === 'storm') return <StormView snapshot={snapshot} />
  if (view === 'hazards') return <HazardView snapshot={snapshot} />
  if (view === 'impact') return <ImpactView snapshot={snapshot} onNavigate={onNavigate} />
  if (view === 'alerts') return <AlertView snapshot={snapshot} />
  if (view === 'observatory') return <ObservatoryView snapshot={snapshot} />
  if (view === 'simulation') return <SimulationView snapshot={snapshot} onMinuteChange={onMinuteChange} isStreaming={isStreaming} setIsStreaming={setIsStreaming} onRunScenario={onRunScenario} />
  if (view === 'verification') return <VerificationView snapshot={snapshot} />
  if (view === 'analyst') return <AnalystView snapshot={snapshot} />
  return <SettingsView settings={settings} onSettingChange={onSettingChange} />
}

function ViewHeader({ eyebrow, title, body, action }: { eyebrow: string; title: string; body: string; action?: ReactNode }) { return <div className="view-header"><div><div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div><h2>{title}</h2><p>{body}</p></div>{action}</div> }

function StormView({ snapshot }: { snapshot: SimulationSnapshot }) {
  const cell = snapshot.cells[0]
  return <div className="view-stack"><ViewHeader eyebrow="DETECT → EXPLAIN" title="Storm intelligence" body="Trace the selected cell from initiation through probabilistic arrival." action={<span className={`severity-chip ${classForSeverity(snapshot.severity)}`}>{snapshot.severity} / {severityCopy[snapshot.severity]}</span>} /><div className="split-view"><div className="panel-surface fingerprint-panel"><div className="panel-header"><div><div className="panel-kicker"><Sparkles size={14} /> STORM FINGERPRINT</div><h3>STORM DNA / {cell.id}</h3></div><span className="demo-label">DEMONSTRATION DATA</span></div><StormFingerprint snapshot={snapshot} /></div><div className="panel-surface"><div className="panel-header"><div><div className="panel-kicker"><Activity size={14} /> CELL LIFECYCLE</div><h3>Evolution timeline</h3></div><span className="confidence-pill">{cell.confidence}% CONFIDENCE</span></div><LifecycleTimeline current={cell.lifecycle} /><div className="movement-detail"><div><span>CURRENT POSITION</span><b>{cell.centroid.x.toFixed(2)}°N / {cell.centroid.y.toFixed(2)}°E <small>normalized demo grid</small></b></div><div><span>VECTOR</span><b>{cell.direction} / {cell.speed} km/h</b></div><div><span>PREDICTED LIFETIME</span><b>{Math.round(94 - cell.intensity * .22)} min</b></div></div></div></div><div className="lower-grid"><div className="panel-surface"><PanelTitle icon={Clock3} title="What changed in the last 10 minutes?" meta="STREAM DELTA" /><div className="change-list">{snapshot.changes.map((change) => <div className="change-row" key={change.label}><span>{change.label}</span><b>{change.value}</b><span className={`change-trend ${change.trend}`}>{change.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}</span></div>)}</div><div className="change-summary"><span className="status-dot amber" /> Storm is rapidly intensifying.</div></div><div className="panel-surface"><PanelTitle icon={Search} title="Similar historical events" meta="DEMO MATCHES" /><div className="similar-list"><div className="similar-row current"><span className="similar-badge">NOW</span><b>{snapshot.scenarioLabel}</b><strong>100%</strong></div>{[['Event A / Salem 2024', '82%'], ['Event B / Erode 2022', '76%'], ['Event C / TN-08 2023', '68%']].map(([label, score]) => <div className="similar-row" key={label}><span className="similar-dot" /><b>{label}</b><strong>{score}</strong></div>)}</div></div></div></div>
}

function StormFingerprint({ snapshot }: { snapshot: SimulationSnapshot }) {
  const values = [snapshot.cells[0].intensity, snapshot.cells[0].intensity * .82, snapshot.cells[0].lightningRate, 68, snapshot.cells[0].windProbability, snapshot.cells[0].rainfallRate, 71]
  const points = values.map((value, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / values.length); const radius = 100 * value / 100; return `${180 + Math.cos(angle) * radius},${150 + Math.sin(angle) * radius}` }).join(' ')
  const outer = Array.from({ length: 7 }, (_, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / 7); return `${180 + Math.cos(angle) * 100},${150 + Math.sin(angle) * 100}` }).join(' ')
  return <div className="fingerprint-wrap"><svg viewBox="0 0 360 300" className="fingerprint-svg"><circle cx="180" cy="150" r="100" fill="none" stroke="#26464b" strokeDasharray="4 6" /><polygon points={outer} fill="none" stroke="#345b5f" strokeWidth="1" />{[40, 70, 100].map((radius) => <circle key={radius} cx="180" cy="150" r={radius} fill="none" stroke="#26464b" strokeWidth="1" opacity=".7" />)}<polygon points={points} fill="#39d6d0" fillOpacity=".18" stroke="#39d6d0" strokeWidth="2" />{values.map((value, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / values.length); return <circle key={index} cx={180 + Math.cos(angle) * 100 * value / 100} cy={150 + Math.sin(angle) * 100 * value / 100} r="4" fill="#b8fff0" /> })}{['Intensity', 'Growth rate', 'Lightning', 'Moisture', 'Wind', 'Rainfall', 'Vertical development'].map((label, index) => { const angle = -Math.PI / 2 + index * (Math.PI * 2 / 7); return <text key={label} x={180 + Math.cos(angle) * 126} y={154 + Math.sin(angle) * 126} textAnchor="middle" fill="#9ab8b8" fontSize="10">{label}</text> })}</svg><div className="fingerprint-caption"><span className="status-dot cyan" /> Evidence fusion across radar, satellite, lightning, wind and rainfall.</div></div>
}

function LifecycleTimeline({ current }: { current: string }) { const stages = ['INITIATING', 'DEVELOPING', 'INTENSIFYING', 'MATURE', 'DECAYING']; const currentIndex = stages.indexOf(current); return <div className="lifecycle-timeline">{stages.map((stage, index) => <div className={`lifecycle-step ${index <= currentIndex ? 'complete' : ''} ${stage === current ? 'current' : ''}`} key={stage}><div className="lifecycle-node">{index < currentIndex ? <Check size={12} /> : index + 1}</div><span>{stage}</span></div>)}</div> }
function PanelTitle({ icon: Icon, title, meta }: { icon: LucideIcon; title: string; meta: string }) { return <div className="panel-title"><div><Icon size={15} /><h3>{title}</h3></div><span>{meta}</span></div> }

function HazardView({ snapshot }: { snapshot: SimulationSnapshot }) {
  const [selectedHazard, setSelectedHazard] = useState<HazardKey>('composite')
  const [gridSize, setGridSize] = useState('1 km')
  const gridColumns = gridSize === '1 km' ? 12 : gridSize === '2 km' ? 8 : 6
  const gridRows = gridSize === '1 km' ? 8 : gridSize === '2 km' ? 6 : 4
  return <div className="view-stack"><ViewHeader eyebrow="FUSE → NOWCAST" title="Hazard explorer" body="Probabilistic 0–6 hour fields derived from the current synthetic sensor consensus." action={<div className="segmented-control">{['1 km', '2 km', '3 km'].map((size) => <button key={size} className={gridSize === size ? 'active' : ''} onClick={() => setGridSize(size)}>{size}</button>)}</div>} /><div className="hazard-layout"><div className="panel-surface hazard-map-card"><div className="hazard-map-top"><div><div className="panel-kicker"><Grid3X3 size={14} /> {gridSize.toUpperCase()} RISK GRID</div><h3>Composite hazard field</h3></div><span className="demo-label">PROTOTYPE ESTIMATE</span></div><div className="hazard-matrix" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>{Array.from({ length: gridColumns * gridRows }, (_, index) => { const x = index % gridColumns; const y = Math.floor(index / gridColumns); const risk = Math.max(0, Math.min(1, 1 - Math.hypot(x - (gridColumns - 1) / 2, y - (gridRows - 1) / 2) / Math.max(gridColumns, gridRows))); return <button key={index} className="hazard-cell" style={{ background: `rgba(${risk > .66 ? '255,110,99' : risk > .35 ? '255,181,71' : '57,214,208'}, ${.12 + risk * .55})` }} onClick={() => setSelectedHazard(risk > .65 ? 'composite' : 'rainfall')} aria-label={`Risk cell ${index + 1}`}><span /></button> })}<div className="hazard-origin"><span className="pulse-ring" /><b>VX-01</b></div></div><div className="hazard-map-footer"><span><i className="gradient-line" /> LOW <b>0%</b></span><span>MODEL CONFIDENCE <b>{snapshot.confidence}%</b></span><span>HIGH <b>100%</b></span></div></div><div className="panel-surface hazard-side"><PanelTitle icon={CloudLightning} title="Hazard breakdown" meta="NOWCAST" /><div className="hazard-selector">{snapshot.hazards.map((hazard) => <button key={hazard.key} className={selectedHazard === hazard.key ? 'active' : ''} onClick={() => setSelectedHazard(hazard.key)}><span className="selector-dot" style={{ background: hazard.color }} /><span>{hazard.label}</span><b>{hazard.probability}%</b></button>)}</div><div className="hazard-detail"><div className="detail-label">{snapshot.hazards.find((hazard) => hazard.key === selectedHazard)?.label.toUpperCase()} PROBABILITY</div><div className="big-risk-value">{snapshot.hazards.find((hazard) => hazard.key === selectedHazard)?.probability}<small>%</small></div><div className="detail-row"><span>Confidence</span><b>{snapshot.hazards.find((hazard) => hazard.key === selectedHazard)?.confidence}% · model agreement</b></div><div className="detail-row"><span>Trend</span><b className="text-amber">↗ Rising across last 10 minutes</b></div><div className="why-box"><strong>WHY THIS VALUE?</strong><p>Reflectivity growth, lightning acceleration, cloud-top cooling and storm motion are contributing to this prototype estimate.</p></div></div></div></div><div className="hazard-cards">{snapshot.hazards.slice(0, 4).map((hazard) => <div className="panel-surface hazard-summary-card" key={hazard.key}><div className="summary-card-top"><span className="selector-dot" style={{ background: hazard.color }} /><span>{hazard.label}</span><span className="summary-trend">↗</span></div><b>{hazard.probability}%</b><div className="summary-bar"><span style={{ width: `${hazard.probability}%`, background: hazard.color }} /></div><small>{hazard.value} · {hazard.confidence}% confidence</small></div>)}</div></div>
}

function ImpactView({ snapshot, onNavigate }: { snapshot: SimulationSnapshot; onNavigate: (view: ViewId) => void }) {
  const [impactMode, setImpactMode] = useState<Mode>('EMERGENCY')
  const [routeSelection, setRouteSelection] = useState<'origin' | 'destination'>('origin')
  const impactFactor = impactMode === 'EMERGENCY' ? 1.08 : impactMode === 'AVIATION' ? 0.86 : impactMode === 'AGRICULTURE' ? 1.14 : 1.02
  const modeSnapshot = useMemo(() => createSnapshot(snapshot.scenario, snapshot.minute, impactFactor), [snapshot.scenario, snapshot.minute, impactFactor])
  const ImpactModeIcon = { EMERGENCY: Siren, AVIATION: Plane, AGRICULTURE: Tractor, URBAN: Building2 }[impactMode]
  const assets = [{ label: 'Population', value: formatNumber(modeSnapshot.impact.population), detail: 'exposed within risk cone', icon: Building2 }, { label: 'Villages', value: modeSnapshot.impact.villages.toString(), detail: 'intersected by field', icon: MapPin }, { label: 'Schools', value: modeSnapshot.impact.schools.toString(), detail: 'within 1 km grid', icon: School }, { label: 'Hospitals', value: modeSnapshot.impact.hospitals.toString(), detail: 'response assets', icon: Hospital }, { label: 'Major roads', value: modeSnapshot.impact.roads.toString(), detail: 'route segments', icon: Route }, { label: 'Power substations', value: modeSnapshot.impact.substations.toString(), detail: 'critical infrastructure', icon: ZapIcon }, { label: 'Agricultural area', value: `${modeSnapshot.impact.agricultureKm2} km²`, detail: 'crop exposure estimate', icon: Tractor }, { label: 'Airports', value: modeSnapshot.impact.airports.toString(), detail: 'aviation watch', icon: Plane }]
  return <div className="view-stack"><ViewHeader eyebrow="IMPACT" title="Impact intelligence" body="Convert probabilistic hazard into an operational exposure picture." action={<div className="mode-tabs">{(['EMERGENCY', 'AVIATION', 'AGRICULTURE', 'URBAN'] as Mode[]).map((item) => <button key={item} className={impactMode === item ? 'active' : ''} onClick={() => setImpactMode(item)}>{item}</button>)}</div>} /><div className="impact-mode-banner panel-surface"><div className="mode-banner-icon"><ImpactModeIcon size={22} /></div><div><span>{impactMode} MODE</span><b>{impactMode === 'EMERGENCY' ? 'Population, shelters, roads and hospitals prioritized' : impactMode === 'AVIATION' ? 'Airports, lightning, wind and arrival times prioritized' : impactMode === 'AGRICULTURE' ? 'Crop zones, hail, wind and rainfall prioritized' : 'Schools, hospitals, roads and dense population prioritized'}</b></div><span className="mode-banner-status"><span className="status-dot cyan" /> Overlay synchronized</span></div><div className="asset-grid">{assets.map((asset) => <div className="panel-surface asset-card" key={asset.label}><div className="asset-card-icon"><asset.icon size={16} /></div><span>{asset.label}</span><b>{asset.value}</b><small>{asset.detail}</small></div>)}</div><div className="impact-lower"><div className="panel-surface route-card"><PanelTitle icon={Route} title="Route-risk prototype" meta="DEMO ROUTE" /><div className="route-fields"><button onClick={() => setRouteSelection('origin')} className={routeSelection === 'origin' ? 'route-selected' : ''}><span>ORIGIN</span><b>Coimbatore Central</b><ArrowRight size={15} /></button><button onClick={() => setRouteSelection('destination')} className={routeSelection === 'destination' ? 'route-selected' : ''}><span>DESTINATION</span><b>Tiruppur North</b><MapPin size={15} /></button></div><div className="route-map"><div className="route-line" /><span className="route-pin start">A</span><span className="route-pin end">B</span><div className="route-risk-chip"><AlertTriangle size={13} /> MODERATE RISK · 38 MIN</div></div><div className="route-metrics"><span><b>31%</b> current risk</span><span><b>58%</b> +30 min</span><span><b>2</b> storm crossings</span><span><b>HIGH</b> lightning exposure</span></div></div><div className="panel-surface exposure-card"><PanelTitle icon={Target} title="Priority response" meta="ACTION QUEUE" /><div className="priority-list"><div><span className="priority-number">01</span><div><b>Coimbatore urban sector</b><small>{formatNumber(modeSnapshot.impact.population)} people in projected path</small></div><span className="severity-chip severity-warning">WATCH</span></div><div><span className="priority-number">02</span><div><b>NH-81 / Tiruppur corridor</b><small>{modeSnapshot.impact.roads} road segments with heavy-rain exposure</small></div><span className="severity-chip severity-alert">ALERT</span></div><div><span className="priority-number">03</span><div><b>Southern crop belt</b><small>{modeSnapshot.impact.agricultureKm2} km² agricultural exposure</small></div><span className="severity-chip severity-watch">MONITOR</span></div></div><button className="secondary-action" onClick={() => onNavigate('alerts')}>OPEN ALERT CENTER <ArrowRight size={14} /></button></div></div></div>
}
function ZapIcon(props: { size?: number }) { return <span className="zap-placeholder" style={{ fontSize: props.size ? `${props.size}px` : undefined }}>ϟ</span> }

function AlertView({ snapshot }: { snapshot: SimulationSnapshot }) {
  const [language, setLanguage] = useState('English')
  const [copied, setCopied] = useState(false)
  const alertText = languageMessage[language]
  const copyAlert = async () => { await navigator.clipboard?.writeText(alertText); setCopied(true); window.setTimeout(() => setCopied(false), 1600) }
  const readAlert = () => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(alertText)) } }
  return <div className="view-stack"><ViewHeader eyebrow="IMPACT → WARN" title="Alert center" body="Generate evidence-backed prototype alerts for geo-targeted response." action={<span className={`severity-chip ${classForSeverity(snapshot.severity)}`}>{snapshot.severity} · {severityCopy[snapshot.severity]}</span>} /><div className="alert-layout"><div className="panel-surface alert-builder"><div className="alert-builder-header"><div><div className="panel-kicker"><Siren size={14} /> WARNING COMPOSER</div><h3>Severe thunderstorm alert</h3></div><span className="demo-label">PROTOTYPE OUTPUT</span></div><div className="alert-form-grid"><div className="form-field"><label>AFFECTED AREA</label><b>Coimbatore sector · NH-81 corridor</b></div><div className="form-field"><label>ESTIMATED ARRIVAL</label><b>35–50 minutes · {formatEta(snapshot.nextArrivalMinutes)}</b></div><div className="form-field"><label>HAZARDS</label><b>Lightning · heavy rainfall · damaging wind</b></div><div className="form-field"><label>CONFIDENCE</label><b>{snapshot.confidence}% · model agreement</b></div></div><div className="alert-language-row"><span>SELECT OUTPUT LANGUAGE</span><div className="language-pills">{Object.keys(languageLabels).map((item) => <button key={item} className={language === item ? 'active' : ''} onClick={() => setLanguage(item)}>{languageLabels[item]}<small>{item}</small></button>)}</div></div><div className="alert-preview"><div className="alert-preview-top"><span className="severity-chip severity-severe"><Siren size={12} /> SEVERE THUNDERSTORM ALERT</span><span className="preview-meta">{language} · GENERATED NOW</span></div><p>{alertText}</p><div className="recommended-action"><strong>RECOMMENDED ACTION</strong><span>Move indoors, avoid exposed areas and delay travel through the projected path.</span></div></div><div className="alert-actions"><button className="primary-action" onClick={readAlert}><Volume2 size={15} /> READ ALERT</button><button className="secondary-action" onClick={copyAlert}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'COPIED' : 'COPY ALERT'}</button><button className="secondary-action" onClick={() => window.print()}><Printer size={15} /> PRINT</button><button className="secondary-action" onClick={() => window.alert('CAP-style prototype generated. Connect your gateway before operational use.')}><Download size={15} /> CAP / SMS</button></div></div><div className="alert-side"><div className="panel-surface"><PanelTitle icon={ShieldAlert} title="Severity ladder" meta="EVIDENCE-LED" /><div className="severity-ladder">{(['NORMAL', 'WATCH', 'ALERT', 'WARNING', 'SEVERE'] as Severity[]).map((item) => <div className={item === snapshot.severity ? 'active' : ''} key={item}><span className={`ladder-dot ${classForSeverity(item)}`} /><b>{item}</b><small>{severityCopy[item]}</small>{item === snapshot.severity && <Check size={14} />}</div>)}</div></div><div className="panel-surface alert-sources"><PanelTitle icon={Radio} title="Evidence bundle" meta="LIVE SNAPSHOT" /><div className="evidence-bundle"><span><Check size={13} /> Radar intensity {snapshot.cells[0].reflectivity} dBZ</span><span><Check size={13} /> Lightning rate {snapshot.cells[0].lightningRate} fl/min</span><span><Check size={13} /> Motion {snapshot.cells[0].speed} km/h {snapshot.cells[0].direction}</span><span><Check size={13} /> Data consensus {snapshot.consensus}%</span></div></div></div></div></div>
}

function ObservatoryView({ snapshot }: { snapshot: SimulationSnapshot }) { return <div className="view-stack"><ViewHeader eyebrow="OBSERVE → FUSE" title="Data observatory" body="Every forecast carries a timestamp, source, quality, latency and confidence." action={<div className="observatory-status"><span className="status-dot green" /> 4 / 5 sources healthy</div>} /><div className="observatory-grid">{snapshot.sources.map((source) => <SourceCard source={source} key={source.shortName} />)}</div><div className="observatory-lower"><div className="panel-surface"><PanelTitle icon={Waves} title="Multi-source consensus" meta="CURRENT RUN" /><div className="consensus-visual"><div className="consensus-ring"><strong>{snapshot.consensus}%</strong><span>AGREEMENT</span></div><div className="consensus-bars">{snapshot.sources.map((source) => <div key={source.shortName}><span>{source.shortName}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${source.confidence}%`, background: source.status === 'DELAYED' ? '#ffb547' : '#39d6d0' }} /></div><b>{source.confidence}%</b></div>)}</div></div></div><div className="panel-surface fallback-card"><PanelTitle icon={RefreshCw} title="Fallback protocol" meta="AUTOMATIC" /><div className="fallback-callout"><WifiOff size={18} /><div><b>Forecast remains functional if a source fails.</b><p>Last valid radar frame + satellite + lightning + environmental data are retained. Confidence is reduced and the operator is notified.</p></div></div><div className="fallback-steps"><span>1. Detect gap</span><ArrowRight size={13} /><span>2. Retain last frame</span><ArrowRight size={13} /><span>3. Reweight evidence</span></div></div></div></div> }
function SourceCard({ source }: { source: DataSource }) { return <div className={`panel-surface source-card ${source.status.toLowerCase()}`}><div className="source-card-top"><div className="source-card-icon"><RadioTower size={18} /></div><span className={`source-status-pill ${source.status.toLowerCase()}`}><span className="status-dot" /> {source.status}</span></div><div className="source-card-name">{source.name}</div><div className="source-card-code">{source.shortName} / DEMO FEED</div><div className="source-card-stats"><div><span>LATENCY</span><b>{source.latency}</b></div><div><span>QUALITY</span><b>{source.quality}</b></div><div><span>CONFIDENCE</span><b>{source.confidence}%</b></div></div>{source.note && <div className="source-card-note"><AlertTriangle size={13} /> {source.note}</div>}</div> }

function SimulationView({ snapshot, onMinuteChange, isStreaming, setIsStreaming, onRunScenario }: { snapshot: SimulationSnapshot; onMinuteChange: (minute: number) => void; isStreaming: boolean; setIsStreaming: (value: boolean) => void; onRunScenario: (scenario: ScenarioKey) => void }) {
  const [replay, setReplay] = useState('LIVE')
  const [runMessage, setRunMessage] = useState('Select a scenario to launch it on the GIS canvas.')
  const replayMinutes: Record<string, number> = { '15 MIN': 15, '30 MIN': 30, '60 MIN': 60, '3 HR': 180 }
  const hasRun = isStreaming || snapshot.minute > 0
  const run = (scenario: ScenarioKey, label: string) => {
    setReplay('LIVE')
    setRunMessage(`${label} launched · map camera focusing on the active cell`)
    onRunScenario(scenario)
  }
  const setReplayWindow = (item: string) => {
    setReplay(item)
    if (item === 'LIVE') { if (!isStreaming && snapshot.minute === 0) { setRunMessage('Launch a scenario first · LIVE resumes only after an explicit run.'); return } setIsStreaming(true); setRunMessage('Live scenario playback resumed on the GIS canvas.'); return }
    setIsStreaming(false)
    onMinuteChange(Math.max(0, snapshot.minute - replayMinutes[item]))
    setRunMessage(`Replay window set to ${item} · all map layers synchronized.`)
  }
  return <div className="view-stack">
    <ViewHeader eyebrow="SIMULATION LAB" title="Replay the atmosphere" body="Launch a deterministic event and watch the same scenario state drive the GIS view, storm volume, hazard field and impact corridor." action={<div className="replay-pills">{['LIVE', '15 MIN', '30 MIN', '60 MIN', '3 HR'].map((item) => <button key={item} className={replay === item ? 'active' : ''} onClick={() => setReplayWindow(item)}>{item}</button>)}</div>} />
    <div className="simulation-status-bar"><span className={`status-dot ${isStreaming ? 'cyan' : 'amber'}`} /><b>{runMessage}</b><span className="simulation-status-meta">{isStreaming ? 'PLAYING' : 'STOPPED'} · T+{Math.round(snapshot.minute)} MIN</span><button className="stop-simulation-button" onClick={() => { setIsStreaming(false); setRunMessage('Simulation stopped · press RUN SCENARIO to start the selected event again.') }} disabled={!isStreaming}><Square size={12} fill="currentColor" /> STOP SIMULATION</button></div>
    <div className="scenario-grid">{SCENARIOS.map((item) => { const active = isStreaming && snapshot.scenario === item.key; const selectedStopped = !isStreaming && snapshot.scenario === item.key && snapshot.minute > 0; return <button className={`panel-surface scenario-card ${active ? 'active' : ''}`} key={item.key} onClick={() => run(item.key, item.label)}><div className="scenario-accent" style={{ background: item.accent }} /><div className="scenario-card-top"><span className="scenario-number">0{SCENARIOS.indexOf(item) + 1}</span><span className="scenario-status">{active ? 'RUNNING ON MAP' : selectedStopped ? 'SELECTED · STOPPED' : 'READY TO LAUNCH'}</span></div><h3>{item.label}</h3><p>{item.descriptor}</p><div className="scenario-sparkline"><span style={{ background: item.accent, width: `${32 + SCENARIOS.indexOf(item) * 8}%` }} /></div><div className="scenario-footer"><span>{active ? <Pause size={13} /> : <Play size={13} />} {active ? 'RUNNING' : selectedStopped ? 'RUN AGAIN' : 'RUN SCENARIO'}</span><ArrowRight size={14} /></div></button>})}</div>
    <div className="simulation-lower"><div className="panel-surface stream-log"><PanelTitle icon={Radio} title="Synthetic sensor stream" meta="EVENT LOG" /><div className="log-list"><LogRow time="11:34:21" label="RADAR" text="Reflectivity growth detected in cell VX-01" tone="cyan" /><LogRow time="11:34:12" label="LIGHTNING" text={`Flash rate accelerated to ${snapshot.cells[0].lightningRate} fl/min`} tone="yellow" /><LogRow time="11:33:58" label="SATELLITE" text="Cloud-top cooling signature confirmed" tone="blue" /><LogRow time="11:33:41" label="FUSION" text={`Consensus now ${snapshot.consensus}% across 5 sources`} tone="green" /></div></div><div className="panel-surface simulation-run"><div className="run-visual"><div className={`run-ring ${isStreaming ? 'is-playing' : ''}`}><span className="status-dot amber" /><b>{Math.round(snapshot.minute)} min</b><small>SIM CLOCK</small></div></div><div><div className="panel-kicker"><RefreshCw size={14} /> {hasRun ? 'ACTIVE SCENARIO' : 'AWAITING SCENARIO'}</div><h3>{hasRun ? snapshot.scenarioLabel : 'No scenario launched'}</h3><p>{hasRun ? 'The command-center map is the playback surface. Running a scenario resets the clock, focuses the storm and synchronizes all GIS layers.' : 'Choose a scenario above to place its animation on the selected cell. Nothing runs automatically.'}</p><button className="primary-action" onClick={() => run(snapshot.scenario, snapshot.scenarioLabel)} disabled={!hasRun}><RotateCcwIcon /> {hasRun ? 'RUN AGAIN ON MAP' : 'SELECT A SCENARIO ABOVE'}</button></div></div></div>
  </div>
}
function RotateCcwIcon() { return <RefreshCw size={15} /> }
function LogRow({ time, label, text, tone }: { time: string; label: string; text: string; tone: string }) { return <div className="log-row"><span className="log-time">{time}</span><span className={`log-dot ${tone}`} /><b>{label}</b><span>{text}</span></div> }

function VerificationView({ snapshot }: { snapshot: SimulationSnapshot }) { const metrics = [['MAE', '8.4 mm/h', '↓ 12%'], ['RMSE', '14.2 mm/h', '↓ 8%'], ['POD', '0.81', '↑ 4%'], ['FAR', '0.18', '↓ 3%'], ['CSI', '0.72', '↑ 7%'], ['Precision', '0.84', '↑ 5%'], ['Recall', '0.81', '↑ 6%'], ['F1', '0.82', '↑ 5%']]; return <div className="view-stack"><ViewHeader eyebrow="VERIFY" title="Model verification" body="Synthetic post-event comparison for the current demonstration scenario." action={<span className="demo-label">SYNTHETIC OBSERVATIONS</span>} /><div className="verification-top"><div className="panel-surface verification-chart"><PanelTitle icon={BarChart3} title="Predicted vs observed rainfall" meta="COIMBATORE / 60 MIN" /><div className="chart-area"><div className="chart-y-labels"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div><div className="chart-bars">{[34, 52, 48, 70, 63, 79, 58, 67, 45, 54, 39, 31].map((height, index) => <div className="chart-column" key={index}><div className="chart-bar observed" style={{ height: `${height * .68}%` }} /><div className="chart-bar predicted" style={{ height: `${height}%` }} /><span>{index * 5}m</span></div>)}</div></div><div className="chart-legend"><span><i className="legend-square cyan" /> Predicted rainfall</span><span><i className="legend-square amber" /> Observed rainfall</span><span className="chart-note">Arrival error <b>+07 min</b></span></div></div><div className="panel-surface verification-score"><div className="panel-kicker"><Target size={14} /> FORECAST RUN</div><div className="score-number">{snapshot.confidence}<small>%</small></div><b>Operational confidence proxy</b><p>Derived from agreement, availability and synthetic skill scores.</p><div className="score-line"><span>Arrival window</span><strong>+07 min</strong></div><div className="score-line"><span>Rainfall bias</span><strong>+4.2 mm/h</strong></div></div></div><div className="metrics-grid">{metrics.map(([label, value, delta]) => <div className="panel-surface metric-card" key={label}><span>{label}</span><b>{value}</b><small className={delta.startsWith('↑') ? 'positive' : 'negative'}>{delta} vs prior run</small></div>)}</div><div className="verification-note"><Info size={15} /><span>These are demonstration metrics using synthetic or historical demo data. Replace with observational ground truth before operational deployment.</span></div></div> }

function AnalystView({ snapshot }: { snapshot: SimulationSnapshot }) { const [question, setQuestion] = useState('Why is this cell classified as severe?'); const [answer, setAnswer] = useState(''); const prompts = ['Will this storm affect Coimbatore in the next hour?', 'Why is this cell classified as severe?', 'When will the storm reach this location?', 'What hazards are expected?', 'What changed in the last 10 minutes?']; const submit = (prompt = question) => { setQuestion(prompt); if (prompt.startsWith('Will')) setAnswer(`Yes. CELL-01 is moving ${snapshot.cells[0].direction} at ${snapshot.cells[0].speed} km/h with an estimated arrival in ${formatEta(snapshot.nextArrivalMinutes)}. The projected path intersects the Coimbatore sector with ${snapshot.confidence}% model confidence.`); else if (prompt.startsWith('Why')) setAnswer(`This cell is classified as ${snapshot.severity.toLowerCase()} because reflectivity is ${snapshot.cells[0].reflectivity} dBZ, lightning is accelerating at ${snapshot.cells[0].lightningRate} flashes/minute, and the composite hazard probability is ${snapshot.hazards[0].probability}%.`); else if (prompt.startsWith('When')) setAnswer(`Prototype arrival estimate: ${formatEta(snapshot.nextArrivalMinutes)}. This is a probabilistic prediction, not an absolute certainty.`); else if (prompt.startsWith('What hazards')) setAnswer(`Expected hazards are lightning (${snapshot.cells[0].lightningRate}% probability), heavy rainfall (${snapshot.cells[0].rainfallRate} mm/h), wind (${snapshot.cells[0].windProbability}%) and hail (${snapshot.cells[0].hailProbability}%).`); else if (prompts.includes(prompt)) setAnswer(`In the last ten minutes, lightning is up ${snapshot.changes[0].value}, reflectivity is up ${snapshot.changes[1].value}, and storm area is up ${snapshot.changes[2].value}. Storm is rapidly intensifying.`); else setAnswer('Insufficient current data.') }; return <div className="view-stack"><ViewHeader eyebrow="EXPLAIN" title="TropoTrace Analyst" body="A structured-data-only assistant for the current demonstration snapshot." action={<span className="analyst-badge"><span className="status-dot cyan" /> NO HALLUCINATED VALUES</span>} /><div className="analyst-layout"><div className="panel-surface analyst-chat"><div className="analyst-chat-head"><div className="analyst-avatar"><Bot size={20} /></div><div><b>TROPOTRACE ANALYST</b><span>Current application data only</span></div><span className="analyst-live"><span className="status-dot green" /> READY</span></div><div className="prompt-list">{prompts.map((prompt) => <button key={prompt} onClick={() => submit(prompt)}><Sparkles size={14} /> {prompt}</button>)}</div><div className="analyst-input-row"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Ask about the current storm…" /><button onClick={() => submit()} aria-label="Ask TropoTrace Analyst"><Send size={16} /></button></div></div><div className="panel-surface analyst-answer"><div className="panel-kicker"><Bot size={14} /> RESPONSE / {snapshot.timestamp.slice(11, 16)} UTC</div>{answer ? <><div className="answer-label">STRUCTURED ANSWER</div><p>{answer}</p><div className="answer-sources"><span><Check size={13} /> Cell state</span><span><Check size={13} /> Hazard fields</span><span><Check size={13} /> Impact model</span></div></> : <div className="answer-empty"><Bot size={30} /><b>Ask TropoTrace about the live picture</b><span>Answers are generated only from the structured demonstration snapshot.</span></div>}<div className="analyst-fallback"><Info size={13} /> If data is unavailable, the assistant will say: <b>Insufficient current data.</b></div></div></div></div> }

function SettingsView({ settings, onSettingChange }: { settings: { showDemoBanner: boolean; reducedMotion: boolean; highContrast: boolean; autoStart: boolean }; onSettingChange: (key: 'showDemoBanner' | 'reducedMotion' | 'highContrast' | 'autoStart', value: boolean) => void }) { return <div className="view-stack"><ViewHeader eyebrow="CONTROL ROOM" title="System settings" body="Presentation controls and integration readiness for the Antigravity handoff." action={<span className="demo-label">SAFE DEMO ENVIRONMENT</span>} /><div className="settings-layout"><div className="panel-surface settings-card"><PanelTitle icon={SlidersHorizontal} title="Display preferences" meta="LOCAL ONLY" /><SettingRow label="Demo mode banner" description="Keep prototype data disclosure visible in the command center." value={settings.showDemoBanner} onChange={(value) => onSettingChange('showDemoBanner', value)} /><SettingRow label="Reduced motion" description="Respect motion-sensitive users and minimize map effects." value={settings.reducedMotion} onChange={(value) => onSettingChange('reducedMotion', value)} /><SettingRow label="High contrast labels" description="Increase text and severity indicator contrast." value={settings.highContrast} onChange={(value) => onSettingChange('highContrast', value)} /><SettingRow label="Auto-start default scenario" description="Begin with a rapidly intensifying storm on load." value={settings.autoStart} onChange={(value) => onSettingChange('autoStart', value)} /></div><div className="panel-surface settings-card"><PanelTitle icon={Database} title="Firebase integration" meta="READY FOR CONNECTION" /><div className="integration-callout"><div className="integration-icon"><Wifi size={18} /></div><div><b>{firebaseConnectionLabel}</b><p>Add browser-safe `VITE_FIREBASE_*` values in Antigravity, then connect Auth and Firestore through the provider seam.</p></div></div><div className="integration-list"><span><Check size={14} /> Auth-safe client boundary prepared</span><span><Check size={14} /> Demo provider works without Firebase</span><span><Check size={14} /> Firestore persistence documented</span><span><Check size={14} /> No service-account keys in frontend</span></div><button className="secondary-action" onClick={() => window.alert('Firebase handoff checklist is documented in README.md and ARCHITECTURE.md.')}><Download size={14} /> VIEW HANDOFF CHECKLIST</button></div><div className="panel-surface settings-card full"><PanelTitle icon={Info} title="Prototype boundary" meta="IMPORTANT" /><p className="boundary-copy">TropoTrace is a demonstration model using deterministic synthetic radar, satellite, lightning and environmental streams. It is not operational meteorological guidance and does not claim integration with government alert infrastructure.</p><div className="boundary-tags"><span>Prototype estimate</span><span>Probabilistic prediction</span><span>Simulated sensor stream</span><span>Model confidence</span></div></div></div></div> }
function SettingRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) { return <div className="setting-row"><div><b>{label}</b><span>{description}</span></div><button className={`switch ${value ? 'active' : ''}`} onClick={() => onChange(!value)} aria-label={`Toggle ${label}`} aria-pressed={value}><span /></button></div> }

function LoginPage({ theme, onSuccess }: { theme: 'dark' | 'light'; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (isSignUp) {
        const cred = await createAccount(email.trim(), password)
        await saveUserProfile(cred.user.uid, { email: cred.user.email ?? email.trim(), role: 'operator' })
      } else {
        await signInWithEmail(email.trim(), password)
      }
      // Auth state change is handled by onAuthStateChanged listener
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      // Friendly error messages
      if (message.includes('user-not-found') || message.includes('invalid-credential')) setError('No account found. Check your email/password or create an account.')
      else if (message.includes('wrong-password')) setError('Incorrect password. Please try again.')
      else if (message.includes('email-already-in-use')) setError('This email is already registered. Try signing in instead.')
      else if (message.includes('weak-password')) setError('Password must be at least 6 characters.')
      else if (message.includes('invalid-email')) setError('Please enter a valid email address.')
      else setError(message)
      setIsSubmitting(false)
    }
  }
  return <main className={`login-screen theme-${theme}`}>
    <div className="login-atmosphere" />
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-brand"><div className="brand-mark"><span /><span /><span /><span /></div><div><div className="brand-name">TROPO<span>TRACE</span></div><div className="brand-subtitle">CONVECTIVE INTELLIGENCE</div></div></div>
      <div className="login-kicker"><LockKeyhole size={14} /> SECURE OPERATOR ACCESS</div><h1 id="login-title">{isSignUp ? 'Create your account' : 'Enter the command center'}</h1><p className="login-lede">{isSignUp ? 'Create an operator account to access the TropoTrace convective intelligence workspace.' : 'Sign in to open the TropoTrace convective intelligence workspace and replay the deterministic weather model.'}</p>
      <form className="login-form" onSubmit={submit}><label htmlFor="login-email">Operator email</label><input id="login-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="operator@tropotrace.app" autoComplete="username" required /><label htmlFor="login-password">Password</label><div className="login-password-wrap"><input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'HIDE' : 'SHOW'}</button></div>{error && <div className="login-error" role="alert">{error}</div>}<button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'AUTHENTICATING…' : isSignUp ? 'CREATE ACCOUNT' : 'ENTER COMMAND CENTER'} <ArrowRight size={16} /></button></form>
      <div className="demo-credentials"><div><span className="demo-credentials-label">{isSignUp ? 'ALREADY HAVE AN ACCOUNT?' : 'NEW TO TROPOTRACE?'}</span><span className="demo-credentials-note">{isSignUp ? 'Sign in with your existing operator credentials.' : 'Create an account to start using the command center.'}</span></div><button type="button" onClick={() => { setIsSignUp((v) => !v); setError('') }}>{isSignUp ? 'SIGN IN' : 'CREATE ACCOUNT'}</button></div><p className="login-boundary">Authentication is powered by Firebase. Your credentials are encrypted and never stored in the browser.</p>
    </section>
  </main>
}

export default App
