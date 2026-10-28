import type { AlertItem, SimulationSnapshot, Severity } from './types'

export const SUPPORTED_LANGUAGES: { key: string; label: string; code: string; script: string }[] = [
  { key: 'English', label: 'English', code: 'EN', script: 'Latin' },
  { key: 'Hindi', label: 'हिन्दी', code: 'HI', script: 'Devanagari' },
  { key: 'Tamil', label: 'தமிழ்', code: 'TA', script: 'Tamil' },
  { key: 'Telugu', label: 'తెలుగు', code: 'TE', script: 'Telugu' },
  { key: 'Malayalam', label: 'മലയാളം', code: 'ML', script: 'Malayalam' },
  { key: 'Kannada', label: 'ಕನ್ನಡ', code: 'KN', script: 'Kannada' },
  { key: 'Marathi', label: 'मराठी', code: 'MR', script: 'Devanagari' },
  { key: 'Bengali', label: 'বাংলা', code: 'BN', script: 'Bengali' },
]

export const ALERT_TRANSLATIONS: Record<string, (area: string, etaMin: number, speed: number, dir: string) => string> = {
  English: (area, eta, speed, dir) =>
    `URGENT CONVECTIVE WARNING: A rapidly intensifying convective thunderstorm cell is tracking ${dir} at ${speed} km/h toward ${area}. High risk of dangerous lightning strikes, torrential rainfall, and severe wind gusts within the next ${eta} minutes. Move to sturdy shelter immediately and avoid open water, tall trees, and electrical structures.`,
  Hindi: (area, eta, speed, dir) =>
    `अति आवश्यक संवहनी चेतावनी: एक तेजी से तीव्र होता तूफान सेल ${speed} किमी/घंटा की गति से ${dir} दिशा में ${area} की ओर बढ़ रहा है। अगले ${eta} मिनट में भीषण बिजली गिरने, मूसलाधार बारिश और तेज हवाओं का अत्यधिक जोखिम है। तुरंत पक्के आश्रय में जाएं और खुले मैदानों और ऊंचे पेड़ों से दूर रहें।`,
  Tamil: (area, eta, speed, dir) =>
    `அவசர இடிமின்னல் எச்சரிக்கை: தீவிரமடையும் பலத்த இடியுடன் கூடிய மழை மேகத்திரள் மணிக்கு ${speed} கி.மீ வேகத்தில் ${dir} திசையில் ${area} நோக்கி நகர்கிறது. அடுத்த ${eta} நிமிடங்களில் கடுமையான மின்னல் தாக்குதல், கனமழை மற்றும் பலத்த காற்று வீசக்கூடும். உடனடியாக பாதுகாப்பான கட்டிடங்களுக்குள் செல்லவும்.`,
  Telugu: (area, eta, speed, dir) =>
    `అత్యవసర వాతావరణ హెచ్చరిక: వేగంగా బలపడుతున్న తీవ్ర ఉరుములతో కూడిన తుఫాను కణం గంటకు ${speed} కి.మీ వేగంతో ${dir} దిశగా ${area} వైపు కదులుతోంది. రాబోయే ${eta} నిమిషాల్లో పిడుగులు, భారీ వర్షం మరియు ఈదురుగాలులు వీచే ప్రమాదం ఉంది. వెంటనే సురక్షిత ప్రాంతాలకు వెళ్లండి.`,
  Malayalam: (area, eta, speed, dir) =>
    `അടിയന്തര ഇടിമിന്നൽ മുന്നറിയിപ്പ്: അതിവേഗം ശക്തിപ്രാപിക്കുന്ന ശക്തമായ ഇടിമിന്നൽ മേഘം മണിക്കൂറിൽ ${speed} കി.മീ വേഗത്തിൽ ${dir} ദിശയിൽ ${area} ലക്ഷ്യമാക്കി നീങ്ങുന്നു. അടുത്ത ${eta} മിനിറ്റിൽ ശക്തമായ മിന്നൽ, അതിതീവ്ര മഴ, കാറ്റ് എന്നിവയ്ക്ക് സാധ്യത. ഉടൻ സുരക്ഷിതമായ കെട്ടിടങ്ങളിലേക്ക് മാറുക.`,
  Kannada: (area, eta, speed, dir) =>
    `ತುರ್ತು ಗುಡುಗು ಮಿಂಚಿನ ಎಚ್ಚರಿಕೆ: ತೀವ್ರಗೊಳ್ಳುತ್ತಿರುವ ಬಿರುಗಾಳಿ ಕೋಶವು ಗಂಟೆಗೆ ${speed} ಕಿ.ಮೀ ವೇಗದಲ್ಲಿ ${dir} ಕಡೆಗೆ ${area} ಕಡೆ ಸಾಗುತ್ತಿದೆ. ಮುಂದಿನ ${eta} ನಿಮಿಷಗಳಲ್ಲಿ ಪ್ರಬಲ ಮಿಂಚು, ಭಾರೀ ಮಳೆ ಮತ್ತು ಬಿರುಗಾಳಿಯ ಅಪಾಯವಿದೆ. ತಕ್ಷಣವೇ ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ತೆರಳಿ.`,
  Marathi: (area, eta, speed, dir) =>
    `तातडीचा हवामान इशारा: वेगाने तीव्र होणारा वादळी सेल ताशी ${speed} किमी वेगाने ${dir} दिशेने ${area} कडे सरकत आहे. पुढील ${eta} मिनिटांत जोरदार वीज पडणे, मुसळधार पाऊस आणि वादळी वाऱ्याचा धोका आहे. तत्काळ सुरक्षित निवाऱ्यात जा.`,
  Bengali: (area, eta, speed, dir) =>
    `জরুরি বজ্রঝড় সতর্কতা: দ্রুত তীব্র হওয়া একটি বজ্রঝড়ের মেঘপুঞ্জ ঘণ্টায় ${speed} কিমি গতিতে ${dir} দিকে ${area}-র অভিমুখে অগ্রসর হচ্ছে। পরবর্তী ${eta} মিনিটে ভয়াবহ বজ্রপাত, ভারী বৃষ্টিপাত ও দমকা হাওয়ার প্রবল ঝুঁকি রয়েছে। অবিলম্বে নিরাপদ আশ্রয়ে যান।`,
}

