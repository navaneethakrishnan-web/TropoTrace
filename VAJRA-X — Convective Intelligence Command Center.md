# VAJRA-X — Convective Intelligence Command Center

VAJRA-X is a React/Vite/TypeScript prototype for **hyperlocal convective intelligence and 0–6 hour severe-weather nowcasting**. It presents a command-center workflow for observing, explaining, replaying, and communicating synthetic storm intelligence:

> **OBSERVE → DETECT → FUSE → NOWCAST → EXPLAIN → IMPACT → WARN → VERIFY**

This project is prepared for import into **Antigravity**, where Firebase Authentication, Firestore, and Firebase Hosting can be connected using the browser-safe Firebase configuration values.

## Important product boundary

This is a **demonstration model**. It is not operational meteorological guidance, does not claim real-time IMD data, and does not connect to government alert infrastructure. The UI intentionally labels simulated or probabilistic content with terms such as `DEMO MODE`, `SIMULATED SENSOR STREAM`, `PROTOTYPE ESTIMATE`, `PROBABILISTIC PREDICTION`, and `MODEL CONFIDENCE`.

The current storm data is deterministic synthetic data generated in `src/domain/simulation.ts`. It is suitable for demos, judging, UI review, and integration work—not for real-world warnings.

---

## Quick start

Requirements:

- Node.js 18+
- npm 9+
- Firebase CLI only when deploying to Firebase Hosting

```bash
npm install
npm run dev
```

The development server listens on port `3000`.

Validate the project:

```bash
npm run typecheck
npm run build
```

The production output is written to `dist/`.

---

## Demo login credentials

The ZIP includes a working local demo login so the application opens behind an operator access screen.

| Field | Demo value |
|---|---|
| Email | `operator@vajra-x.demo` |
| Password | `VajraDemo2026!` |

The login page also has a **USE DEMO LOGIN** button that fills the credentials automatically.

### How the demo login works

- The login gate is implemented in `src/app/App.tsx` as `LoginPage`.
- A successful demo login writes `vajra-demo-auth=true` and the demo email to `sessionStorage`.
- The session lasts for the current browser tab/session.
- The operator can sign out using the `VX-04` session button in the top-right shell.
- This is intentionally **not production authentication**.

### Important Firebase migration instruction

When Firebase Authentication is connected in Antigravity, replace the local credential check in `LoginPage` with Firebase Auth state:

1. Initialize Firebase from `src/integrations/firebase.ts`.
2. Add the Firebase Web SDK.
3. Use `signInWithEmailAndPassword()` or the selected provider.
4. Subscribe to `onAuthStateChanged()` at the app gate.
5. Keep the dashboard mounted only when Firebase returns an authenticated user.
6. Replace the local `sessionStorage` sign-out with Firebase `signOut()`.
7. Keep the current demo credentials only for local fallback/demo mode, not production.

Do not put Firebase Admin SDK keys, service-account JSON, private keys, or server credentials in the frontend.

---

## What is included

### Command Center

- KPI strip for active cells, severe cells, lightning rate, high-risk area, next arrival, and data confidence
- Real Leaflet GIS canvas using Esri imagery/street basemap options
- Storm cell overlays, risk field, forecast track, map layers, location permission control, and simulation playback
- Atmospheric lens controls for `ALL`, `LIGHTNING`, `HAIL`, `CLOUDBURST`, and `DOWNBURST`
- Story mode and temporal change mode
- Selected-cell intelligence rail with hazard probabilities, evidence contributors, and projected exposure
- Data health strip linking to the Observatory

### Operational views

- Storm Intelligence
- Hazard Explorer
- Impact Intelligence
- Alert Center
- Data Observatory
- Simulation Lab
- Verification
- VAJRA Analyst
- System Settings

All views consume the same deterministic snapshot rather than unrelated placeholder values.

### Simulation Lab behavior

- The application opens with every scenario idle.
- Clicking a scenario card explicitly launches that scenario.
- Launching resets the simulation clock, sets the correct phenomenon lens, starts playback, and navigates to the Command Center map.
- The Command Center becomes the playback surface.
- Stop Simulation pauses playback and preserves the selected scenario as `SELECTED · STOPPED`.
- Command Center atmospheric lens buttons can also activate playback directly.

---

## Project structure

