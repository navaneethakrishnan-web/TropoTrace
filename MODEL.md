# VAJRA-X Demonstration Model

## Purpose

The model in this prototype is a deterministic demonstration engine. Its purpose is to make a severe-weather decision-support workflow tangible: a cell initiates, grows, moves, accumulates evidence, produces hazard probabilities, intersects assets and escalates an alert.

## Scenario inputs

Each scenario defines a starting position, movement vector, intensity baseline, intensity growth, lightning baseline/growth, rainfall baseline/growth and a primary hazard. The timeline is a 0–360 minute demonstration window. The same scenario and minute always produce the same snapshot.

Scenarios included are Rapid Thunderstorm, Hailstorm, Cloudburst, Downburst, Rapid Convective Initiation and Multi-cell Storm.

## Cell lifecycle

Intensity maps to the visual lifecycle states `INITIATING`, `DEVELOPING`, `INTENSIFYING`, `MATURE`, and `DECAYING`. This is a presentation model, not a scientifically validated classifier.

## Hazard logic

The composite value is derived from intensity and lightning rate. Lightning is derived from the scenario lightning curve. Hail, wind, rainfall and cloudburst values are derived from the cell state with a scenario-specific contribution. Each hazard includes probability, confidence, data agreement and a human-readable value. A future calibrated model should replace these formulas with validated observations and trained models.

## Confidence behavior

Radar, satellite, lightning, AWS and NWP sources each expose status, latency, quality and confidence. When the deterministic NWP source becomes delayed, consensus and cell confidence are reduced. The interface explicitly shows the fallback message `Forecast confidence reduced.` and retains last valid evidence for continuity.

## Explainability

The prototype shows contributor percentages for radar intensity, lightning acceleration, satellite cloud growth, rainfall intensity, wind and instability. These percentages are an explainability visualization, not a claim that a production model uses those exact weights. Operational deployment requires calibration, verification against ground truth, bias monitoring and domain review.

## Limitations

The engine has no real radar ingestion, satellite retrieval, lightning network, NWP field, PostGIS exposure overlay, calibrated rainfall model or operational alert gateway. It must not be used to make real-world safety decisions.
