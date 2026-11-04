import type { SimulationSnapshot, StormCell } from './types'

export type ImpactTwinHazard =
  | 'LIGHTNING'
  | 'THUNDERSTORM'
  | 'CLOUDBURST'
  | 'EXTREME_RAINFALL'
  | 'HAILSTORM'
  | 'COMPOSITE'

export type WorkflowStageId =
  | 'STAGE_1_DETECTION'
  | 'STAGE_2_IMPACT_ZONE'
  | 'STAGE_3_POPULATION'
  | 'STAGE_4_INFRASTRUCTURE'
  | 'STAGE_5_ANALYSIS'
  | 'STAGE_6_PRECAUTIONS'
  | 'STAGE_7_DECISION'

export type DecisionStatus =
  | 'RECOMMENDED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'IMPLEMENTED'

export type AssetVulnerability = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export interface TwinAsset {
  id: string
  name: string
  category: 'HIGHWAY' | 'UNDERPASS' | 'GRID' | 'AVIATION' | 'HOSPITAL' | 'INDUSTRIAL' | 'AGRICULTURE' | 'COMMUNITY'
  lat: number
  lng: number
  hazardFocus: ImpactTwinHazard[]
  vulnerability: AssetVulnerability
  impactTitle: string
  impactDescription: string
  recommendedAction: string
  evidenceSources: string[]
  decisionStatus: DecisionStatus
  timeToImpactMin: number
  populationExposed: number
  criticalityIndex: number
  statusNote: string
}

export interface WorkflowStageInfo {
  id: WorkflowStageId
  stepNumber: number
  title: string
  shortLabel: string
  description: string
  summary: string
  activeMapHighlight: 'detection' | 'zones' | 'population' | 'infrastructure' | 'analysis' | 'precautions' | 'decision'
}

export const WORKFLOW_STAGES: WorkflowStageInfo[] = [
  {
    id: 'STAGE_1_DETECTION',
    stepNumber: 1,
    title: 'Hazard Detection & Radar Acquisition',
    shortLabel: '1. HAZARD DETECTION',
    description: 'Doppler S-Band radar sweeps and ground lightning networks acquire the intensifying convective core.',
    summary: 'Storm cell acquired; kinematic motion vectors and reflectivity gradient locked.',
    activeMapHighlight: 'detection',
  },
  {
    id: 'STAGE_2_IMPACT_ZONE',
    stepNumber: 2,
    title: 'Impact Zone & Risk Envelope Generation',
    shortLabel: '2. IMPACT ZONES',
    description: 'Primary core and secondary risk boundaries are projected across terrain along projected storm motion.',
    summary: 'Dynamic 15 km swath calculated across Coimbatore–Tiruppur transportation corridor.',
    activeMapHighlight: 'zones',
  },
  {
    id: 'STAGE_3_POPULATION',
    stepNumber: 3,
    title: 'Population Exposure & Demographic Modeling',
    shortLabel: '3. POPULATION RISK',
    description: 'Spatial census mesh estimates vulnerable urban and rural populations within the hazard swath.',
    summary: 'Estimated population in sector vs. directly exposed vulnerable clusters identified.',
    activeMapHighlight: 'population',
  },
  {
    id: 'STAGE_4_INFRASTRUCTURE',
    stepNumber: 4,
    title: 'Critical Infrastructure & Asset Exposure',
    shortLabel: '4. INFRASTRUCTURE',
    description: 'Highway corridors, subway underpasses, electrical substations, hospitals, and airports evaluated for vulnerability.',
    summary: 'NH-81 underpass, Palladam grid, and CJB airport identified as critical risk nodes.',
    activeMapHighlight: 'infrastructure',
  },
  {
    id: 'STAGE_5_ANALYSIS',
    stepNumber: 5,
    title: 'Multi-Sector Severity & Vulnerability Analysis',
    shortLabel: '5. IMPACT ANALYSIS',
    description: 'Synthesizes physical waterlogging, electrical surge, windshear, and transport disruption indices.',
    summary: 'High waterlogging and severe lightning strike probability assigned with physical justifications.',
    activeMapHighlight: 'analysis',
  },
  {
    id: 'STAGE_6_PRECAUTIONS',
    stepNumber: 6,
    title: 'Operational Action Protocols & Precautions',
    shortLabel: '6. PRECAUTIONS',
    description: 'Generates specific, role-based precautionary interventions before T+20 minutes.',
    summary: 'Alternate ambulance routing, underpass traffic diversion, and de-watering pre-deployment.',
    activeMapHighlight: 'precautions',
  },
  {
    id: 'STAGE_7_DECISION',
    stepNumber: 7,
    title: 'Forecast Confidence & Decision Governance',
    shortLabel: '7. DECISION STATUS',
    description: 'Evaluates multi-sensor consensus and human approval governance for actionable emergency directives.',
    summary: 'Evidence cross-verified with 78% confidence; human dispatch authorization pending.',
    activeMapHighlight: 'decision',
  },
]