```text
vajrax/
├── index.html                 # Browser entry document and metadata
├── package.json               # Vite, React, Leaflet, TypeScript scripts/dependencies
├── package-lock.json          # Locked npm dependency graph
├── vite.config.ts             # Vite + React configuration; port 3000
├── tsconfig.json              # TypeScript project references
├── tsconfig.app.json          # Application compiler settings
├── tsconfig.node.json         # Vite/Node compiler settings
├── app.config.ts              # Manus project logo metadata
├── firebase.json              # Firebase Hosting SPA configuration
├── .env.example               # Browser-safe VITE_FIREBASE_* variable names
├── public/
│   ├── favicon.svg            # VAJRA-X browser favicon
│   └── manus-routes.json      # Required route manifest for Webdev preview
├── src/
│   ├── main.tsx               # React entrypoint
│   ├── vite-env.d.ts          # Vite environment typings
│   ├── app/
│   │   ├── App.tsx            # Auth gate, shell, routes, views, GIS, simulation UI
│   │   └── app.css            # Complete design system and responsive layout
│   ├── domain/
│   │   ├── types.ts           # Shared domain types and view/scenario identifiers
│   │   └── simulation.ts      # Deterministic synthetic storm model
│   ├── integrations/
│   │   └── firebase.ts        # Browser-safe Firebase configuration seam
│   └── services/
│       └── dataProvider.ts    # Demo provider boundary for Firestore/API replacement
├── ARCHITECTURE.md            # Existing architecture notes
├── API.md                     # Planned API and normalized data contracts
├── MODEL.md                   # Synthetic model assumptions and explainability notes
├── DEMO.md                    # Judge/demo walkthrough
└── README.md                  # This Antigravity handoff guide
```

---

## Antigravity import instructions

1. Import the **entire project folder**, not only `src/`.
2. Preserve the existing Vite/React/TypeScript structure.
3. Run `npm install` from the project root.
4. Run `npm run typecheck` and `npm run build` before making backend changes.
5. Start with `npm run dev` and keep the application on port `3000` unless Antigravity configures another port.
6. Do not replace the existing route manifest at `public/manus-routes.json` unless routes are added or removed.
7. Treat `src/domain/simulation.ts` as the demo data model and `src/services/dataProvider.ts` as the integration boundary.
8. Keep the `DEMO MODE` disclosure visible whenever synthetic data is displayed.
9. Do not delete the Firebase seam; extend it rather than scattering Firebase calls throughout UI components.
10. Preserve the simulation trigger contract: scenario launch must be explicit, must update shared state, and must synchronize the map and Simulation Lab.

### Safe modification rules

- Prefer adding domain/service functions over embedding data-fetching logic in JSX.
- Keep browser-safe Firebase configuration in environment variables only.
- Never commit `.env` files containing secrets.
- Never commit Firebase Admin credentials or service-account JSON.
- Keep all production Firebase calls behind a small service/provider boundary.
- Run typecheck and build after every integration change.
- Keep route changes synchronized with `public/manus-routes.json`.
- Keep the UI’s prototype labels until real observation data has replaced the deterministic model.

---

## Firebase configuration

Copy `.env.example` into the environment configuration used by Antigravity and fill in the browser-safe Firebase Web App values:

```dotenv
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-web-app-id
```

These are Web App configuration values. They are not service-account credentials.

The current Firebase seam exposes:

- `firebaseConfig`
- `firebaseConnectionLabel`
- `FirebaseConfig` type

Extend `src/integrations/firebase.ts` with Firebase initialization only after the environment values are present.

---

## Recommended Firestore model

Use authenticated Firebase users as the ownership boundary. A practical first schema is:

```text
users/{uid}
  displayName
  email
  role                  # operator | analyst | admin
  createdAt

users/{uid}/savedAlerts/{alertId}
  title
  language
  severity
  area
  message
  createdAt

users/{uid}/scenarioRuns/{runId}
  scenarioKey
  scenarioLabel
  startedAt
  stoppedAt
  lastMinute
  mode

users/{uid}/verificationRuns/{runId}
  scenarioKey
  metrics
  createdAt
```

Recommended security rules:

- Require `request.auth != null` for all user-owned collections.
- Require `request.auth.uid == userId` for user subcollections.
- Restrict role changes to an administrative path or controlled Cloud Function.
- Do not allow clients to write server-generated audit fields without validation.
- Keep public prototype/demo data separate from private operator records.

The current deterministic snapshot can continue to run without Firestore. Use Firestore for persistence of user preferences, saved alerts, scenario history, and verification results—not as a replacement for every computed UI field on day one.

---

## Firebase Hosting deployment

After Firebase Auth and Firestore are configured:

```bash
npm install
npm run typecheck
npm run build
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only hosting
```

`firebase.json` already configures `dist` as the Hosting public directory and rewrites application routes to `index.html`.

Before deploying, confirm:

- Firebase Web App configuration is available to the build/runtime environment.
- The selected Firebase project is correct.
- Authentication providers are enabled.
- Firestore rules are deployed and tested.
- No service-account secrets are bundled into `dist`.
- The login page has been migrated from demo credentials to Firebase Auth for production use.

---

## Tech stack

- React
- TypeScript
- Vite
- CSS
- Leaflet
- Esri World Imagery / World Street Map tiles
- Lucide React
- Firebase-ready configuration seam
- Deterministic synthetic storm model

---

## Useful commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server on port 3000
npm run typecheck    # Run TypeScript diagnostics
npm run build        # Build dist/ for production
```

---

## Final handoff checklist

- [x] Working demo login page included
- [x] Demo credentials displayed in the UI and documented here
- [x] Session sign-out control included
- [x] Firebase browser configuration seam preserved
- [x] Firestore migration guidance documented
- [x] Firebase Hosting configuration included
- [x] Antigravity import rules documented
- [x] Project structure documented
- [x] Simulation behavior and trigger contract documented
- [x] Prototype/data safety boundary documented
