# VAJRA-X Architecture

## Current prototype shape

VAJRA-X is a client-rendered Vite application. The React shell is responsible for layout, navigation and visualization. The domain layer owns all deterministic meteorological demo calculations; React never calculates risk from raw values inside map components.

```text
App shell
  ├── view navigation + responsive layout
  ├── shared simulation snapshot
  ├── command-center map / panels
  └── operational views
        ↓
Domain simulation
  ├── scenario definitions
  ├── storm cell lifecycle
  ├── tracks + uncertainty cone
  ├── hazard probabilities
  ├── data-source health
  └── impact + alert derivations
        ↓
Provider seam
  ├── demoProvider (current deterministic source)
  └── future Firebase/API/WebSocket provider
```

## Key modules

`src/domain/types.ts` contains the typed contracts for StormCell, DataSource, HazardResult, ImpactAssets and SimulationSnapshot. `src/domain/simulation.ts` creates repeatable snapshots from scenario and timeline inputs. `src/services/dataProvider.ts` exposes the adapter boundary. `src/app/App.tsx` composes the shell and views. `src/app/app.css` contains the command-center visual system, responsive behavior and reduced-motion fallback.

## Data flow

The current `minute` value is advanced by a local timer when Live stream is enabled. `createSnapshot(scenario, minute, modeFactor)` returns a complete snapshot. The snapshot flows down into the map, KPI strip, selected-cell rail, alert composer, verification dashboard and analyst panel. Scenario cards reset the simulation and keep the demonstration deterministic.

## Future Firebase shape

Firebase Authentication can provide operator identity and role claims. Firestore can persist operator profiles, saved alerts, scenario runs, notes and post-event verification records. A real feed adapter should publish normalized observations through a server or trusted ingestion worker rather than exposing provider keys in the browser. For high-frequency sensor updates, use a backend/WebSocket or a Firestore listener that emits the same normalized shape expected by the view layer.

The frontend should continue to render `loading`, `empty`, `error`, `offline`, and `confidence reduced` states when a provider replaces the demo source. The demo provider remains a useful fallback for rehearsals and judging.

## Deployment shape

Firebase Hosting serves `dist` as a static SPA. The `firebase.json` file includes a catch-all rewrite to `index.html`, while `public/manus-routes.json` remains available as a static route manifest for the platform preview. If the application later adds protected server routes, keep them in a separate trusted runtime and never bundle server credentials into Vite output.