export function generateAlerts(snapshot: SimulationSnapshot): AlertItem[] {
  const cell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]
  const speed = Math.round(cell.speed)
  const dir = cell.direction
  const arrival = Math.max(12, Math.round(cell.arrivalMinutes))

  const alerts: AlertItem[] = [
    {
      id: `TT-ALT-${snapshot.scenario.slice(0, 3).toUpperCase()}-01`,
      stormId: cell.id,
      scenario: snapshot.scenario,
      title: `${cell.name} — ${snapshot.severity} Weather Warning`,
      hazard: snapshot.hazards[0]?.key ?? 'composite',
      severity: snapshot.severity,
      area: 'Coimbatore Metro & NH-81 Corridor',
      timestamp: snapshot.timestamp,
      message: ALERT_TRANSLATIONS['English']('Coimbatore Metro & NH-81 Corridor', arrival, speed, dir),
      status: 'ACTIVE',
      confidence: snapshot.confidence,
      recommendedAction: 'Suspend outdoor activities, seek reinforced interior shelter, disconnect sensitive electronic equipment.',
    },
    {
      id: `TT-ALT-LGT-02`,
      stormId: cell.id,
      scenario: snapshot.scenario,
      title: 'Elevated Cloud-to-Ground Lightning Surge',
      hazard: 'lightning',
      severity: cell.lightningRate > 50 ? 'SEVERE' : 'WARNING',
      area: 'Western Ghats Foothills & Perur Sector',
      timestamp: snapshot.timestamp,
      message: `Lightning jump detected (${cell.lightningRate} fl/min). High ground flash density observed within 15 km of Tiruppur-Coimbatore highway. Ground strike hazard extreme.`,
      status: 'ACTIVE',
      confidence: Math.round(cell.confidence * 0.96),
      recommendedAction: 'Stay off elevated areas and away from transmission towers, metal fences, and standing water bodies.',
    },
    {
      id: `TT-ALT-URB-03`,
      stormId: cell.id,
      scenario: snapshot.scenario,
      title: 'High-Rate Precipitation & Urban Flash Flood Advisory',
      hazard: 'rainfall',
      severity: cell.rainfallRate > 60 ? 'WARNING' : 'ALERT',
      area: 'Avinashi Road & Railway Underpass Network',
      timestamp: snapshot.timestamp,
      message: `Projected rainfall accumulation of ${Math.round(cell.rainfallRate)} mm/h expected. Low-lying arterial roads and transport underpasses subject to rapid runoff flooding.`,
      status: 'ACTIVE',
      confidence: Math.round(cell.confidence * 0.91),
      recommendedAction: 'Reroute surface logistics away from flood-prone subways; secure urban drainage culverts.',
    },
  ]

  if (snapshot.scenario === 'hailstorm') {
    alerts.unshift({
      id: `TT-ALT-HAIL-04`,
      stormId: cell.id,
      scenario: snapshot.scenario,
      title: 'Severe Hail Core Hazard Advisory',
      hazard: 'hail',
      severity: 'SEVERE',
      area: 'Northern Horticultural Belt / Annur Sector',
      timestamp: snapshot.timestamp,
      message: `Radar echo tops exceeding 14 km with high VIL indicates hail formation (diameter 2–4 cm). High damage probability to open crops, solar panels, and vehicle windshields.`,
      status: 'ACTIVE',
      confidence: 89,
      recommendedAction: 'Park vehicles in sheltered garages, protect green-house covers, and secure poultry enclosures.',
    })
  }

  if (snapshot.scenario === 'cloudburst') {
    alerts.unshift({
      id: `TT-ALT-CBD-05`,
      stormId: cell.id,
      scenario: snapshot.scenario,
      title: 'Extreme Cloudburst Inundation Warning',
      hazard: 'cloudburst',
      severity: 'SEVERE',
      area: 'Siruvani Catchment & Noyyal Basin',
      timestamp: snapshot.timestamp,
      message: `Hyper-concentrated convective rainfall signature (>100 mm/h rate equivalent). Flash stream discharge imminent along mountain tributaries.`,
      status: 'ACTIVE',
      confidence: 93,
      recommendedAction: 'Immediate uphill evacuation of riverside settlements; activate emergency weir gates.',
    })
  }

  return alerts
}

export function generateCapXml(alert: AlertItem): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${alert.id}</identifier>
  <sender>systems@tropotrace.org</sender>
  <sent>${alert.timestamp}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <code>CONVECTIVE_06HR</code>
  <info>
    <category>Met</category>
    <event>${alert.title}</event>
    <urgency>Immediate</urgency>
    <severity>${alert.severity === 'SEVERE' ? 'Extreme' : alert.severity === 'WARNING' ? 'Severe' : 'Moderate'}</severity>
    <certainty>${alert.confidence > 80 ? 'Observed' : 'Likely'}</certainty>
    <eventCode>
      <valueName>MoES_NCMRWF_Nowcast</valueName>
      <value>${alert.hazard.toUpperCase()}</value>
    </eventCode>
    <headline>${alert.title}</headline>
    <description>${alert.message}</description>
    <instruction>${alert.recommendedAction}</instruction>
    <area>
      <areaDesc>${alert.area}</areaDesc>
      <circle>11.0168,76.9558,25.0</circle>
    </area>
  </info>
</alert>`
}
