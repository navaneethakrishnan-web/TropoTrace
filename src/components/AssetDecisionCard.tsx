import React, { useState } from 'react'
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Layers,
  Activity,
  Check,
} from 'lucide-react'
import type { TwinAsset, DecisionStatus, ImpactTwinHazard } from '../domain/impactTwin'
import { HAZARD_PROFILES } from '../domain/impactTwin'

interface AssetDecisionCardProps {
  asset: TwinAsset
  selectedHazard: ImpactTwinHazard
  stormEventId?: string
  confidencePct: number
  arrivalMin: number
  onStatusChange?: (newStatus: DecisionStatus) => void
  onFocusAssetOnMap?: (asset: TwinAsset) => void
}

export const AssetDecisionCard: React.FC<AssetDecisionCardProps> = ({
  asset,
  selectedHazard,
  stormEventId = 'VX-1A7',
  confidencePct,
  arrivalMin,
  onStatusChange,
  onFocusAssetOnMap,
}) => {
  const [currentStatus, setCurrentStatus] = useState<DecisionStatus>(asset.decisionStatus)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [showFormulaModal, setShowFormulaModal] = useState(false)

  const profile = HAZARD_PROFILES[selectedHazard]

  const handleApprove = () => {
    const nextStatus: DecisionStatus =
      currentStatus === 'HUMAN_APPROVAL_REQUIRED' || currentStatus === 'RECOMMENDED'
        ? 'APPROVED'
        : currentStatus === 'APPROVED'
        ? 'IMPLEMENTED'
        : 'APPROVED'

    setCurrentStatus(nextStatus)
    onStatusChange?.(nextStatus)
    setFeedbackMessage(
      nextStatus === 'APPROVED'
        ? 'Decision protocol authorized by Duty Officer. Automated dispatch ready.'
        : 'Action marked as implemented on-site.'
    )
    setTimeout(() => setFeedbackMessage(null), 4000)
  }

  const arrivalDisplay =
    arrivalMin > 0
      ? `${Math.max(1, arrivalMin - 6)}–${arrivalMin + 8} minutes`
      : 'Immediate / Active Overhead'

  return (
    <div className="panel-surface twin-decision-card">
      {/* Top Banner / Header */}
      <div className="twin-decision-header">
        <div className="twin-decision-brand">
          <div className="twin-decision-icon-badge">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="twin-decision-kicker">
              <span>DECISION-INTELLIGENCE ASSET CARD</span>
              <span className="kicker-sep">·</span>
              <span className="kicker-id">ID: {asset.id}</span>
            </div>
            <div className="twin-decision-title-row">
              <h3 className="twin-decision-asset-title">{asset.name}</h3>
              <span className={`twin-vuln-badge vuln-${asset.vulnerability.toLowerCase()}`}>
                {asset.vulnerability} VULNERABILITY
              </span>
            </div>
          </div>
        </div>

        <div className="twin-decision-header-actions">
          {onFocusAssetOnMap && (
            <button
              onClick={() => onFocusAssetOnMap(asset)}
              className="twin-action-secondary-btn"
              title="Center on Leaflet Map"
            >
              <MapPin size={13} />
              <span>FOCUS ON MAP</span>
            </button>
          )}
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className={`twin-action-logic-btn ${showFormulaModal ? 'active' : ''}`}
            title="Inspect decision synthesis logic"
          >
            <Sparkles size={13} />
            <span>DECISION LOGIC</span>
          </button>
        </div>
      </div>

      {/* Decision Synthesis Formula Banner (Collapsible) */}
      {showFormulaModal && (
        <div className="twin-formula-drawer">
          <div className="formula-header">
            <Activity size={14} />
            <span>ADAPTIVE IMPACT TWIN SYNTHESIS LOGIC:</span>
          </div>
          <div className="formula-code">
            <span className="token-cyan">Weather evidence</span> +{' '}
            <span className="token-amber">Hazard probability ({confidencePct}%)</span> +{' '}
            <span className="token-teal">Local geography</span> +{' '}
            <span className="token-red">Asset vulnerability ({asset.vulnerability})</span> +{' '}
            <span className="token-blue">Time to impact ({arrivalMin}m)</span> +{' '}
            <span className="token-violet">Organization role</span> +{' '}
            <span className="token-yellow">Current response status</span> ={' '}
            <b className="token-result">Recommended action</b>
          </div>
        </div>
      )}

      {/* Structured Specification Grid - Matching reference image layout */}
      <div className="twin-decision-body">
        {/* Core Metadata Grid */}
        <div className="twin-decision-meta-grid">
          <div className="twin-meta-cell">
            <span className="meta-label">Storm Event</span>
            <b className="meta-val highlight-storm">{stormEventId}</b>
          </div>

          <div className="twin-meta-cell">
            <span className="meta-label">Hazard Type</span>
            <b className="meta-val highlight-hazard" title={profile.hazardLabel}>
              {profile.name}
            </b>
          </div>

          <div className="twin-meta-cell">
            <span className="meta-label">
              <Clock size={11} className="inline-icon" /> Arrival Window
            </span>
            <b className="meta-val highlight-arrival">{arrivalDisplay}</b>
          </div>

          <div className="twin-meta-cell">
            <span className="meta-label">Model Confidence</span>
            <b className="meta-val highlight-confidence">{confidencePct}%</b>
          </div>
        </div>

        {/* Section: Affected Asset */}
        <div className="twin-section-block">
          <span className="twin-section-label">AFFECTED ASSET &amp; EXPOSURE ZONE</span>
          <div className="twin-asset-coords-row">
            <b className="asset-full-name">{asset.name}</b>
            <span className="asset-coords">
              ({asset.lat.toFixed(4)}°N, {asset.lng.toFixed(4)}°E)
            </span>
          </div>
          <div className="twin-asset-stats">
            <span>
              Population Exposed: <b>{asset.populationExposed.toLocaleString()} citizens</b>
            </span>
            <span className="stat-sep">·</span>
            <span>
              Criticality Index: <b>{asset.criticalityIndex}/10</b>
            </span>
          </div>
        </div>

        {/* Section: Impact */}
        <div className="twin-section-block">
          <span className="twin-section-label">PREDICTED PHYSICAL IMPACT</span>
          <div className="twin-impact-card">
            <b className="impact-headline">{asset.impactTitle}</b>
            <p className="impact-detail">{asset.impactDescription}</p>
          </div>
        </div>

        {/* Section: Recommended Action */}
        <div className="twin-section-block">
          <div className="twin-action-header-row">
            <span className="twin-section-label">RECOMMENDED ACTION PROTOCOL</span>
            <span className="action-deadline-tag">EXECUTE BEFORE T+20 MIN</span>
          </div>
          <div className="twin-action-card">
            {asset.recommendedAction}
          </div>
        </div>

        {/* Section: Evidence */}
        <div className="twin-section-block">
          <span className="twin-section-label">SUPPORTING EVIDENCE &amp; SENSOR CORRELATION</span>
          <div className="twin-evidence-tags">
            {asset.evidenceSources.map((ev, i) => (
              <span key={i} className="twin-evidence-pill">
                <Layers size={11} />
                <span>{ev}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Section: Decision Status & Authorization Action */}
        <div className="twin-decision-action-row">
          <div>
            <span className="twin-section-label">DECISION STATUS</span>
            <div className="twin-status-display">
              {currentStatus === 'HUMAN_APPROVAL_REQUIRED' && (
                <span className="status-badge status-pending">
                  <AlertTriangle size={13} />
                  <span>Human approval required</span>
                </span>
              )}
              {currentStatus === 'APPROVED' && (
                <span className="status-badge status-approved">
                  <Check size={13} />
                  <span>Approved for Dispatch</span>
                </span>
              )}
              {currentStatus === 'IMPLEMENTED' && (
                <span className="status-badge status-implemented">
                  <CheckCircle2 size={13} />
                  <span>Implemented On-Site</span>
                </span>
              )}
              {currentStatus === 'RECOMMENDED' && (
                <span className="status-badge status-recommended">
                  <Activity size={13} />
                  <span>Recommended Protocol</span>
                </span>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={handleApprove}
              className={`twin-authorize-btn ${
                currentStatus === 'APPROVED' || currentStatus === 'IMPLEMENTED' ? 'authorized' : ''
              }`}
            >
              {currentStatus === 'APPROVED' ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>MARK AS IMPLEMENTED</span>
                </>
              ) : currentStatus === 'IMPLEMENTED' ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>PROTOCOL ACTIVE ON-SITE</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>AUTHORIZE ACTION PROTOCOL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div className="twin-feedback-alert">
            <Check size={14} />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Footer Tagline matching screenshot */}
      <div className="twin-decision-footer">
        <span>Continuous Adaptive Impact Twin telemetry</span>
        <span className="twin-ref-tag">Ref: VX-1A7-TWIN</span>
      </div>
    </div>
  )
}
