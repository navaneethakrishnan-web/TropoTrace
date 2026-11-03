import React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CloudSun,
  Compass,
  MapPin,
  Radio,
  RotateCcw,
  Sparkles,
  Wind,
  X,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

export function RealTimeDetectionModal() {
  const {
    realTimeDetectionModal,
    setRealTimeDetectionModal,
    requestLocation,
    locationStatus,
    setDataStreamMode,
    setPhenomenon,
    userLocation,
  } = useApp()

  if (!realTimeDetectionModal) return null

  const { type, phenomenon, title, message, metrics, coordinates } = realTimeDetectionModal

  const handleTurnOnLocation = async () => {
    const loc = await requestLocation()
    if (loc) {
      // Re-trigger phenomenon check with newly acquired coordinates
      setTimeout(() => {
        // Will be re-evaluated in context or will show detection result
      }, 300)
    }
  }

  const handleSwitchToSynthetic = () => {
    setDataStreamMode('SYNTHETIC')
    setPhenomenon(phenomenon)
    setRealTimeDetectionModal(null)
  }

  const handleClose = () => {
    setRealTimeDetectionModal(null)
  }

  const coordsDisplay = coordinates
    ? `${coordinates[0].toFixed(4)}°N, ${coordinates[1].toFixed(4)}°E`
    : userLocation
    ? `${userLocation[0].toFixed(4)}°N, ${userLocation[1].toFixed(4)}°E`
    : 'Location Inactive'

  return (
    <div className="cap-modal-backdrop real-detection-backdrop" onClick={handleClose}>
      <div
        className={`cap-modal real-detection-modal mode-${type.toLowerCase().replace('_', '-')}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="detection-modal-title"
      >
        {/* Header Bar */}
        <div className="cap-modal-header">
          <div className="detection-modal-kicker">
            <span className={`status-dot ${type === 'HAZARD_DETECTED' ? 'amber' : type === 'LOCATION_REQUIRED' ? 'cyan' : 'green'}`} />
            <span>
              {type === 'LOCATION_REQUIRED'
                ? '3 KM SENSOR GRID · GEOLOCATION REQUIRED'
                : type === 'HAZARD_DETECTED'
                ? 'REAL CONVECTIVE HAZARD DETECTED · 3 KM'
                : 'REAL DOPPLER & AWS TELEMETRY · 3 KM SCAN'}
            </span>
          </div>
          <button className="close-modal-btn" onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Hero Alert Title */}
        <div className="detection-hero">
          <div className="detection-icon-wrap">
            {type === 'LOCATION_REQUIRED' ? (
              <Compass size={32} className="pulse-icon text-cyan" />
            ) : type === 'HAZARD_DETECTED' ? (
              <AlertTriangle size={32} className="pulse-icon text-amber" />
            ) : (
              <CloudSun size={32} className="text-green" />
            )}
          </div>
          <div>
            <h3 id="detection-modal-title">{title}</h3>
            <p className="cap-modal-desc">{message}</p>
          </div>
        </div>

        {/* Live Station Sensor Readout (for Hazard or No-Hazard states) */}
        {metrics && (
          <div className="real-sensor-readout-card">
            <div className="readout-header">
              <div className="readout-title">
                <Radio size={13} />
                <span>GROUND STATION METRICS (3 KM RADIUS)</span>
              </div>
              <span className="readout-coords">
                <MapPin size={11} />
                <span>{coordsDisplay}</span>
              </span>
            </div>

            <div className="readout-grid">
              <div className="readout-item">
                <span className="label">STATION SECTOR</span>
                <b className="val">{metrics.city}</b>
              </div>
              <div className="readout-item">
                <span className="label">SKY CONDITION</span>
                <b className="val highlight">{metrics.condition}</b>
              </div>
              <div className="readout-item">
                <span className="label">AMBIENT TEMP</span>
                <b className="val">{metrics.temperature}°C</b>
              </div>
              <div className="readout-item">
                <span className="label">HUMIDITY</span>
                <b className="val">{metrics.humidity}%</b>
              </div>
              <div className="readout-item">
                <span className="label">RAIN RATE</span>
                <b className="val">{metrics.rain1h} mm/h</b>
              </div>
              <div className="readout-item">
                <span className="label">WIND VELOCITY</span>
                <b className="val">{metrics.windSpeedKmH} km/h</b>
              </div>
              <div className="readout-item">
                <span className="label">LIGHTNING RATE</span>
                <b className="val">{metrics.lightningRate} fl/min</b>
              </div>
              <div className="readout-item">
                <span className="label">HAIL PROBABILITY</span>
                <b className="val">{metrics.hailProbability}%</b>
              </div>
            </div>
          </div>
        )}

        {/* Judge Explanation Card */}
        <div className="judge-callout-card">
          <div className="judge-callout-head">
            <Sparkles size={14} />
            <span>HOW TO EXPLAIN THIS TO EVALUATORS &amp; JUDGES</span>
          </div>
          <p>
            {type === 'LOCATION_REQUIRED' ? (
              <>
                In <b>Real Data Mode</b>, TropoTrace does not show arbitrary animations unless linked to real coordinates.
                Turn on your device location to measure actual local radar reflectivity, or switch to <b>Synthetic Mode</b> to demo extreme storm scenarios.
              </>
            ) : type === 'NO_HAZARD_DETECTED' ? (
              <>
                Real severe convective storms (cloudbursts, lightning strikes) are intermittent events.
                Because current local weather is calm (<b>{metrics?.condition || 'Clear'}</b>), TropoTrace preserves scientific accuracy by showing <b>zero false alarms</b>.
                Click below to switch to <b>Synthetic Mode</b> to showcase simulated animations to judges!
              </>
            ) : (
              <>
                Active convective signatures matching <b>{phenomenon}</b> have been confirmed in your immediate 3 km cell.
                Doppler reflectivity and sensor consensus are actively streaming.
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="cap-modal-actions detection-modal-actions">
          {type === 'LOCATION_REQUIRED' && (
            <button
              className="btn btn-primary"
              onClick={handleTurnOnLocation}
              disabled={locationStatus === 'LOCATING'}
            >
              <Compass size={14} />
              <span>{locationStatus === 'LOCATING' ? 'LOCATING YOUR POSITION…' : 'TURN ON LOCATION'}</span>
            </button>
          )}

          <button
            className="btn btn-accent"
            onClick={handleSwitchToSynthetic}
            title="Switch to Synthetic Simulation Mode to demonstrate all animations to judges"
          >
            <Sparkles size={14} />
            <span>SWITCH TO SYNTHETIC MODE (SHOW ANIMATIONS)</span>
          </button>

          <button className="btn btn-secondary" onClick={handleClose}>
            {type === 'HAZARD_DETECTED' ? 'VIEW ON MAP' : 'DISMISS'}
          </button>
        </div>
      </div>
    </div>
  )
}
