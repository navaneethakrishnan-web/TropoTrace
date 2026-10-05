# TropoTrace — Convective Intelligence Command Center

> A hyperlocal convective weather intelligence platform built with React, TypeScript, Vite, Leaflet, and Firebase.

![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange)

---

## Overview

TropoTrace is a real-time convective storm tracking and analysis command center. It provides operators with a comprehensive suite of tools for monitoring severe weather phenomena including lightning, hail, cloudbursts, and downbursts.

### Key Features

- **Command Center** — Real-time KPI dashboard with storm cell tracking, hazard probability, and arrival estimates
- **Storm Intelligence** — Interactive GIS map with Leaflet, animated weather overlays, and phenomenon-specific visualization
- **Hazard Explorer** — Multi-hazard analysis with severity classification and impact modeling
- **Impact Intelligence** — Route planning, asset tracking, and population exposure analysis
- **Alert Center** — Multi-language alert composition with severity levels and distribution channels
- **Data Observatory** — Live data source monitoring, health metrics, and consensus scoring
- **Simulation Lab** — Scenario playback engine with 4 pre-built weather scenarios
- **Verification** — Model skill metrics (MAE, RMSE, POD, FAR, CSI) with predicted vs observed comparison
- **TropoTrace Analyst** — Structured-data Q&A assistant grounded in the current simulation snapshot
- **System Settings** — Display preferences, Firebase integration status, and prototype boundary disclosure

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5 |
| **Build** | Vite 6 |
| **Maps** | Leaflet + OpenStreetMap |
| **Auth** | Firebase Authentication (Email/Password) |
| **Database** | Cloud Firestore |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS with custom design system |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Firebase project](https://console.firebase.google.com/) with Auth and Firestore enabled

### 1. Clone the repository

```bash
git clone https://github.com/navaneethakrishnan-web/TropoTrace.git
cd TropoTrace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Firebase project values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Enable Firebase Auth

In the [Firebase Console](https://console.firebase.google.com/):
1. Go to **Authentication → Sign-in method**
2. Enable **Email/Password**

### 5. Set Firestore Security Rules

In the Firebase Console → **Firestore → Rules**, paste:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, create: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
      match /savedAlerts/{alertId} {
        allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
      }
      match /scenarioRuns/{runId} {
        allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account to get started.

---

## Deployment (Firebase Hosting)

```bash
# Install Firebase CLI (one-time)
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting
# Select your project, set public dir to "dist", SPA = yes

# Build and deploy
npm run build
firebase deploy --only hosting
```

---

## Project Structure

```
src/
├── app/
│   ├── App.tsx          # Main application shell, routing, all views
│   └── app.css          # Complete design system and responsive styles
├── domain/
│   ├── simulation.ts    # Deterministic weather model and snapshot generator
│   └── types.ts         # TypeScript type definitions
├── integrations/
│   └── firebase.ts      # Firebase init, Auth helpers, Firestore helpers
└── services/
    └── dataProvider.ts   # Data provider interface (demo/Firestore)
```

---

## Firestore Data Model

```
users/{userId}
├── email: string
├── role: string
├── createdAt: timestamp
├── savedAlerts/{alertId}
│   ├── title, language, severity, area, message: string
│   └── createdAt: timestamp
└── scenarioRuns/{runId}
    ├── scenarioKey, scenarioLabel, mode: string
    ├── lastMinute: number
    └── startedAt: timestamp
```

---

## License

MIT © TropoTrace