export const TWIN_ASSETS: TwinAsset[] = [
  {
    id: 'asset-nh81-underpass',
    name: 'NH-81 Underpass near Tiruppur',
    category: 'UNDERPASS',
    lat: 11.1120,
    lng: 77.3380,
    hazardFocus: ['CLOUDBURST', 'EXTREME_RAINFALL', 'THUNDERSTORM', 'COMPOSITE'],
    vulnerability: 'CRITICAL',
    impactTitle: 'High Waterlogging & Transit Disruption',
    impactDescription: 'Severe localized runoff concentration in the depressed roadway basin. Rapid water accumulation >45 cm expected within 30 minutes, cutting emergency transit.',
    recommendedAction: 'Prepare alternate ambulance route via Ring Road and restrict heavy vehicles before T+20 minutes.',
    evidenceSources: ['Doppler S-Band reflectivity gradient (>52 dBZ)', 'SCIT cell trajectory model', 'Elevation depression topology', 'Urban drainage capacity index'],
    decisionStatus: 'HUMAN_APPROVAL_REQUIRED',
    timeToImpactMin: 28,
    populationExposed: 42000,
    criticalityIndex: 94,
    statusNote: 'Primary arterial ambulance route connecting Tiruppur to Coimbatore Trauma Hub',
  },
  {
    id: 'asset-palladam-substation',
    name: 'Palladam 400kV Power Substation',
    category: 'GRID',
    lat: 11.0080,
    lng: 77.2850,
    hazardFocus: ['LIGHTNING', 'THUNDERSTORM', 'COMPOSITE'],
    vulnerability: 'HIGH',
    impactTitle: 'Ground Surge & Flashover Hazard',
    impactDescription: 'Accelerated cloud-to-ground lightning stroke frequency exceeding 40 fl/min. Flashover hazard on outdoor switchgear and 400kV transmission line towers.',
    recommendedAction: 'Pre-arm surge arresters, transfer regional industrial load to alternate grid node, stand down maintenance line-crews.',
    evidenceSources: ['GLDN ground flash density surge (+43% in 10m)', 'Atmospheric ionization index', 'High-voltage GIS asset boundary'],
    decisionStatus: 'APPROVED',
    timeToImpactMin: 18,
    populationExposed: 125000,
    criticalityIndex: 91,
    statusNote: 'Feeds northern industrial spinning mills and water distribution pumping stations',
  },
  {
    id: 'asset-cjb-airport',
    name: 'Coimbatore Intl Airport (CJB) Runway Sector',
    category: 'AVIATION',
    lat: 11.0290,
    lng: 77.0430,
    hazardFocus: ['THUNDERSTORM', 'LIGHTNING', 'HAILSTORM', 'COMPOSITE'],
    vulnerability: 'HIGH',
    impactTitle: 'Low-Level Windshear & Lightning Cessation',
    impactDescription: 'Outflow boundary velocity shear >25 knots across Runway 05/23 threshold. Cloud-to-ground strikes within 5 nautical miles requiring ground ramp halt.',
    recommendedAction: 'Issue aerodrome convective warning bulletin, divert inbound commercial arrivals to holding stacks, suspend apron refuelling.',
    evidenceSources: ['Doppler Delta-V radial shear analysis', 'Microburst divergence signature', 'Automated Weather Observing System (AWOS) gust sensor'],
    decisionStatus: 'IMPLEMENTED',
    timeToImpactMin: 22,
    populationExposed: 8500,
    criticalityIndex: 88,
    statusNote: 'Active runway corridor and passenger terminal apron',
  },
  {
    id: 'asset-med-college',
    name: 'Govt Medical College Hospital Corridor',
    category: 'HOSPITAL',
    lat: 11.0180,
    lng: 76.9450,
    hazardFocus: ['CLOUDBURST', 'EXTREME_RAINFALL', 'LIGHTNING', 'COMPOSITE'],
    vulnerability: 'CRITICAL',
    impactTitle: 'Access Route Inundation & Trauma Dispatch Risk',
    impactDescription: 'High-rate surface waterlogging along Avinashi arterial approach threatening ambulance ingress. High lightning strike density requires auxiliary generator standby.',
    recommendedAction: 'Pre-position de-watering pump units at emergency wing gate; notify 108 trauma fleet of western feeder reroute.',
    evidenceSources: ['Surface precipitation rate model', 'Hospital catchment elevation map', 'Urban drainage permeability matrix'],
    decisionStatus: 'RECOMMENDED',
    timeToImpactMin: 15,
    populationExposed: 65000,
    criticalityIndex: 96,
    statusNote: 'Level-1 Regional Trauma and Emergency Care Center',
  },
  {
    id: 'asset-annur-horticulture',
    name: 'Annur Horticultural & Green-House Farming Belt',
    category: 'AGRICULTURE',
    lat: 11.2320,
    lng: 77.1350,
    hazardFocus: ['HAILSTORM', 'THUNDERSTORM', 'COMPOSITE'],
    vulnerability: 'MODERATE',
    impactTitle: 'Hail Swath & High-Value Crop Damage',
    impactDescription: 'Radar reflectivity aloft >55 dBZ with freezing-level elevation at 4.6 km indicates high hail growth potential (pellet size 2–3 cm) impacting cash crops and poly-houses.',
    recommendedAction: 'Deploy protective hail netting over poly-houses, shelter open livestock, secure greenhouse shade-net tie downs.',
    evidenceSources: ['Radar Echo Tops (14.2 km)', 'Vertically Integrated Liquid (VIL > 48 kg/m²)', 'Agricultural crop classification layer'],
    decisionStatus: 'RECOMMENDED',
    timeToImpactMin: 34,
    populationExposed: 28000,
    criticalityIndex: 72,
    statusNote: 'Major producer of high-value cash crops and protected vegetable farming',
  },
  {
    id: 'asset-tiruppur-industrial',
    name: 'Tiruppur North Textile & Industrial Cluster',
    category: 'INDUSTRIAL',
    lat: 11.1350,
    lng: 77.3520,
    hazardFocus: ['CLOUDBURST', 'EXTREME_RAINFALL', 'THUNDERSTORM', 'COMPOSITE'],
    vulnerability: 'HIGH',
    impactTitle: 'Drainage Overload & Worker Transit Interruption',
    impactDescription: 'Urban impervious surface runoff exceeding storm drain capacity by 140%. Shift release coincides with projected peak convective arrival window.',
    recommendedAction: 'Advise industrial units to delay shift egress until T+45m to prevent worker exposure to waterlogged roads and lightning.',
    evidenceSources: ['Convective storm forward speed (28 km/h)', 'Industrial estate drainage capacity profile', 'Worker transit shift density'],
    decisionStatus: 'RECOMMENDED',
    timeToImpactMin: 32,
    populationExposed: 110000,
    criticalityIndex: 84,
    statusNote: 'Over 2,400 export garment and textile manufacturing facilities',
  },
  {
    id: 'asset-coimbatore-metro',
    name: 'Coimbatore Urban Metro Core (Gandhipuram)',
    category: 'COMMUNITY',
    lat: 11.0168,
    lng: 76.9658,
    hazardFocus: ['LIGHTNING', 'THUNDERSTORM', 'CLOUDBURST', 'COMPOSITE'],
    vulnerability: 'HIGH',
    impactTitle: 'Dense Urban Exposure & Flash Flood Warning',
    impactDescription: 'Severe convective cloudburst cell directly intersecting dense retail, bus terminus, and transit hubs. Lightning flash density poses acute pedestrian hazard in open plazas.',
    recommendedAction: 'Trigger public warning sirens, issue multi-channel SMS alerts to clear open transit terminals, halt outdoor commercial operations.',
    evidenceSources: ['Composite hazard index (88%)', 'Total lightning flash rate (38 fl/min)', 'High-resolution population density grid'],
    decisionStatus: 'APPROVED',
    timeToImpactMin: 14,
    populationExposed: 185000,
    criticalityIndex: 95,
    statusNote: 'Central commercial district, major bus terminus, and educational corridor',
  },
]

