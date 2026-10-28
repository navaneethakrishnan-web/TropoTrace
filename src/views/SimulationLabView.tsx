import { useState } from 'react'
import {
  ArrowRight,
  Clock,
  FastForward,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Square,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatEta, SCENARIOS } from '../domain/simulation'
import type { ScenarioKey } from '../domain/types'

export function SimulationLabView() {
  const {
    snapshot,
    scenario,
    minute,
    setMinute,
    isStreaming,
    setIsStreaming,
    playbackSpeed,
    setPlaybackSpeed,
    runScenario,
    stepTimeline,
    resetTimeline,
    navigate,
  } = useApp()

  const [activeTab, setActiveTab] = useState<'GALLERY' | 'LOGS'>('GALLERY')

  const cell = snapshot.cells.find((c) => c.id === snapshot.selectedCellId) ?? snapshot.cells[0]

  return (
    <div className="view-stack simulation-lab-view">
      {/* View Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 07 · DETERMINISTIC CONVECTIVE SCENARIO SIMULATION</span>
          </div>
          <h2>Simulation Lab</h2>
          <p>
            Launch deterministic meteorological scenarios to study convective cell intensification,
            multivariate hazard emergence, and spatial impact corridors across the 0–6 hour horizon.
          </p>
        </div>

        {/* Playback Speed Multiplier */}
        <div className="playback-speed-controls" role="group" aria-label="Simulation speed">
          <span className="speed-label">SPEED:</span>
          {([1, 2, 4] as const).map((spd) => (
            <button
              key={spd}
              className={`speed-pill ${playbackSpeed === spd ? 'active' : ''}`}
              onClick={() => setPlaybackSpeed(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Unified Simulation Control Bar */}
      <div className="panel-surface simulation-master-deck">
        <div className="deck-left">
          <button
            className={`deck-play-btn ${isStreaming ? 'is-playing' : ''}`}
            onClick={() => setIsStreaming(!isStreaming)}
            aria-label={isStreaming ? 'Pause simulation playback' : 'Play simulation playback'}
          >
            {isStreaming ? <Pause size={17} /> : <Play size={17} />}
            <span>{isStreaming ? 'PAUSE RUN' : 'PLAY RUN'}</span>
          </button>

          <button
            className="deck-action-btn"
            onClick={() => stepTimeline(-15)}
            title="Step backward 15 minutes"
          >
            <RotateCcw size={14} />
            <span>-15m</span>
          </button>

          <button
            className="deck-action-btn"
            onClick={() => stepTimeline(15)}
            title="Step forward 15 minutes"
          >
            <FastForward size={14} />
            <span>+15m</span>
          </button>

          <button
            className="deck-action-btn"
            onClick={() => stepTimeline(60)}
            title="Step forward 1 hour"
          >
            <FastForward size={14} />
            <span>+1 HR</span>
          </button>

          <button
            className="deck-action-btn"
            onClick={resetTimeline}
            title="Reset scenario to T+0"
          >
            <Square size={13} fill="currentColor" />
            <span>RESET (T+0)</span>
          </button>
        </div>

        <div className="deck-center">
          <div className="sim-clock-display">
            <span className="sim-clock-label">SCENARIO TIME:</span>
            <b className="sim-clock-val">T+{Math.round(minute)} MIN</b>
            <small>({formatEta(minute)} elapsed / 6 HR HORIZON)</small>
          </div>
        </div>

        <div className="deck-right">
          <div className="active-scenario-tag">
            <span className="status-dot green" />
            <span>ACTIVE: </span>
            <b>{snapshot.scenarioLabel.toUpperCase()}</b>
          </div>
        </div>
      </div>

      {/* Scenario Gallery Cards Grid */}
      <div className="scenario-grid">
        {SCENARIOS.map((item, idx) => {
          const isSelected = scenario === item.key
          const isRunning = isSelected && isStreaming

          return (
            <div
              key={item.key}
              className={`panel-surface scenario-card ${isSelected ? 'active' : ''}`}
              onClick={() => runScenario(item.key)}
              role="button"
              tabIndex={0}
            >
              <div className="scenario-accent" style={{ background: item.accent }} />

              <div className="scenario-card-top">
                <span className="scenario-number">SCENARIO 0{idx + 1}</span>
                <span className={`scenario-status-tag ${isRunning ? 'running' : isSelected ? 'selected' : ''}`}>
                  {isRunning ? 'RUNNING ON CANVAS' : isSelected ? 'CURRENTLY SELECTED' : 'READY TO RUN'}
                </span>
              </div>

              <h3>{item.label}</h3>
              <p>{item.descriptor}</p>

              {/* Sparkline metric curve */}
              <div className="scenario-sparkline">
                <span
                  style={{
                    background: item.accent,
                    width: `${35 + idx * 11}%`,
                  }}
                />
              </div>

              <div className="scenario-footer">
                <span className="scenario-btn-text">
                  {isRunning ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isRunning ? 'RUNNING' : isSelected ? 'REPLAY EVENT' : 'LAUNCH SCENARIO'}</span>
                </span>
                <ArrowRight size={14} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Lower Row: Event Log Stream + Active Simulation Stage Summary */}
      <div className="simulation-lower">
        {/* Synthetic Event Log Stream */}
        <div className="panel-surface stream-log">
          <div className="panel-title">
            <div>
              <Radio size={15} />
              <h3>Synthetic Sensor Event Stream Log</h3>
            </div>
            <span className="meta-tag">NOWCAST EVENT FEED</span>
          </div>

          <div className="log-list">
            <div className="log-row">
              <span className="log-time">11:34:28</span>
              <span className="log-dot cyan" />
              <b>RADAR (DWR)</b>
              <span>
                Reflectivity core intensified to {cell.reflectivity} dBZ aloft in {cell.name}
              </span>
            </div>

            <div className="log-row">
              <span className="log-time">11:34:19</span>
              <span className="log-dot yellow" />
              <b>LIGHTNING</b>
              <span>
                Ground strike acceleration detected: {cell.lightningRate} fl/min (+43% surge)
              </span>
            </div>

            <div className="log-row">
              <span className="log-time">11:34:02</span>
              <span className="log-dot blue" />
              <b>INSAT-3D</b>
              <span>
                Rapid cloud-top cooling confirmed (-48°C TIR-1 brightness temperature)
              </span>
            </div>

            <div className="log-row">
              <span className="log-time">11:33:45</span>
              <span className="log-dot green" />
              <b>STATE FUSION</b>
              <span>
                Consensus agreement at {snapshot.consensus}% across 5 active telemetry channels
              </span>
            </div>

            <div className="log-row">
              <span className="log-time">11:33:10</span>
              <span className="log-dot amber" />
              <b>CORRIDOR</b>
              <span>
                Estimated arrival window for Coimbatore sector calibrated at {formatEta(cell.arrivalMinutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Active Simulation Stage Summary */}
        <div className="panel-surface simulation-run">
          <div className="run-visual">
            <div className={`run-ring ${isStreaming ? 'is-playing' : ''}`}>
              <span className="status-dot green" />
              <b>T+{Math.round(minute)}m</b>
              <small>TIME OFFSET</small>
            </div>
          </div>

          <div className="run-details">
            <div className="panel-kicker">
              <Sparkles size={14} />
              <span>ACTIVE SCENARIO SUMMARY</span>
            </div>
            <h3>{snapshot.scenarioLabel}</h3>
            <p>
              This scenario defines deterministic physical growth curves for reflectivity, lightning,
              and rainfall. Changes scrubbed here instantly drive the GIS maps, risk matrices, and
              warning briefs.
            </p>

            <div className="run-action-btns">
              <button
                className="primary-action"
                onClick={() => navigate('command')}
                title="View active scenario on Command Center map"
              >
                <span>INSPECT IN COMMAND CENTER</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
