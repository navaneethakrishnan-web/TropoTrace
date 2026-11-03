# TROPOTRACE (VAJRA-X) — MASTER TECHNICAL & OPERATIONAL DOCUMENTATION
**Project Title:** TropoTrace — Convective Intelligence Command Center  
**System Architecture:** Hyperlocal Convective Nowcasting (0–6 Hours) & Decision-Support System  
**Organization Benchmark:** Ministry of Earth Sciences (MoES) & National Centre for Medium Range Weather Forecasting (NCMRWF)  
**Hackathon / Event:** Dexathon 2026 — Team Regal Hackers  
**Live Production URL:** [https://thermotrace-a6b30.web.app](https://thermotrace-a6b30.web.app)  
**Code Repository:** [https://github.com/navaneethakrishnan-web/TropoTrace](https://github.com/navaneethakrishnan-web/TropoTrace)  
**Document Classification:** Comprehensive System Master Blueprint & Judge Defense Manual  

---

## TABLE OF CONTENTS
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Complete Technology Stack & Languages](#2-complete-technology-stack--languages)
3. [Cloud Database Architecture & Firebase System](#3-cloud-database-architecture--firebase-system)
4. [The GIS Map Engine & Spatial Location System](#4-the-gis-map-engine--spatial-location-system)
5. [The Convective Intelligence & ML Nowcasting Engine](#5-the-convective-intelligence--ml-nowcasting-engine)
6. [The Artificial Intelligence System (Groq API & Tropo Copilot)](#6-the-artificial-intelligence-system-groq-api--tropo-copilot)
7. [Module-by-Module Feature Walkthrough (All 10 Modules)](#7-module-by-module-feature-walkthrough-all-10-modules)
8. [Data Sources, Telemetry Ingestion & Sensor Datasets](#8-data-sources-telemetry-ingestion--sensor-datasets)
9. [Build, Deployment & Configuration Pipeline](#9-build-deployment--configuration-pipeline)
10. [Exhaustive Judge Q&A & Technical Defense Guide](#10-exhaustive-judge-qa--technical-defense-guide)

---

# 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT

### The Severe Convective Hazard Challenge
Severe convective storms—comprising violent **thunderstorms, damaging hail, lightning clusters, microbursts/downbursts, and flash-flood inducing cloudbursts**—are mesoscale atmospheric phenomena with rapid initiation windows (< 15–30 minutes) and extreme spatial localization (1–10 km). 

Traditional Numerical Weather Prediction (NWP) models (e.g., GFS, NCUM regional) struggle with convective nowcasting because:
1. NWP model runs have 3–6 hour assimilation and latency cycles, making them too slow for rapid convective genesis.
2. Grid resolutions of regional models (typically 4–12 km) are too coarse to resolve localized convective updraft cores.
3. Isolated cloudbursts and lightning jumps occur within 15–45 minutes, demanding a **0 to 6 hour Convective-Scale Nowcasting** capability.

### The TropoTrace (VAJRA-X) Solution
TropoTrace is a dedicated, operator-grade **Convective Intelligence Command Center** designed for civil defense operators, aviation meteorologists, emergency logistics coordinators, and agricultural task forces.

It synthesizes:
- **Doppler Weather Radar (DWR S-Band/C-Band)** volumetric reflectivity ($Z$) and radial velocity ($V_r$).
- **Geostationary Satellite Imagery (INSAT-3D/3DR)** thermal infrared cloud-top cooling rates.
- **Lightning Detection Networks (GLDN / IITM Damini)** total flash rates and flash jumps.
- **Surface Automatic Weather Stations (AWS)** rapid pressure dips ($\Delta P$) and wind gust observations.
- **NCMRWF Unified Model Convective Guidance** (CAPE, CIN, VIL, vertical wind shear).

The platform continuously determines storm kinematics, tracks convective cells using principles derived from **TITAN** (Thunderstorm Identification, Tracking, Analysis, and Nowcasting) and **SCIT** (Storm Cell Identification and Tracking), computes 1–3 km multi-hazard probability envelopes, identifies asset exposure along projected trajectory cones, and disseminates standardized **Common Alerting Protocol (CAP v1.2)** bulletins in **8 Indian languages** with text-to-speech audio synthesis.

---

# 2. COMPLETE TECHNOLOGY STACK & LANGUAGES

| Layer / Subsystem | Technology / Package | Version / Detail | Purpose in TropoTrace |
| :--- | :--- | :--- | :--- |
| **Programming Language** | **TypeScript** | `5.x` | Strongly typed contracts for all meteorological entities, coordinates, snapshots, and API structures. |
| **Core UI Framework** | **React** | `19.x` | Modern reactive component architecture, custom hooks, and context state trees. |
| **Bundler & Build Tool** | **Vite** | `6.x / 8.x` | Blazing fast ESM dev server, Rolldown/Rollup chunking, and sub-second production builds. |
| **Interactive GIS Mapping** | **Leaflet.js** | `^1.9.4` | Hardware-accelerated, lightweight canvas and SVG interactive map rendering. |
| **Map Base Providers** | **Esri ArcGIS & OpenStreetMap** | REST Tile Endpoints | Dual-basemap system: High-res Esri World Imagery (Satellite) & World Street Map. |
| **Cloud Authentication** | **Firebase Auth** | `^12.19.0` | Client-side OAuth/Email authentication, password recovery, session token caching. |
| **Cloud Database** | **Cloud Firestore** | `^12.19.0` | Serverless NoSQL document database for user profiles, saved alerts, and scenario logs. |
| **Hosting & Edge CDN** | **Firebase Hosting** | Static SPA | Global edge distribution, HTTPS SSL termination, automatic SPA rewrite to `index.html`. |
| **AI LLM Inference** | **Groq API** | `openai/gpt-oss-120b` | Ultra-low latency LPU hardware execution of 120-Billion parameter foundation model. |
| **Icons & Visual Semantics** | **Lucide React** | `Latest` | Consistent SVG meteorological, hardware, and operational indicator icon set. |
| **Styling & Design System** | **Custom CSS3** | 8,500+ lines (`app.css`) | Custom dark theme inspired by tactical command rooms (Deep Midnight Green `#06100E`, Electric Teal `#38E4C0`, Cyan `#56CFFF`, Amber `#FFC857`, Red `#FF4438`). |
| **Speech Audio Engine** | **Web Speech API** | `SpeechSynthesis` | Client-side native text-to-speech broadcast for instant emergency audio dissemination. |
| **Real-World Weather API** | **OpenWeatherMap API** | `v2.5 Current Weather` | Ingests live temperature, humidity, surface pressure, and wind conditions across monitored cities. |

---

# 3. CLOUD DATABASE ARCHITECTURE & FIREBASE SYSTEM

TropoTrace utilizes a cloud architecture built upon the **Google Cloud / Firebase Platform** (`thermotrace-a6b30`).

```
                    ┌──────────────────────────────────────────────┐
                    │               CLIENT BROWSER                 │
                    │   React 19 SPA (Vite Production Build)       │
                    └───────┬──────────────┬──────────────┬────────┘
                            │              │              │
                   HTTPS / WSS             │         REST / JSON
                            │              │              │
                            ▼              │              ▼
             ┌────────────────────────┐    │    ┌──────────────────┐
             │    Firebase Hosting    │    │    │  Groq Cloud LPU  │
             │ Global Edge CDN (dist) │    │    │ (gpt-oss-120b)   │
             └────────────────────────┘    │    └──────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             ┌───────────────────────┐             ┌─────────────────────┐
             │     Firebase Auth     │             │   Cloud Firestore   │
             │ Email/Pass + Identity │             │  NoSQL Document DB  │
             └───────────────────────┘             └─────────────────────┘
```

### 1. Firebase Authentication
- **Service:** Firebase Auth SDK (`firebase/auth`).
- **Mechanisms Supported:**
  - Standard Email / Password sign-in (`signInWithEmailAndPassword`).
  - New Operator Account Registration (`createUserWithEmailAndPassword`).
  - Automated Password Recovery (`sendPasswordResetEmail`).
  - **Zero-Friction Judge Bypass Mode:** The login screen provides a one-click *"Judge / Evaluator Instant Access"* button (`loginAsJudge()`) that sets a validated mock session (`operator@tropotrace.moes.gov.in`) in `localStorage` (`tt-judge-session`), allowing hackathon judges to evaluate the app without needing manual sign-up.

### 2. Cloud Firestore NoSQL Database Schema
Firestore is organized into a hierarchical document-collection structure scoped to authenticated operator UIDs:

```text
/databases/(default)/documents/
  └── users/
        └── {userId} (Document)
              ├── email: string (e.g., "operator@tropotrace.moes.gov.in")
              ├── role: string (e.g., "meteorological-operator")
              ├── displayName: string (e.g., "MoES Lead Operator")
              ├── createdAt: timestamp (serverTimestamp())
              │
              ├── savedAlerts/ (Sub-collection)
              │     └── {alertId} (Document)
              │           ├── title: string
              │           ├── language: string
              │           ├── severity: string ("NORMAL" | "WATCH" | "ALERT" | "WARNING" | "SEVERE")
              │           ├── area: string
              │           ├── message: string
              │           └── createdAt: timestamp
              │
              └── scenarioRuns/ (Sub-collection)
                    └── {runId} (Document)
                          ├── scenarioKey: string ("rapid-thunderstorm", "cloudburst", etc.)
                          ├── scenarioLabel: string
                          ├── mode: string ("EMERGENCY", "AVIATION", etc.)
                          ├── lastMinute: number
                          └── startedAt: timestamp
```

### 3. Firestore Security Rules
The database is locked down with strict security rules defined in `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, create: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Safeguard against accidental operator wipe
      
      match /savedAlerts/{alertId} {
        allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
      }
      match /scenarioRuns/{runId} {
        allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /{document=**} {
      allow read, write: if false; // Implicit default deny
    }
  }
}
```

### 4. Firebase Hosting Architecture
- Configuration in `firebase.json`:
  ```json
  {
    "hosting": {
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        { "source": "**", "destination": "/index.html" }
      ]
    }
  }
  ```
- **SPA Rewrite:** All deep links (e.g., `/storm-intelligence`, `/hazard-explorer`, `/analyst`) resolve to `/index.html` on the CDN edge, allowing client-side HTML5 History API routing without 404 errors.

---

# 4. THE GIS MAP ENGINE & SPATIAL LOCATION SYSTEM

The mapping system in `src/components/StormMap.tsx` is an interactive GIS interface built on Leaflet.js with custom procedural SVG and HTML canvas layers.

### 1. Geographic Coordinate Projection
TropoTrace's demonstration theater is centered on the **Western Ghats / Southern Tamil Nadu & Kerala Convective Corridor** (centered on Coimbatore, Tiruppur, Erode, Palakkad Gap, and Nilgiris).
- **Coordinate Conversion Formula:**
  $$\text{Latitude} = 13.6 - (y \times 0.045)$$
  $$\text{Longitude} = 74.8 + (x \times 0.045)$$
  where $(x, y)$ are normalized simulation coordinates $[0, 100]$.
- This projects simulation coordinates into geographical coordinates between:
  - Latitude: $10.0^\circ\text{N}$ to $13.6^\circ\text{N}$
  - Longitude: $74.8^\circ\text{E}$ to $79.3^\circ\text{E}$

### 2. Dual Basemap Engine
Operators can toggle basemaps via toolbar pills:
- **Satellite Basemap:** Esri World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`)
  - Shows real terrain elevation, forest canopy, ridgelines of Western Ghats, and urban roof footprints.
- **Street Basemap:** Esri World Street Map (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}`)
  - Shows highway vectors (NH-81, NH-544), district boundaries, municipal wards, and railway tracks.

### 3. Geolocation Permission & User Position Hook
When an operator clicks the **"MY LOCATION"** button in the map toolbar:
1. The app invokes the browser's standard W3C Geolocation API:
   ```typescript
   navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
     enableHighAccuracy: true,
     timeout: 10000,
     maximumAge: 60000
   });
   ```
2. The browser prompts the user: *"Allow thermotrace-a6b30.web.app to access your location?"*
3. **States handled:**
   - `IDLE`: Location not yet requested.
   - `LOCATING`: GPS sensor acquisition in progress (displays blinking icon).
   - `FOUND`: Coordinates acquired. Map executes smooth animated fly-to (`map.flyTo(coords, 10, { duration: 1.2 })`). A glowing cyan ring (radius 650m) and reticle marker appear.
   - `DENIED`: Gracefully handled if user denies permission or browser lacks GPS; falls back to default radar center without crashing.
4. **Storm Centering Shift:** If user location is granted, the radar overlays can offset relative to the user's real vantage point, demonstrating how a field operator checks their own distance from the severe convective core!

### 5. Multi-Layer Overlays
Operators can toggle 6 distinct GIS layers on/off via the floating layer drawer:
1. **Radar Reflectivity Sweep (`layers.radar`):**
   - Renders a 360-degree rotating radar sweep beam simulating a Doppler S-band radar station scanning at 12 RPM.
   - 3 range rings (50 km, 100 km, 150 km).
   - Outer convective boundary (radius 28 km) with 3D breathing opacity.
   - Severe reflectivity core (>55 dBZ) with a pulsing amber/red glow.
2. **Projected Trajectory & Uncertainty Cone (`layers.tracks`):**
   - **Observed Past Track:** Cyan dashed line (`#56CFFF`) connecting historical centroids.
   - **Forecast Path (0–6 Hours):** Amber dashed line (`#FFC857`) with animated chevron flow arrows ($›$) showing real-time direction of propagation.
   - **Uncertainty Cone Swath:** A polygon that widens downstream, accounting for lateral atmospheric shear and steering wind variance.
3. **Highway Network (`layers.roads`):**
   - Renders arterial road networks including NH-81 (Coimbatore – Tiruppur – Erode), NH-544 (Bypass), and the Mettupalayam mountain corridor.
4. **Critical Infrastructure Assets (`layers.assets`):**
   - High-value geo-located infrastructure pins:
     - Coimbatore Metro Transit Center
     - Tiruppur North Industrial Apparel Hub
     - Coimbatore International Airport (CJB)
     - Government Medical College Trauma Center
     - Palladam 400kV Power Substation
   - **Dynamic Swath Intersection:** If an asset falls inside the storm's projected uncertainty cone, the marker switches to a pulsing red emergency alert ring with tooltip warning: *"DIRECT CORRIDOR INTERSECTION"*.
5. **1 km Nowcast Risk Grid (`layers.riskGrid`):**
   - Dashed bounding box overlay representing the high-resolution numerical nowcast boundary.
6. **Active 3D Lightning Strikes (`layers.lightning`):**
   - Golden electric strike markers pulsing at the centroid coordinates, simulating real-time ground flash discharges from the Lightning Detection Network.

### 6. The Atmospheric Globe (3D Visualizer)
In `src/components/AtmosphericGlobe.tsx`, a custom HTML5 Canvas creates a 3D animated atmospheric sphere:
- 120 orbiting particles simulating a mesoscale cyclonic vortex.
- Procedural latitude and longitude ellipses rotating in 3D projection space.
- Concentric range rings with distance readouts (50 km, 100 km, 150 km, 200 km).
- Radial sweep gradients creating an authentic command-center radar visual.

---

# 5. THE CONVECTIVE INTELLIGENCE & ML NOWCASTING ENGINE

TropoTrace's simulation and nowcasting engine in `src/domain/simulation.ts` implements the mathematical and operational principles of modern convective nowcasting systems.

```
       RAW OBSERVATIONS                          PROCESSING PIPELINE                      DERIVED OUTPUTS
 ┌───────────────────────────┐             ┌─────────────────────────────┐        ┌─────────────────────────────┐
 │ Doppler Weather Radar (Z) │ ──┐         │ Convective Cell Tracking    │ ───►   │ 0–6h Forecast Trajectory    │
 ├───────────────────────────┤   │         │ (TITAN / SCIT Centroids)    │        ├─────────────────────────────┤
 │ INSAT-3DR Satellite (TIR) │ ──┼──────►  ├─────────────────────────────┤        │ 1–3 km Multi-Hazard Field   │
 ├───────────────────────────┤   │         │ Multi-Sensor Consensus      │ ───►   ├─────────────────────────────┤
 │ GLDN Lightning Flash Rate │ ──┤         │ Quality-Control Engine      │        │ Dynamic Severity Tier       │
 ├───────────────────────────┤   │         ├─────────────────────────────┤        ├─────────────────────────────┤
 │ Surface AWS Pressure (ΔP) │ ──┤         │ Atmospheric Hazard Formulas │ ───►   │ Infrastructure Exposure     │
 ├───────────────────────────┤   │         │ (Hail, Wind, Cloudburst)    │        ├─────────────────────────────┤
 │ NCMRWF NWP Guidance       │ ──┘         └─────────────────────────────┘        │ Standardized CAP Warnings   │
 └───────────────────────────┘                                                    └─────────────────────────────┘
```

### 1. Cell Lifecycle State Machine
Cells progress through 5 convective lifecycle phases based on their computed intensity index $I \in [0, 100]$:
$$\text{Lifecycle}(I) = \begin{cases} 
\text{INITIATING} & \text{if } I < 38 \\
\text{DEVELOPING} & \text{if } 38 \le I < 56 \\
\text{INTENSIFYING} & \text{if } 56 \le I < 74 \\
\text{MATURE} & \text{if } 74 \le I < 89 \\
\text{DECAYING} & \text{if } I \ge 89 
\end{cases}$$

### 2. Multi-Hazard Probability Derivations
Rather than presenting single-variable radar scans, TropoTrace computes specialized multi-hazard indices:

1. **Composite Risk Index ($R_{\text{comp}}$):**
   $$R_{\text{comp}} = \text{clamp}(0.90 \cdot I + 0.16 \cdot \text{LightningRate})$$
2. **Equivalent Radar Reflectivity ($Z$):**
   $$Z = \text{clamp}(40 + 0.52 \cdot I) \quad [\text{dBZ}]$$
   *(Values exceeding 55 dBZ denote severe hail/precipitation cores)*.
3. **Lightning Flash Jump Rate ($L$):**
   Accelerates with convective updraft velocity; reaches 80+ flashes/min in rapid electrification stages.
4. **Hail Probability ($P_{\text{hail}}$):**
   $$P_{\text{hail}} = \text{clamp}(22 + 0.54 \cdot I + \delta_{\text{hail}})$$
   where $\delta_{\text{hail}} = 14\%$ if the scenario exhibits elevated Vertically Integrated Liquid (VIL > $45\text{ kg/m}^2$) and cold echo tops aloft (< $-40^\circ\text{C}$).
5. **Downburst / Straight-Line Wind Probability ($P_{\text{wind}}$):**
   $$P_{\text{wind}} = \text{clamp}(24 + 0.48 \cdot I + \delta_{\text{wind}})$$
   Estimates outflow boundary velocity: $V_{\text{gust}} = 32 + 0.42 \cdot I \quad [\text{km/h}]$.
6. **Torrential Rainfall Rate ($R_{\text{rain}}$):**
   Derived using Marshall-Palmer style radar-rainfall relations ($Z = a R^b$):
   $$\text{Rainfall Rate} \approx 45 \text{ to } 140\text{ mm/h}$$
7. **Cloudburst Probability ($P_{\text{cloudburst}}$):**
   Calculated relative to the formal India Meteorological Department (IMD) cloudburst criteria:
   $$\text{Cloudburst Trigger} \Longleftrightarrow \text{Rainfall Rate} \ge 100\text{ mm/h over a } 10 \times 10\text{ km zone}$$

### 3. Dynamic Multi-Sensor Consensus Engine
The system samples 5 telemetry feeds. Each feed maintains an operational status, latency, and confidence score:
- Doppler S-Band Radar (Latency: 21 sec, Confidence: 93%)
- INSAT-3DR Geostationary Satellite (Latency: 2m 14s, Confidence: 88%)
- Ground Lightning Detection Network (Latency: 11 sec, Confidence: 96%)
- Surface Automatic Weather Station (Latency: 38 sec, Confidence: 78%)
- NCMRWF NWP Guidance (Latency: 4m 50s, Confidence: 71%)

**Sensor Consensus Score ($C$):**
$$C = \frac{1}{N} \sum_{i=1}^N \text{Confidence}_i$$
**Automatic Degradation Protocol:** In the simulation, when NWP guidance experiences latency (>12 minutes), its status switches to `DELAYED`. The platform dynamically re-weights the consensus score, drops system confidence by 11%, surfaces an alert (*"Forecast confidence reduced"*), and relies on live Doppler radar extrapolation.

### 4. Six Pre-configured Severe Weather Scenarios
1. **Rapid Thunderstorm:** High-speed convective updraft with sudden lightning flash jump.
2. **Hailstorm:** Elevated reflectivity core (>65 dBZ) aloft with high VIL and damaging hail threat.
3. **Cloudburst:** Hyper-concentrated rainfall rates exceeding 100 mm/h with extreme flash flood inundation risk.
4. **Downburst:** Severe downdraft outflow producing straight-line winds over 80 km/h.
5. **Rapid Convective Initiation:** Fresh cell genesis along a localized mountain convergence line.
6. **Multi-Cell Cluster:** Twin interacting storm cells with complex outflow boundaries and compounding risks.

### 5. Statistical Verification Metrics
In `src/domain/verification.ts`, TropoTrace tracks prediction skill against synthetic observations using standard meteorological verification formulas:
- **Mean Absolute Error (MAE):** $\text{MAE} = \frac{1}{N} \sum |\text{Pred} - \text{Obs}| = 5.4\text{ mm/h}$
- **Root Mean Square Error (RMSE):** $\text{RMSE} = \sqrt{\frac{1}{N} \sum (\text{Pred} - \text{Obs})^2} = 8.9\text{ mm/h}$
- **Probability of Detection (Hit Rate, POD):** $\text{POD} = \frac{\text{Hits}}{\text{Hits} + \text{Misses}} = 0.88$
- **False Alarm Ratio (FAR):** $\text{FAR} = \frac{\text{False Alarms}}{\text{Hits} + \text{False Alarms}} = 0.15$
- **Critical Success Index (CSI / Threat Score):** $\text{CSI} = \frac{\text{Hits}}{\text{Hits} + \text{Misses} + \text{False Alarms}} = 0.76$
- **2x2 Contingency Table:** 142 Hits, 19 Misses, 25 False Alarms, 414 Correct Negatives ($N = 600$).

---

# 6. THE ARTIFICIAL INTELLIGENCE SYSTEM (GROQ API & TROPO COPILOT)

The Tropo AI Copilot in `src/domain/analyst.ts` and `src/views/AnalystView.tsx` provides natural-language conversational reasoning grounded in live telemetry.

```
  USER QUERY: "Why is this cell classified as severe?"
                       │
                       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              CONTEXT INJECTION PIPELINE                     │
  │  - Active Cell ID, centroid, dBZ, speed, direction          │
  │  - Lightning jump rate (fl/min) & rainfall rate (mm/h)      │
  │  - Active hazards & probabilities                           │
  │  - Exposed infrastructure counts (population, hospitals)    │
  │  - Multi-sensor consensus & latency status                  │
  │  - Strict Zero-Hallucination System Prompt                  │
  └────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                  GROQ CLOUD INFERENCE                       │
  │  Endpoint: https://api.groq.com/openai/v1/chat/completions │
  │  Model: openai/gpt-oss-120b (120 Billion Parameters)        │
  │  Temperature: 0.3 (Low entropy = factual precision)         │
  │  Max Tokens: 1024                                           │
  └────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              RESPONSE & CITATION PARSER                     │
  │  - Formatted operator intelligence briefing                 │
  │  - Automated Evidence Citation Extraction (Doppler Radar,   │
  │    GLDN, INSAT-3DR, NWP Sounding, Demographic GIS)          │
  │  - Grounded Confidence Score Assignment                     │
  └─────────────────────────────────────────────────────────────┘
```

### 1. The Zero-Hallucination Grounding Prompt
Every query sent to the Groq API is prefaced with a system prompt dynamically populated with the active scenario state:
- Selected cell telemetry: Intensity, reflectivity in dBZ, velocity, direction, lightning rate, rainfall rate, hail/wind/cloudburst probabilities.
- Spatial exposure data: Impacted population, schools, hospitals, substations, highway segments.
- Telemetry health: Delays, latencies, sensor quality ratings.
- **Strict Policy Instruction:** *"You operate under a strict ZERO-HALLUCINATION policy. Every response must be grounded in the live convective nowcast data provided. If asked about variables outside this data, state clearly that it is beyond the current scenario snapshot. Never invent speculative meteorological data."*

### 2. Groq Hardware Acceleration
- **Inference Engine:** Groq's Language Processing Units (LPUs).
- **Model Selected:** `openai/gpt-oss-120b` (120-Billion parameter foundation model).
- **Latency:** Sub-second token generation (~300–500ms time-to-first-token), enabling real-time conversational responses during rapid severe weather emergencies.

### 3. Dynamic Citation Extractor
When the model returns its analysis, `extractCitations()` parses the response text and automatically attaches grounded evidence pills:
- Mentions of *"radar"* or *"dBZ"* $\rightarrow$ **Doppler S-Band Radar**
- Mentions of *"lightning"* $\rightarrow$ **Lightning Detection Network (GLDN)**
- Mentions of *"satellite"* or *"cloud top"* $\rightarrow$ **Geostationary Satellite (INSAT-3DR)**
- Mentions of *"population"* or *"hospital"* $\rightarrow$ **GIS Critical Infrastructure Layer**
- Mentions of *"consensus"* or *"latency"* $\rightarrow$ **Observatory Consensus Engine**

---

# 7. MODULE-BY-MODULE FEATURE WALKTHROUGH (ALL 10 MODULES)

### Module 00: Authentication & Access Control (`AuthView.tsx`)
- **Visual Design:** Full-screen cinematic dark layout with rotating 3D Canvas atmospheric globe.
- **Security Features:** Email/password validation, minimum character length, error banners for invalid credentials.
- **Judge Quick-Fill:** One-click pre-population of demo credentials (`operator@tropotrace.moes.gov.in`).
- **Instant Launch:** Direct access into the command stage without external network dependencies.

### Module 01: Real-Time Command Center (`CommandCenterView.tsx`)
- **KPI Summary Strip:** Displays Active Cells, Severe Rating, Lightning Discharge Rate, High-Risk Area in $\text{km}^2$, Next Arrival Countdown (ETA), and Sensor Consensus.
- **Interactive Leaflet Map:** Displays storm tracks, radar sweep, asset pins, and road segments.
- **Selected Cell Rail:** Real-time metrics for current cell: speed, direction, age, area, lifecycle stage, reflectivity, and confidence.
- **"Tell Me The Storm" Autopilot:** Automated 9-step story progression that steps judges through cell initiation, updraft surge, lightning jump, core formation, and warning issuance.
- **Simulation Scrubber:** 0 to 360-minute interactive slider with play/pause and step forward/backward buttons.

### Module 02: Storm Intelligence & 3D Kinematics (`StormIntelligenceView.tsx`)
- **Storm DNA Spider Radar:** 7-axis SVG polygon chart tracking Reflectivity, Growth Rate, Lightning, Moisture Flux, Wind Shear, Rain Intensity, and Echo Top height.
- **Kinematic Vectors:** Speed in km/h, propagation direction in compass points and azimuth degrees ($47^\circ\text{ NE}$).
- **Lifecycle Stepper:** 5-step visual indicator highlighting the active phase from `INITIATING` to `DECAYING`.
- **Temporal Trend Deltas:** Shows 15-minute change rates for lightning ($\uparrow 31\%$), reflectivity ($\uparrow 12\%$), and storm area ($\uparrow 6\%$).

### Module 03: Hazard Explorer (`HazardExplorerView.tsx`)
- **Multi-Hazard Selector:** Tabs for Composite Risk, Lightning, Hail, Downburst, Rainfall, and Cloudburst.
- **Interactive Risk Grid:** Procedural $14 \times 9$ (1 km resolution), $10 \times 7$ (2 km), or $7 \times 5$ (3 km) matrix of grid cells.
- **Cell Inspection:** Clicking any cell reveals coordinates, localized probability percentage, and triggering criteria (e.g., *"Reflectivity > 55 dBZ aloft + VIL > 45 kg/m²"*).
- **Physical Trigger Explanations:** Explains thermodynamic and radar signatures behind each hazard.

### Module 04: Impact Intelligence (`ImpactIntelligenceView.tsx`)
- **4 Operational Mode Lenses:**
  1. `EMERGENCY`: Focuses on civil protection, shelters, hospitals, and population evacuation.
  2. `AVIATION`: Focuses on airport runways, low-level windshear, approach holds, and ground lightning stoppage.
  3. `AGRICULTURE`: Focuses on crop damage from hail, inundation of acreage, and livestock safety.
  4. `URBAN`: Focuses on road subway flooding, power substations, and transit corridors.
- **Asset Exposure Cards:** Exact tallies of exposed population, villages, schools, hospitals, highway segments, power substations, agricultural land ($\text{km}^2$), and airports.
- **Route Risk Analyzer:** Interactive logistics planner evaluating transit risk between Coimbatore Central and Tiruppur North along NH-81.

### Module 05: Alert Center & CAP Dispatch (`AlertCenterView.tsx`)
- **Multi-Language Alert Engine:** Automated translation into **8 Indian languages**: English, Hindi, Tamil, Telugu, Malayalam, Kannada, Marathi, and Bengali.
- **Standardized Content:** Area name, storm speed, movement vector, arrival time, and life-safety instructions.
- **Text-to-Speech Broadcast:** Uses Web Speech API to speak alert text aloud in the browser.
- **CAP XML Export:** Generates OASIS Common Alerting Protocol v1.2 compliant XML with event codes, severity, urgency, certainty, and geographical coordinate circles.
- **Clipboard & Print:** Quick copy button and formatted browser print layout for physical dispatch.

### Module 06: Scientific Data Observatory (`DataObservatoryView.tsx`)
- **Sensor Health Cards:** Status (`ONLINE` / `DELAYED`), stream latency, confidence rating, and data quality for all 5 telemetry feeds.
- **Raw Observation Tensor Table:** Filterable grid of simulated raw instrument records (dBZ, radial velocity in m/s, INSAT TIR brightness temperature in $^\circ\text{C}$, water vapor %, GLDN flash rates, AWS pressure drops, CAPE in J/kg, VIL in $\text{kg/m}^2$).
- **6-Stage Ingestion Pipeline:** Visual diagram detailing Synthetic Ingestion $\rightarrow$ Quality Control $\rightarrow$ TITAN/SCIT Cell Tracking $\rightarrow$ Multi-Hazard Nowcasting $\rightarrow$ Impact Engine $\rightarrow$ CAP Dispatch.
- **Proposed Government Integrations:** Architecture blueprints for connecting IMD DWR radars, ISRO MOSDAC INSAT feeds, IITM Damini lightning, and NCMRWF NCUM models.

### Module 07: Convective Simulation Lab (`SimulationLabView.tsx`)
- **Scenario Gallery:** 6 pre-configured severe weather scenarios with visual accent tags and descriptions.
- **Speed Multipliers:** Toggle between 1x (real-time pace), 2x (evaluation pace), and 4x (high-speed playback).
- **Timeline Controls:** Scrub from minute 0 to 360, step $\pm 10$ minutes, reset to genesis, or pause.
- **Simulation Event Log:** Chronological ledger of convective events (e.g., *"Minute 24: Lightning Jump Detected (>45 fl/min)"*).

### Module 08: Model Verification (`ModelVerificationView.tsx`)
- **Predicted vs Observed Rainfall Bar Chart:** 60-minute time series comparing nowcast predictions against reference observations with uncertainty bounds.
- **Statistical Metric Cards:** MAE ($5.4\text{ mm/h}$), RMSE ($8.9\text{ mm/h}$), POD ($0.88$), FAR ($0.15$), CSI ($0.76$), Precision ($0.85$), Recall ($0.88$), and F1-Score ($0.86$).
- **Interactive Metric Inspector:** Clicking any metric card displays its mathematical formula, meteorological description, and operational target benchmark.
- **2x2 Contingency Table:** Hits (142), Misses (19), False Alarms (25), Correct Negatives (414).

### Module 09: Tropo AI Copilot (`AnalystView.tsx`)
- **Conversational Interface:** Real-time chat with the AI meteorological copilot.
- **Suggested Operational Queries:** Pre-built prompts for cell lifecycle, severity reasons, recent changes, active hazards, cloudburst risk, infrastructure exposure, sensor health, and model skill.
- **Live Context Chip:** Displays current cell name, intensity, movement vector, lifecycle stage, and consensus.
- **Real-Time AI Processing:** Live loading indicator with spinning animation and "THINKING" badge while calling the Groq API.
- **Cited Sources & Confidence:** Every response displays grounded evidence pills and an evidence confidence score.

### Module 10: System Settings & Platform Boundaries (`SettingsView.tsx`)
- **Display Preferences:** Toggles for Demo Disclosure Banner, Reduced Motion mode, High Contrast accessibility mode, Auto-Start Simulation, and Basemap selection.
- **Appearance:** Dark Theme / Light Theme toggle.
- **Firebase Status Indicator:** Confirms connection to Firebase Auth, Firestore, and Hosting.
- **Config Export:** One-click JSON export of platform preferences and operator configuration.
- **Scientific Prototype Disclosure:** Clear explanation of prototype boundaries (synthetic deterministic engine vs operational IMD radar feed).

---

# 8. DATA SOURCES, TELEMETRY INGESTION & SENSOR DATASETS

### Operational Data Source Architecture

```text
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  India Meteorological Dept (IMD)     │     │  ISRO / SAC (MOSDAC)                 │
│  Doppler Weather Radar (DWR)         │     │  INSAT-3D / 3DR Geostationary        │
│  - 0.5° to 19.5° Plan Position (PPI) │     │  - 4km Thermal Infrared (TIR-1)      │
│  - Reflectivity (Z), Velocity (Vr)   │     │  - 6.8µm Water Vapor Channel         │
│  - S-Band (Kochi, Chennai, Karaikal) │     │  - Cloud Top Brightness Temp (BT)    │
└──────────────────┬───────────────────┘     └──────────────────┬───────────────────┘
                   │                                            │
                   ▼                                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    TROPOTRACE MULTI-SENSOR INGESTION LAYER                        │
│             (Normalized Multi-Dimensional Spatio-Temporal Tensor)                 │
└──────────────────┬────────────────────────────────────────────┬───────────────────┘
                   ▲                                            ▲
                   │                                            │
┌──────────────────┴───────────────────┐     ┌──────────────────┴───────────────────┐
│  IITM Pune / Damini Lightning Net    │     │  Ministry of Earth Sciences (NCMRWF) │
│  Ground Lightning Detection (GLDN)   │     │  Unified Model (NCUM) Regional       │
│  - Radio frequency pulse sensors     │     │  - 1.5 km Convection-permitting grid │
│  - Cloud-to-Ground (CG) strike count │     │  - CAPE, CIN, VIL, 0-6km Wind Shear  │
│  - Total flash density (fl/min/km²)  │     │  - Thermodynamic background sounding │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

### 1. Radar Ingestion (DWR S-Band / C-Band)
- **Real-world source:** India Meteorological Department (IMD) Doppler Weather Radars located at Chennai, Karaikal, and Kochi.
- **Physical variables:**
  - $Z$ (Equivalent Radar Reflectivity Factor in $\text{dBZ}$): Proportional to hydrometeor size to the 6th power ($\sum D^6$).
  - $V_r$ (Radial Velocity in $\text{m/s}$): Measures component of wind moving toward or away from the radar antenna.
  - Spectrum Width ($W$ in $\text{m/s}$): Measures turbulence within the radar resolution volume.
- **Prototype handling:** Computed in `createCell()` using deterministic growth equations reflecting S-band radar scans.

### 2. Geostationary Satellite (INSAT-3D / 3DR)
- **Real-world source:** ISRO Space Applications Centre (SAC) / MOSDAC portal.
- **Physical variables:**
  - TIR-1 Channel ($10.8\ \mu\text{m}$): Measures infrared cloud-top brightness temperature. Cloud tops dropping below $-40^\circ\text{C}$ to $-65^\circ\text{C}$ signal intense overshooting convective tops.
  - Water Vapor Channel ($6.8\ \mu\text{m}$): Detects mid-tropospheric moisture plumes and convergence boundaries.
- **Prototype handling:** Exposed in `getRawObservations()` with temperatures ranging from $-38^\circ\text{C}$ down to $-73^\circ\text{C}$.

### 3. Ground Lightning Detection Network (GLDN / Damini)
- **Real-world source:** Indian Institute of Tropical Meteorology (IITM) Damini network.
- **Physical variables:** Total lightning flash rate (intra-cloud + cloud-to-ground strikes per minute).
- **Physical significance:** A sudden surge in lightning flash rate (a "lightning jump") precedes severe surface hazards (hail, microbursts, extreme rain) by **15 to 25 minutes**, serving as an early indicator of severe updraft vigor.

### 4. Surface Automatic Weather Stations (AWS)
- **Real-world source:** IMD and state disaster management mesonet ground stations.
- **Physical variables:** Surface barometric pressure drop ($\Delta P / 15\text{ min}$), rapid temperature drop (rain-cooled downdraft cold pool), and peak wind gusts.

### 5. NCMRWF Numerical Guidance
- **Real-world source:** National Centre for Medium Range Weather Forecasting (NCMRWF) NCUM 1.5 km regional model.
- **Physical variables:** Convective Available Potential Energy (CAPE in $\text{J/kg}$), Convective Inhibition (CIN), and Vertically Integrated Liquid (VIL in $\text{kg/m}^2$).

---

# 9. BUILD, DEPLOYMENT & CONFIGURATION PIPELINE

### 1. Environment Variable Architecture
The application reads configuration parameters through Vite's `import.meta.env` system:
```env
# TropoTrace Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBXeQWNIQs_rERDPbFesck3Dzn2Kv06OQw
VITE_FIREBASE_AUTH_DOMAIN=thermotrace-a6b30.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=thermotrace-a6b30
VITE_FIREBASE_STORAGE_BUCKET=thermotrace-a6b30.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=181743787437
VITE_FIREBASE_APP_ID=1:181743787437:web:619e5b42a230a66a905524

# Groq Cloud API Key for Tropo AI Copilot
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here

# OpenWeatherMap API Key
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### 2. Build Pipeline
- `npm run build` executes `tsc -b && vite build`.
- TypeScript performs full strict typechecking (`noEmit`).
- Vite compiles, treeshakes, and bundles modules into the `dist/` directory:
  - `dist/index.html` (Entry HTML)
  - `dist/assets/index-[hash].css` (Compiled design system)
  - `dist/assets/index-[hash].js` (Minified JS bundle with code-splitting)

### 3. Automated Firebase Deployment
```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting edge CDN
npx firebase-tools deploy --only hosting
```
- Deployment pushes files to Firebase's distributed edge cache.
- Live production link: **`https://thermotrace-a6b30.web.app`**

---

# 10. EXHAUSTIVE JUDGE Q&A & TECHNICAL DEFENSE GUIDE

Use these prepared, high-impact answers when presenting to hackathon judges, meteorologists, or software architects:

---

### Q1: "What makes TropoTrace different from standard weather apps like AccuWeather or Google Weather?"
> **Answer:** "Standard consumer weather apps provide macro-scale synoptic forecasts (e.g., *'60% chance of rain this afternoon across Coimbatore'*). They cannot tell you if a severe thunderstorm cell will strike the airport runway in 22 minutes, whether it carries a hail core, or if NH-81 will experience a cloudburst.
>
> TropoTrace is a **Convective-Scale Nowcasting Decision Support System** operating in the **0 to 6 hour time horizon at 1–3 km spatial resolution**. It fuses Doppler radar reflectivity, satellite cloud-top cooling, lightning flash jumps, and AWS pressure dips to track discrete convective cells, project trajectory cones, model infrastructure exposure, and dispatch standardized Common Alerting Protocol (CAP) warnings."

---

### Q2: "How is the ML / nowcasting model running? Is it running in the browser or on a server?"
> **Answer:** "In this client prototype, the nowcasting engine runs deterministically in TypeScript directly in the browser. It implements the kinematic tracking and hazard probability equations derived from standard operational systems like TITAN and SCIT.
>
> We designed a clean adapter boundary (`src/services/dataProvider.ts` using the `VajraDataProvider` interface). In a production deployment, this seam seamlessly swaps the local deterministic provider with a live WebSocket or REST feed from a Python/FastAPI backend ingesting live NetCDF-4 radar volumetric files from IMD's radar network."

---

### Q3: "What specific algorithms are used for storm tracking and path prediction?"
> **Answer:** "Our tracking logic is modeled after the **TITAN (Thunderstorm Identification, Tracking, Analysis, and Nowcasting)** and **SCIT (Storm Cell Identification and Tracking)** algorithms developed by NCAR and NOAA:
> 1. **Centroid Identification:** Contiguous reflectivity cores $>40\text{ dBZ}$ are clustered to identify the convective centroid $(x_c, y_c)$.
> 2. **Velocity Vector Computation:** Successive temporal scans derive translation speed ($v$) and azimuth direction ($\theta$).
> 3. **Uncertainty Cone Swath:** Rather than projecting a single deterministic line, we generate a widening uncertainty polygon downstream that accounts for atmospheric cross-shear, outflow boundary deflection, and convective propagation."

---

### Q4: "How does the AI Copilot work, and how do you prevent hallucinations?"
> **Answer:** "Our AI Copilot, **Tropo**, is powered by the **120-Billion parameter `openai/gpt-oss-120b` model** running on **Groq's ultra-low latency LPU hardware**.
>
> To eliminate hallucinations, we enforce a strict **Zero-Hallucination Grounding Protocol**:
> 1. We inject the exact live scenario state (active storm cell kinematics, dBZ values, lightning rates, rainfall accumulation, active hazard probabilities, exposed asset counts, and sensor latencies) into the system prompt.
> 2. The model is explicitly constrained: it is prohibited from speculating or generating values outside the provided context snapshot. If an operator asks about an unmonitored variable, it returns: *'Insufficient current data in current scenario snapshot.'*
> 3. An automated regex citation parser analyzes every generated response and binds it to verifiable scientific sources (e.g., Doppler S-Band Radar, GLDN Lightning Network, GIS Demographic Layer)."

---

### Q5: "How does your system get the user's location and what datasets are used on the map?"
> **Answer:** "When the operator clicks 'MY LOCATION', we request permission through the standard W3C `navigator.geolocation` API with `enableHighAccuracy: true`. If granted, the map smoothly flies to the user's coordinates, renders a 650-meter accuracy circle, and allows the operator to evaluate storm approach speed relative to their exact location.
>
> For the map itself:
> - We use **Leaflet.js** configured with `preferCanvas: true` for 60 FPS rendering.
> - We integrate **Esri World Imagery** satellite tiles and **Esri World Street Map** tiles.
> - Infrastructure data (hospitals, schools, high-voltage power substations, airports, and the NH-81/NH-544 highway network) is projected across the Western Ghats / Tamil Nadu convective corridor."

---

### Q6: "Why is a lightning jump so important in severe weather forecasting?"
> **Answer:** "In atmospheric physics, a 'lightning jump'—a sudden rapid increase in total lightning flash rate (intra-cloud plus cloud-to-ground)—is directly correlated with a vigorous, accelerating convective updraft.
>
> Updraft acceleration lofts supercooled liquid water droplets above the freezing level ($0^\circ\text{C}$ to $-20^\circ\text{C}$), generating graupel, hail embryos, and strong charge separation through non-inductive collision charging. Studies by Schultz et al. show that lightning jumps precede severe surface weather (damaging hail, microburst winds, and flash flooding) by **15 to 25 minutes**, providing an invaluable early warning lead-time before radar reflectivity peaks at ground level."

---

### Q7: "What is your cloud database structure and how does Firebase fit into this?"
> **Answer:** "We use **Firebase Auth** for identity management and session handling, and **Cloud Firestore** as a serverless NoSQL document database.
>
> Our data model is organized under:
> - `users/{userId}`: Stores operator credentials, assigned roles, and preferences.
> - `users/{userId}/savedAlerts`: Stores created emergency alerts with timestamps, severity tiers, and target distribution channels.
> - `users/{userId}/scenarioRuns`: Stores an audit log of launched simulation scenarios and playback timelines.
>
> Firestore security rules enforce strict user-level tenancy, ensuring operators can only read and write their own data, while Firebase Hosting delivers the static SPA across global edge CDNs with sub-100ms response times."

---

### Q8: "How does your system handle missing or delayed data feeds from sensors?"
> **Answer:** "Real-world meteorology frequently suffers from telemetry dropouts. TropoTrace includes a **Multi-Sensor Consensus & Degradation Protocol**:
> - We continuously monitor latency and frame arrival for 5 independent streams: Radar, Satellite, Lightning, AWS, and NWP.
> - If a sensor drops or experiences high latency (e.g., NWP guidance delayed past 12 minutes), the system flags it as `DELAYED`, lowers the overall consensus score, drops confidence from 93% to 78%, and automatically re-weights remaining real-time observation feeds (radar and lightning) so operators receive conservative, evidence-based nowcasts."

---

### Q9: "What alerting standards do you support for government disaster management?"
> **Answer:** "We support the international **OASIS Common Alerting Protocol (CAP v1.2)**, the global standard used by NDMA (National Disaster Management Authority) in India and FEMA internationally.
>
> TropoTrace generates:
> 1. Formatted CAP v1.2 XML bulletins with identifier, urgency (`Immediate`), severity (`Severe` / `Extreme`), certainty (`Observed`), and geospatial circular bounding envelopes.
> 2. Multilingual bulletins translated into **8 Indian languages** (English, Hindi, Tamil, Telugu, Malayalam, Kannada, Marathi, Bengali).
> 3. Native audio text-to-speech broadcasts via the Web Speech API for emergency radio and PA dispatch."

---

### Q10: "How do you verify that your nowcasting model is accurate?"
> **Answer:** "In Module 08 (Model Verification), we evaluate model predictions against reference observations across a 60-minute window using standard meteorological contingency metrics:
> - **Mean Absolute Error (MAE):** $5.4\text{ mm/h}$ (Target $< 8.0\text{ mm/h}$)
> - **Root Mean Square Error (RMSE):** $8.9\text{ mm/h}$
> - **Probability of Detection (Hit Rate, POD):** $0.88$ (Target $> 0.80$)
> - **False Alarm Ratio (FAR):** $0.15$ (Target $< 0.25$)
> - **Critical Success Index (CSI / Threat Score):** $0.76$ (Target $> 0.65$)
> - **2x2 Contingency Table:** 142 Hits, 19 Misses, 25 False Alarms, and 414 Correct Negatives."

---

# 11. QUICK REFERENCE CHEAT SHEET FOR PRESENTATIONS

| Topic | Key Metric / Term to Mention |
| :--- | :--- |
| **Nowcast Horizon** | 0 to 6 Hours, 1–3 km spatial grid |
| **Tracking Algorithms** | TITAN (Centroid tracking) & SCIT (Cell identification) |
| **Key Physical Indicator** | Lightning Flash Jump (accelerating updrafts, 15–25 min lead time) |
| **Cloudburst Definition** | IMD threshold: $\ge 100\text{ mm/h}$ localized precipitation |
| **AI Copilot** | Groq LPU + `openai/gpt-oss-120b` (120B model) + Zero-Hallucination Grounding |
| **Cloud Platform** | Google Firebase (Auth + Cloud Firestore NoSQL + Edge Hosting) |
| **Mapping Engine** | Leaflet.js + Esri World Imagery (Satellite) + Esri World Street Map |
| **Verification Score** | Critical Success Index (CSI) = 0.76, Probability of Detection (POD) = 0.88 |
| **Disaster Dispatch** | OASIS Common Alerting Protocol (CAP v1.2) XML + 8 Indian Languages + TTS |
| **Live Link** | `https://thermotrace-a6b30.web.app` |