export interface HazardProfile {
  key: ImpactTwinHazard
  name: string
  color: string
  glowColor: string
  iconName: string
  hazardLabel: string
  primaryRiskRadiusMeters: number
  secondaryRiskRadiusMeters: number
  beforeLabel: string
  beforeDescription: string
  afterLabel: string
  afterDescription: string
  consequenceSummary: string
  precautions: string[]
}

export const HAZARD_PROFILES: Record<ImpactTwinHazard, HazardProfile> = {
  LIGHTNING: {
    key: 'LIGHTNING',
    name: 'Severe Lightning Surge',
    color: '#FFC857',
    glowColor: 'rgba(255, 200, 87, 0.4)',
    iconName: 'Zap',
    hazardLabel: 'Ground & Cloud-to-Ground Strike Flash Surge',
    primaryRiskRadiusMeters: 6000,
    secondaryRiskRadiusMeters: 14000,
    beforeLabel: 'Normal Atmospheric Potential (Calm)',
    beforeDescription: 'Background electric field nominal (<1 kV/m). Power grid and open transport corridors operate without surge risk.',
    afterLabel: 'Predicted Lightning Exposure Buffer (Active)',
    afterDescription: 'High-density ground strike clusters (>35 fl/min) within 14 km radius. Electrical substations, telecommunication towers, and open fields under immediate threat.',
    consequenceSummary: 'Acute risk of power grid trips, electrical equipment damage, and personal injury in open grounds and transit stops.',
    precautions: [
      'Suspend all outdoor activities, open sports, and field operations immediately.',
      'Seek shelter in fully enclosed, substantial buildings or hard-topped metal vehicles.',
      'Avoid tall isolated trees, transmission towers, fences, and open water bodies.',
      'Switch critical medical and industrial equipment to surge-protected auxiliary power.',
    ],
  },
  THUNDERSTORM: {
    key: 'THUNDERSTORM',
    name: 'Intense Severe Thunderstorm',
    color: '#FF8343',
    glowColor: 'rgba(255, 131, 67, 0.4)',
    iconName: 'CloudLightning',
    hazardLabel: 'Multi-Cell Convective Core & Outflow Boundary',
    primaryRiskRadiusMeters: 9000,
    secondaryRiskRadiusMeters: 18000,
    beforeLabel: 'Normal Regional Weather (Nominal Winds)',
    beforeDescription: 'Surface winds 10–15 km/h. Clear traffic corridors, airport runway approaches operating under Visual Flight Rules (VFR).',
    afterLabel: 'Predicted Convective Inundation Swath',
    afterDescription: 'Doppler core >55 dBZ tracking NE at 28 km/h. Severe straight-line downdraft gusts (>65 km/h) and rapid temperature drop across a 18 km corridor.',
    consequenceSummary: 'High probability of tree falls, roof damage, aviation windshear delays, and hazardous highway crosswinds.',
    precautions: [
      'Issue public civil defense alerts for Coimbatore–Tiruppur corridor before T+20 minutes.',
      'Alert aviation authorities to hold approaches and initiate runway shear advisories.',
      'Secure temporary hoarding structures, construction cranes, and loose roofing sheets.',
      'Prepare emergency quick-response utility teams for fallen tree and power line clearance.',
    ],
  },
  CLOUDBURST: {
    key: 'CLOUDBURST',
    name: 'Localized Convective Cloudburst',
    color: '#38E4C0',
    glowColor: 'rgba(56, 228, 192, 0.4)',
    iconName: 'CloudRain',
    hazardLabel: 'Intense Localized Deluge (>25–40 mm/h rate)',
    primaryRiskRadiusMeters: 7000,
    secondaryRiskRadiusMeters: 15000,
    beforeLabel: 'Normal Terrain & Dry Underpasses',
    beforeDescription: 'Storm drainage channels operating at <20% capacity. Underpass roadways dry and traffic moving at speed limit.',
    afterLabel: 'Predicted Runoff & Water Accumulation Zones',
    afterDescription: 'Rapid hydrological convergence resulting in 40–60 mm accumulation in <45 minutes. Severe underpass flooding and street runoff overwhelming culverts.',
    consequenceSummary: 'Impassable railway underpasses, arterial road submergence, and delay in emergency medical vehicle response.',
    precautions: [
      'Activate traffic barriers and warning lights at NH-81 underpass to prevent vehicle submergence.',
      'Deploy mobile high-capacity de-watering pumps to hospital ingress and railway subway nodes.',
      'Divert ambulance and emergency supply traffic to elevated bypass ring roads.',
      'Clear storm culvert screens in urban Gandhipuram and Tiruppur industrial sectors.',
    ],
  },
  EXTREME_RAINFALL: {
    key: 'EXTREME_RAINFALL',
    name: 'Extreme Precipitation Field',
    color: '#56CFFF',
    glowColor: 'rgba(86, 207, 255, 0.4)',
    iconName: 'Waves',
    hazardLabel: 'High-Volume Convective Precipitation Accumulation',
    primaryRiskRadiusMeters: 8000,
    secondaryRiskRadiusMeters: 16000,
    beforeLabel: 'Baseline Hydrological State',
    beforeDescription: 'Noyyal river and feeder drainage channels at nominal flow levels with zero saturation.',
    afterLabel: 'Predicted Flood & Drainage Saturation Swath',
    afterDescription: 'Widespread runoff exceeding municipal drainage limits. Low-lying residential pockets subject to standing water and prolonged transit delays.',
    consequenceSummary: 'Low-lying habitation waterlogging, arterial logistics gridlock, and potential contamination of surface drainage.',
    precautions: [
      'Alert low-lying settlements near riverbed channels to move valuables to elevated shelves.',
      'Coordinate municipal drainage gates to maximum discharge configuration.',
      'Advise transit operators to reroute public buses around known waterlogging points.',
      'Pre-position sandbags at electrical substations and hospital entryways.',
    ],
  },
  HAILSTORM: {
    key: 'HAILSTORM',
    name: 'Severe Hail Core Aloft',
    color: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    iconName: 'Sparkles',
    hazardLabel: 'Solid Hydrometeor Growth Aloft (2–4 cm Hailstones)',
    primaryRiskRadiusMeters: 6000,
    secondaryRiskRadiusMeters: 12000,
    beforeLabel: 'Open Agricultural & Unprotected Assets',
    beforeDescription: 'Agricultural fields open, greenhouse shade nets retracted, vehicles parked in open surface lots.',
    afterLabel: 'Predicted Hail Swath & Impact Footprint',
    afterDescription: 'High VIL (>48 kg/m²) core descending along Annur–Tiruppur border. Severe physical impact to cash crops, vehicle windshields, and rooftop solar installations.',
    consequenceSummary: 'Substantial damage to horticultural crops, shattered glass/solar panels, and injury risk to unprotected livestock.',
    precautions: [
      'Broadcast automated agricultural advisory to deploy anti-hail net covers over cash crops.',
      'Move vehicles, tractors, and sensitive equipment into covered carports or garages.',
      'Herd livestock and poultry into sheltered sheds with reinforced roofing.',
      'Advise airport ground operators to protect exposed aircraft control surfaces.',
    ],
  },
  COMPOSITE: {
    key: 'COMPOSITE',
    name: 'Multi-Hazard Convective Cluster',
    color: '#FF705E',
    glowColor: 'rgba(255, 112, 94, 0.4)',
    iconName: 'ShieldAlert',
    hazardLabel: 'Multi-Sensor Fused Convective Impact Twin',
    primaryRiskRadiusMeters: 10000,
    secondaryRiskRadiusMeters: 20000,
    beforeLabel: 'Normal Baseline Operational State',
    beforeDescription: 'Nominal municipal, transportation, grid, and agricultural operations across Western Tamil Nadu.',
    afterLabel: 'Synthesized Multi-Hazard Impact Twin Overlay',
    afterDescription: 'Integrated risk envelope combining severe lightning density, localized cloudburst flash flooding, windshear gusts, and hail aloft into an actionable decision matrix.',
    consequenceSummary: 'Simultaneous compounding stress on transportation corridors, power distribution nodes, and civil emergency response.',
    precautions: [
      'Activate Level-3 Integrated Convective Emergency Action Center.',
      'Coordinate multi-agency dispatch across Police, Fire & Rescue, Highways, and Electricity Board.',
      'Issue automated multi-language CAP bulletins to all exposed mobile subscribers in the sector.',
      'Review and authorize priority interventions in the decision queue before T+20 minutes.',
    ],
  },
}

