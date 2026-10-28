import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  Layers,
  Radio,
  RadioTower,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Waves,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  getDataPipelineStages,
  getRawObservations,
  PROPOSED_INTEGRATIONS,
} from '../domain/observatory'
import type { DataSource } from '../domain/types'

export function DataObservatoryView() {
  const { snapshot } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('ALL')

  const rawRecords = getRawObservations(snapshot)
  const pipelineStages = getDataPipelineStages()

  const filteredRecords = rawRecords.filter((rec) => {
    const matchesSource =
      selectedSourceFilter === 'ALL' || rec.source.toLowerCase().includes(selectedSourceFilter.toLowerCase())
    const matchesSearch =
      rec.variable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSource && matchesSearch
  })

  return (
    <div className="view-stack data-observatory-view">
      {/* View Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 06 · SCIENTIFIC DATA OBSERVABILITY &amp; SENSOR AGREEMENT</span>
          </div>
          <h2>Data Observatory</h2>
          <p>
            Monitor telemetry health, stream latency, multi-source agreement, and inspect the raw
            observational tensor driving the nowcast model.
          </p>
        </div>

        <div className="observatory-status-pill">
          <span className="status-dot green" />
          <span>
            {snapshot.sources.filter((s) => s.status === 'ONLINE').length} / {snapshot.sources.length} SOURCES ONLINE
          </span>
        </div>
      </div>

      {/* Section A: Data Source Inventory Cards */}
      <div className="observatory-grid">
        {snapshot.sources.map((source) => (
          <SourceInventoryCard key={source.shortName} source={source} />
        ))}
      </div>

      {/* Section B: Data-Flow Architecture Pipeline Visualization */}
      <div className="panel-surface pipeline-flow-panel">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">
              <Layers size={14} />
              <span>END-TO-END PIPELINE ARCHITECTURE</span>
            </div>
            <h3>Sensor Ingestion to Warning Dispatch Data Flow</h3>
          </div>
          <span className="demo-label">TRACEABLE CONVECTIVE PIPELINE</span>
        </div>

        <div className="pipeline-steps-container">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.step} className="pipeline-step-node">
              <div className="step-number">{stage.step}</div>
              <div className="step-content">
                <div className="step-header">
                  <h4>{stage.name}</h4>
                  <span className={`status-badge status-${stage.status.toLowerCase()}`}>
                    {stage.status}
                  </span>
                </div>
                <p className="step-desc">{stage.description}</p>
                <div className="step-io-tags">
                  <div className="io-group">
                    <small>INPUTS:</small>
                    <span>{stage.inputs.join(', ')}</span>
                  </div>
                  <div className="io-group">
                    <small>OUTPUTS:</small>
                    <span>{stage.outputs.join(', ')}</span>
                  </div>
                </div>
              </div>
              {idx < pipelineStages.length - 1 && (
                <div className="step-connector" aria-hidden="true">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section C: Raw Data Inspection Table */}
      <div className="panel-surface data-table-panel">
        <div className="panel-title">
          <div>
            <Database size={15} />
            <h3>Current Observation Tensor Inspection</h3>
          </div>
          <span className="meta-tag">TIMESTAMP: {snapshot.timestamp.slice(11, 19)} UTC</span>
        </div>

        {/* Filter & Search Bar */}
        <div className="table-filter-bar">
          <div className="search-input-wrap">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search variables, units, or record IDs…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filter raw observation variables"
            />
          </div>

          <div className="filter-source-chips">
            {['ALL', 'Radar', 'INSAT', 'Lightning', 'AWS', 'NWP'].map((cat) => (
              <button
                key={cat}
                className={`source-filter-btn ${selectedSourceFilter === cat ? 'active' : ''}`}
                onClick={() => setSelectedSourceFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive-wrapper">
          <table className="observation-table">
            <thead>
              <tr>
                <th>RECORD ID</th>
                <th>TELEMETRY SOURCE</th>
                <th>ATMOSPHERIC VARIABLE</th>
                <th>SYNTHETIC VALUE</th>
                <th>COORDINATES</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td className="code-font">{rec.id}</td>
                  <td>{rec.source}</td>
                  <td className="bold-variable">{rec.variable}</td>
                  <td className="value-cell">
                    <b>{rec.value}</b> <span>{rec.unit}</span>
                  </td>
                  <td className="code-font">{rec.coordinates}</td>
                  <td>
                    <span className="simulated-chip">{rec.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section D: Consensus Health & Degradation Fallback Protocol */}
      <div className="observatory-lower-grid">
        <div className="panel-surface consensus-card">
          <div className="panel-title">
            <div>
              <Waves size={15} />
              <h3>Multi-Source Agreement &amp; Weighting</h3>
            </div>
            <span className="meta-tag">CONVERGENCE</span>
          </div>

          <div className="consensus-card-body">
            <div className="consensus-ring-box">
              <div className="consensus-large-ring">
                <strong>{snapshot.consensus}%</strong>
                <span>CONSENSUS</span>
              </div>
            </div>

            <div className="consensus-stream-bars">
              {snapshot.sources.map((src) => (
                <div key={src.shortName} className="stream-bar-row">
                  <span className="stream-name">{src.shortName}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${src.confidence}%`,
                        background: src.status === 'DELAYED' ? '#FFC857' : '#38E4C0',
                      }}
                    />
                  </div>
                  <b className="stream-conf">{src.confidence}%</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-surface fallback-protocol-card">
          <div className="panel-title">
            <div>
              <RefreshCw size={15} />
              <h3>Graceful Sensor Degradation Protocol</h3>
            </div>
            <span className="meta-tag">AUTO-FAILOVER</span>
          </div>

          <div className="fallback-card-body">
            <div className="fallback-banner">
              <WifiOff size={20} className="warning-icon" />
              <div>
                <b>Zero-Interruption Fallback Active</b>
                <p>
                  If an individual telemetry stream (e.g. NWP or Doppler Radar) drops or incurs
                  latency, the nowcast engine retains the last valid frame, reweights remaining sensor
                  evidence, and alerts the operator.
                </p>
              </div>
            </div>

            <div className="fallback-steps-row">
              <div className="step-pill">1. Detect Sensor Gap</div>
              <ArrowRight size={13} />
              <div className="step-pill">2. Retain Last Keyframe</div>
              <ArrowRight size={13} />
              <div className="step-pill">3. Reweight Evidence Matrix</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section E: Planned Real-World Operational Integrations */}
      <div className="panel-surface future-integrations-panel">
        <div className="panel-title">
          <div>
            <Server size={15} />
            <h3>Proposed Operational Telemetry Feeds (Future Capability)</h3>
          </div>
          <span className="meta-tag">TARGET ARCHITECTURE</span>
        </div>

        <div className="future-integrations-grid">
          {PROPOSED_INTEGRATIONS.map((item) => (
            <div className="integration-target-card" key={item.name}>
              <div className="target-card-top">
                <span className="target-agency">{item.agency}</span>
                <span className="status-badge status-proposed">PROPOSED</span>
              </div>
              <h4>{item.name}</h4>
              <p className="target-protocol">
                <span>PROTOCOL: </span>
                <b>{item.protocol}</b>
              </p>
              <p className="target-notes">{item.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SourceInventoryCard({ source }: { source: DataSource }) {
  const isOnline = source.status === 'ONLINE'
  const isDelayed = source.status === 'DELAYED'

  return (
    <div className={`panel-surface source-card ${source.status.toLowerCase()}`}>
      <div className="source-card-top">
        <div className="source-card-icon">
          <RadioTower size={17} />
        </div>
        <span className={`source-status-pill ${source.status.toLowerCase()}`}>
          <span className="status-dot" />
          <span>{source.status}</span>
        </span>
      </div>

      <div className="source-card-name">{source.name}</div>
      <div className="source-card-code">{source.shortName} · SYNTHETIC STREAM</div>

      <div className="source-card-stats">
        <div>
          <span>LATENCY</span>
          <b>{source.latency}</b>
        </div>
        <div>
          <span>QUALITY</span>
          <b>{source.quality}</b>
        </div>
        <div>
          <span>CONFIDENCE</span>
          <b>{source.confidence}%</b>
        </div>
      </div>

      {source.note && (
        <div className="source-card-note">
          <AlertTriangle size={12} />
          <span>{source.note}</span>
        </div>
      )}
    </div>
  )
}
