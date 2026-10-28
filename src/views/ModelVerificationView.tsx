import { useState } from 'react'
import {
  BarChart3,
  CheckCircle,
  HelpCircle,
  Info,
  Layers,
  Scale,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  getContingencyTable,
  getRainfallTimeSeries,
  getVerificationMetrics,
} from '../domain/verification'

export function ModelVerificationView() {
  const { scenario } = useApp()
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('MAE')

  const timeSeries = getRainfallTimeSeries(scenario)
  const metrics = getVerificationMetrics(scenario)
  const contingency = getContingencyTable()

  const activeMetric = metrics.find((m) => m.key === selectedMetricKey) ?? metrics[0]

  const maxVal = Math.max(...timeSeries.map((t) => Math.max(t.predicted, t.observed)))

  return (
    <div className="view-stack model-verification-view">
      {/* View Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 08 · STATISTICAL EVALUATION &amp; PREDICTION SKILL SCORES</span>
          </div>
          <h2>Model Verification</h2>
          <p>
            Assess nowcast skill against synthetic reference observations using standard
            meteorological accuracy and contingency table verification metrics.
          </p>
        </div>

        <div className="synthetic-badge">
          <Info size={13} />
          <span>SYNTHETIC GROUND TRUTH EVALUATION</span>
        </div>
      </div>

      {/* Top Split: Time-Series Chart + Contingency Matrix Card */}
      <div className="verification-top">
        {/* Time Series Chart */}
        <div className="panel-surface verification-chart">
          <div className="panel-title">
            <div>
              <BarChart3 size={15} />
              <h3>Predicted vs Observed Rainfall Rate Time Series</h3>
            </div>
            <span className="meta-tag">60 MIN EVALUATION WINDOW</span>
          </div>

          <div className="chart-area-container">
            {/* Y-Axis Scale */}
            <div className="chart-y-axis">
              <span>{Math.round(maxVal)} mm/h</span>
              <span>{Math.round(maxVal * 0.75)}</span>
              <span>{Math.round(maxVal * 0.5)}</span>
              <span>{Math.round(maxVal * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Bars Column */}
            <div className="chart-columns-grid">
              {timeSeries.map((pt) => {
                const predHeight = (pt.predicted / maxVal) * 100
                const obsHeight = (pt.observed / maxVal) * 100

                return (
                  <div key={pt.label} className="chart-column-item">
                    <div className="column-bar-group">
                      <div
                        className="bar observed-bar"
                        style={{ height: `${obsHeight}%` }}
                        title={`Observed: ${pt.observed} mm/h`}
                      />
                      <div
                        className="bar predicted-bar"
                        style={{ height: `${predHeight}%` }}
                        title={`Predicted: ${pt.predicted} mm/h`}
                      />
                    </div>
                    <span className="col-time-label">{pt.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="chart-legend-row">
            <div className="legend-pills">
              <span className="legend-item">
                <i className="legend-square cyan" />
                <span>Predicted Nowcast (mm/h)</span>
              </span>
              <span className="legend-item">
                <i className="legend-square amber" />
                <span>Observed Gauge (mm/h)</span>
              </span>
            </div>

            <div className="arrival-error-note">
              <span>Mean Arrival Error: </span>
              <b>+05.2 min</b>
            </div>
          </div>
        </div>

        {/* Contingency Table (2x2 Matrix) */}
        <div className="panel-surface contingency-card">
          <div className="panel-title">
            <div>
              <Scale size={15} />
              <h3>2×2 Contingency Evaluation Matrix</h3>
            </div>
            <span className="meta-tag">CATEGORICAL SKILL</span>
          </div>

          <p className="contingency-intro">
            Categorical verification for convective storm occurrence threshold (Z &gt; 45 dBZ aloft):
          </p>

          <div className="contingency-table-wrapper">
            <table className="contingency-table">
              <thead>
                <tr>
                  <th className="empty-corner" />
                  <th>OBSERVED YES</th>
                  <th>OBSERVED NO</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="row-head">PREDICTED YES</th>
                  <td className="hit-cell">
                    <b>{contingency.hits}</b>
                    <span>HITS (True Positives)</span>
                  </td>
                  <td className="false-alarm-cell">
                    <b>{contingency.falseAlarms}</b>
                    <span>FALSE ALARMS</span>
                  </td>
                </tr>
                <tr>
                  <th className="row-head">PREDICTED NO</th>
                  <td className="miss-cell">
                    <b>{contingency.misses}</b>
                    <span>MISSES (False Negatives)</span>
                  </td>
                  <td className="correct-neg-cell">
                    <b>{contingency.correctNegatives}</b>
                    <span>CORRECT NEGATIVES</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="contingency-summary">
            <span>TOTAL SAMPLES: <b>600 GRID CELLS</b></span>
            <span>CRITICAL SUCCESS INDEX: <b>0.76</b></span>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="verification-metrics-section">
        <div className="section-heading">
          <Target size={15} />
          <h3>Formal Meteorological Skill Metrics</h3>
        </div>

        <div className="metrics-grid">
          {metrics.map((m) => {
            const isSelected = selectedMetricKey === m.key
            return (
              <div
                key={m.key}
                className={`panel-surface metric-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelectedMetricKey(m.key)}
                role="button"
                tabIndex={0}
              >
                <div className="metric-card-top">
                  <span className="metric-name">{m.label}</span>
                  <span className="metric-delta">{m.delta}</span>
                </div>
                <b className="metric-val">{m.value}</b>
                <div className="metric-benchmark">{m.benchmark}</div>
                <small className="metric-desc">{m.description}</small>
              </div>
            )
          })}
        </div>
      </div>

      {/* Deep Metric Detail Explainer */}
      <div className="panel-surface metric-deep-explainer">
        <div className="explainer-header">
          <HelpCircle size={15} />
          <h4>FORMULA &amp; OPERATIONAL INTERPRETATION: {activeMetric.label}</h4>
        </div>

        <div className="explainer-content">
          <div className="formula-box">
            <span>MATHEMATICAL FORMULA:</span>
            <code>{activeMetric.formula}</code>
          </div>

          <div className="interpretation-box">
            <span>OPERATIONAL SIGNIFICANCE:</span>
            <p>{activeMetric.description} In operational forecasting at NCMRWF/IMD, this metric directly governs the confidence weighting applied to early thunderstorm alerts.</p>
          </div>
        </div>
      </div>

      {/* Scientific Honesty Disclaimer Banner */}
      <div className="verification-disclaimer-banner">
        <ShieldCheck size={16} />
        <div>
          <b>SCIENTIFIC TRANSPARENCY NOTICE:</b>
          <p>
            These metrics are calculated for demonstration purposes using synthetic reference observations and
            deterministic scenario curves. Operational validation requires rigorous multi-season benchmarking
            against physical Automatic Weather Station (AWS) networks and calibrated Doppler radar reflectivity archives.
          </p>
        </div>
      </div>
    </div>
  )
}