/**
 * Calculates dynamic impact metrics based on active hazard, storm cell state, and timeline minute.
 */
export function computeTwinMetrics(
  hazard: ImpactTwinHazard,
  cell: StormCell,
  minute: number,
  snapshot: SimulationSnapshot
) {
  const profile = HAZARD_PROFILES[hazard]
  const cellArrival = (cell as any).arrivalMinutes ?? snapshot.nextArrivalMinutes ?? 28
  const arrival = Math.max(0, Math.round(cellArrival - minute))
  const isApproaching = arrival > 0 && arrival <= 45
  const isImpactActive = arrival === 0 || (arrival < 0 && arrival > -30)

  // Dynamic population calculation based on hazard radius and storm intensity
  const basePop = snapshot.impact?.population || 185000
  const factor = hazard === 'COMPOSITE' ? 1.0 : hazard === 'CLOUDBURST' ? 0.75 : hazard === 'LIGHTNING' ? 0.65 : 0.55
  const estimatedExposed = Math.round(basePop * factor * (cell.intensity / 100))

  // Risk severity rating
  let severity: AssetVulnerability = 'LOW'
  if (cell.intensity >= 70 || snapshot.severity === 'SEVERE') severity = 'CRITICAL'
  else if (cell.intensity >= 50 || snapshot.severity === 'WARNING') severity = 'HIGH'
  else if (cell.intensity >= 30) severity = 'MODERATE'

  const confidencePct = Math.round(snapshot.confidence * (hazard === 'LIGHTNING' ? 0.98 : hazard === 'CLOUDBURST' ? 0.92 : 0.95))

  return {
    hazardProfile: profile,
    arrivalMinutes: arrival,
    isApproaching,
    isImpactActive,
    estimatedPopulationExposed: estimatedExposed,
    severity,
    confidencePct,
    activeRadiusKm: Math.round(profile.secondaryRiskRadiusMeters / 1000),
    primaryRadiusKm: Math.round(profile.primaryRiskRadiusMeters / 1000),
  }
}

