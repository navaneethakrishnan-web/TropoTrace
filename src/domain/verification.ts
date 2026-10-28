import type { ScenarioKey, VerificationMetric } from './types'

export interface RainfallComparisonPoint {
  timeOffsetMin: number
  label: string
  predicted: number
  observed: number
  uncertaintyUpper: number
  uncertaintyLower: number
}

export function getRainfallTimeSeries(scenario: ScenarioKey): RainfallComparisonPoint[] {
  const baseOffsets = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
  
  // Deterministic series tuned for each scenario
  const profiles: Record<ScenarioKey, { pred: number[]; obs: number[] }> = {
    'rapid-thunderstorm': {
      pred: [18, 28, 44, 62, 78, 85, 72, 58, 45, 35, 26, 18, 12],
      obs:  [16, 24, 38, 55, 74, 89, 76, 52, 41, 32, 28, 15, 11],
    },
    'hailstorm': {
      pred: [12, 22, 39, 58, 71, 74, 62, 48, 32, 20, 14, 10, 8],
      obs:  [10, 19, 34, 52, 69, 78, 65, 44, 30, 18, 12, 8, 7],
    },
    'cloudburst': {
      pred: [25, 42, 68, 95, 124, 138, 115, 88, 62, 45, 32, 22, 16],
      obs:  [22, 38, 62, 89, 132, 145, 122, 82, 58, 41, 28, 19, 14],
    },
    'downburst': {
      pred: [15, 26, 42, 59, 68, 54, 38, 26, 18, 14, 10, 8, 5],
      obs:  [14, 22, 38, 56, 72, 51, 35, 24, 16, 12, 9, 7, 5],
    },
    'initiation': {
      pred: [4, 9, 18, 31, 48, 65, 72, 68, 55, 42, 31, 22, 15],
      obs:  [2, 6, 14, 28, 44, 61, 75, 71, 58, 39, 28, 20, 14],
    },
    'multi-cell': {
      pred: [22, 35, 52, 64, 76, 82, 79, 68, 58, 48, 38, 28, 20],
      obs:  [20, 31, 48, 61, 81, 86, 75, 64, 54, 44, 35, 25, 18],
    },
  }

  const { pred, obs } = profiles[scenario] ?? profiles['rapid-thunderstorm']

  return baseOffsets.map((offset, index) => {
    const p = pred[index]
    const o = obs[index]
    return {
      timeOffsetMin: offset,
      label: `+${offset}m`,
      predicted: p,
      observed: o,
      uncertaintyUpper: Math.round(p * 1.15 + 3),
      uncertaintyLower: Math.max(0, Math.round(p * 0.85 - 2)),
    }
  })
}

export function getVerificationMetrics(scenario: ScenarioKey): VerificationMetric[] {
  const isCloudburst = scenario === 'cloudburst'
  const isHail = scenario === 'hailstorm'

  return [
    {
      key: 'MAE',
      label: 'Mean Absolute Error (MAE)',
      value: isCloudburst ? '7.8 mm/h' : '5.4 mm/h',
      delta: '↓ 14% error reduction',
      description: 'Average magnitude of errors between predicted nowcast and synthetic radar gauge accumulation.',
      formula: 'MAE = (1/N) * Σ |Predicted - Observed|',
      benchmark: 'Operational Target: < 8.0 mm/h',
      isFavorable: true,
    },
    {
      key: 'RMSE',
      label: 'Root Mean Square Error (RMSE)',
      value: isCloudburst ? '11.6 mm/h' : '8.9 mm/h',
      delta: '↓ 9% variance reduction',
      description: 'Square root of the average squared errors; penalizes large convective peak deviations.',
      formula: 'RMSE = √[(1/N) * Σ (Predicted - Observed)²]',
      benchmark: 'Operational Target: < 12.0 mm/h',
      isFavorable: true,
    },
    {
      key: 'POD',
      label: 'Probability of Detection (Hit Rate)',
      value: isHail ? '0.84' : '0.88',
      delta: '↑ 0.05 gain',
      description: 'Ratio of correctly predicted convective hazard events to total observed occurrences.',
      formula: 'POD = Hits / (Hits + Misses)',
      benchmark: 'Target: > 0.80',
      isFavorable: true,
    },
    {
      key: 'FAR',
      label: 'False Alarm Ratio (FAR)',
      value: isHail ? '0.19' : '0.15',
      delta: '↓ 0.04 reduction',
      description: 'Fraction of predicted warnings where severe convection did not verify.',
      formula: 'FAR = False Alarms / (Hits + False Alarms)',
      benchmark: 'Target: < 0.25',
      isFavorable: true,
    },
    {
      key: 'CSI',
      label: 'Critical Success Index (Threat Score)',
      value: '0.76',
      delta: '↑ 0.08 skill improvement',
      description: 'Measures how well forecast hazard grid-cells correspond to verified synthetic observations.',
      formula: 'CSI = Hits / (Hits + Misses + False Alarms)',
      benchmark: 'Target: > 0.65',
      isFavorable: true,
    },
    {
      key: 'PRECISION',
      label: 'Precision (Confidence Reliability)',
      value: '0.85',
      delta: '↑ 0.04 gain',
      description: 'Percentage of warned cells that experienced documented precipitation / lightning.',
      formula: 'Precision = True Positives / Total Positives',
      benchmark: 'Target: > 0.80',
      isFavorable: true,
    },
    {
      key: 'RECALL',
      label: 'Recall (Sensitivity)',
      value: '0.88',
      delta: '↑ 0.06 gain',
      description: 'Ability of the model to capture developing cells without missing initiation.',
      formula: 'Recall = True Positives / (True Positives + False Negatives)',
      benchmark: 'Target: > 0.82',
      isFavorable: true,
    },
    {
      key: 'F1',
      label: 'F1 Score (Harmonic Mean)',
      value: '0.86',
      delta: '↑ 0.05 composite',
      description: 'Balanced harmonic mean between model precision and recall performance.',
      formula: 'F1 = 2 * (Precision * Recall) / (Precision + Recall)',
      benchmark: 'Target: > 0.80',
      isFavorable: true,
    },
  ]
}

export interface ContingencyCounts {
  hits: number
  misses: number
  falseAlarms: number
  correctNegatives: number
}

export function getContingencyTable(): ContingencyCounts {
  return {
    hits: 142,
    misses: 19,
    falseAlarms: 25,
    correctNegatives: 414,
  }
}
