# VAJRA-X API Contract (planned)

The current frontend uses `createSnapshot()` directly. These contracts document the seam for a future FastAPI, WebSocket or Firebase-backed service.

## REST endpoints

```text
GET /api/storms
GET /api/storms/{id}
GET /api/hazards
GET /api/nowcast
GET /api/lightning
GET /api/radar
GET /api/satellite
GET /api/impact
GET /api/alerts
GET /api/data-health
GET /api/timeline
GET /api/verification
```

## Live stream

```text
/ws/live
```

A live message should include a version, event timestamp, source timestamps, current cell state, hazard predictions, impact zone, alert state and confidence metadata.

## Normalized example

```json
{
  "scenario": "rapid-thunderstorm",
  "minute": 38,
  "selectedCellId": "VX-1A7",
  "confidence": 82,
  "consensus": 87,
  "severity": "WARNING",
  "cells": [{
    "id": "VX-1A7",
    "centroid": { "lat": 11.02, "lon": 76.96 },
    "lifecycle": "INTENSIFYING",
    "reflectivity": 62,
    "lightningRate": 69,
    "rainfallRate": 82,
    "hailProbability": 64,
    "windProbability": 60,
    "cloudburstProbability": 58,
    "speed": 31,
    "direction": "NE"
  }],
  "sources": [{
    "shortName": "RADAR",
    "status": "ONLINE",
    "latency": "21 sec",
    "confidence": 93,
    "quality": "STRONG"
  }]
}
```

## Firebase mapping

Authentication owns operator identity. Firestore collections can mirror `alerts`, `scenarioRuns`, `savedViews`, and `verificationRuns`. High-rate observations should be normalized server-side and exposed as snapshot documents or a WebSocket stream; do not write every raw sensor packet directly from the browser.
