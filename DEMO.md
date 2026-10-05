# VAJRA-X Demo Runbook

## 1. Open the command center

Start the site and keep the default `Rapid Thunderstorm` scenario running. Point out the `DEMO MODE` banner, the South India context, active cells, severe cells, lightning rate, high-risk area, arrival countdown and confidence.

## 2. Observe and detect

On the map, identify `CELL-01 / COIMBATORE`. Explain that the cyan historical track, amber forecast track and uncertainty cone communicate movement without presenting the forecast as certainty. The storm lifecycle and intensity are visible in the selected-cell rail.

## 3. Fuse and nowcast

Toggle radar, risk grid and lightning layers. Scrub the timeline or pause the stream. Show that the cell intensity, lightning, rainfall, risk field, ETA and impact estimates update together. Open Hazard Explorer to compare lightning, hail, wind, rainfall and cloudburst probabilities.

## 4. Explain and impact

Use Storm Intelligence to show STORM DNA, lifecycle, recent changes and similar historical demonstration events. Open Impact Intelligence and switch Emergency, Aviation, Agriculture and Urban modes. Point out the exposed population, schools, hospitals, roads, substations and agriculture.

## 5. Warn

Open Alert Center. The severity ladder is evidence-backed, the warning includes affected area, hazards, arrival, confidence and recommended action, and the language selector supports English, Hindi, Tamil, Telugu, Malayalam, Kannada, Marathi and Bengali. Use READ ALERT or COPY ALERT as prototype outputs.

## 6. Verify

Open Verification to show synthetic predicted vs observed rainfall and MAE, RMSE, POD, FAR, CSI, Precision, Recall and F1. Explicitly say these are demonstration metrics and require real ground truth before operational use.

## 7. Analyst

Open VAJRA Analyst and choose “Why is this cell classified as severe?” The answer is generated from the structured demo snapshot. Explain that a future connected version must return `Insufficient current data.` when a requested field is unavailable.

## 8. Firebase handoff

Open Settings to show that Firebase is intentionally not required for the demo. In Antigravity, add browser-safe Firebase values, connect Auth/Firestore through the provider seam, and deploy the generated `dist` directory through Firebase Hosting.
