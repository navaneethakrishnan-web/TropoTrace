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

  const getStatusBadge = (status: DecisionStatus) => {
    switch (status) {
      case 'HUMAN_APPROVAL_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Human approval required
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" />
            Approved for Dispatch
          </span>
        )
      case 'IMPLEMENTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Implemented On-Site
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Activity className="w-3.5 h-3.5" />
            Recommended Protocol
          </span>
        )
    }
  }

  const getVulnerabilityBadge = (vuln: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      MODERATE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      LOW: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    }
    return (
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-bold border ${
          colors[vuln] || colors.MODERATE
        }`}
      >
        {vuln} Vulnerability
      </span>
    )
  }

  const arrivalDisplay =
    arrivalMin > 0
      ? `${Math.max(1, arrivalMin - 6)}–${arrivalMin + 8} minutes`
      : 'Immediate / Active Overhead'

  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans transition-all duration-300 hover:border-cyan-500/50">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-2">
              <span>Decision-Intelligence Asset Card</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-slate-300">ID: {asset.id}</span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {asset.name}
              {getVulnerabilityBadge(asset.vulnerability)}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onFocusAssetOnMap && (
            <button
              onClick={() => onFocusAssetOnMap(asset)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors flex items-center gap-1.5"
              title="Center on Leaflet Map"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Focus on Map
            </button>
          )}
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 transition-colors flex items-center gap-1.5"
            title="Inspect decision synthesis logic"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Decision Logic
          </button>
        </div>
      </div>

      {/* Decision Synthesis Formula Banner (Collapsible/Toggled) */}
      {showFormulaModal && (
        <div className="bg-cyan-950/40 border-b border-cyan-800/40 px-5 py-3 text-xs text-cyan-200">
          <div className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Adaptive Impact Twin Synthesis Formula:
          </div>
          <div className="font-mono bg-slate-900/90 p-2.5 rounded-lg border border-cyan-800/60 text-slate-300 text-[11px] leading-relaxed">
            <span className="text-cyan-400">Weather evidence</span> +{' '}
            <span className="text-amber-400">Hazard probability ({confidencePct}%)</span> +{' '}
            <span className="text-emerald-400">Local geography</span> +{' '}
            <span className="text-rose-400">Asset vulnerability ({asset.vulnerability})</span> +{' '}
            <span className="text-blue-400">Time to impact ({arrivalMin}m)</span> +{' '}
            <span className="text-purple-400">Organization role</span> +{' '}
            <span className="text-yellow-400">Current response status</span> ={' '}
            <span className="text-white font-bold underline decoration-cyan-400">Recommended action</span>
          </div>
        </div>
      )}

      {/* Structured Specification Grid - Matching reference image layout */}
      <div className="p-5 space-y-4 text-sm divide-y divide-slate-800">
        {/* Core Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Storm Event</div>
            <div className="font-mono font-bold text-white text-base mt-0.5">{stormEventId}</div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Hazard Type</div>
            <div className="font-semibold text-cyan-300 text-sm mt-0.5 truncate" title={profile.hazardLabel}>
              {profile.name}
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Arrival Window
            </div>
            <div className="font-mono font-bold text-amber-300 text-sm mt-0.5">{arrivalDisplay}</div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Model Confidence</div>
            <div className="font-mono font-bold text-emerald-400 text-base mt-0.5">{confidencePct}%</div>
          </div>
        </div>

        {/* Section: Affected Asset */}
        <div className="pt-3">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Affected Asset & Exposure Zone
          </div>
          <div className="font-semibold text-white text-base flex items-center gap-2">
            <span>{asset.name}</span>
            <span className="text-xs font-mono text-slate-400 font-normal">
              ({asset.lat.toFixed(4)}°N, {asset.lng.toFixed(4)}°E)
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
            <span>
              Population Exposed: <strong className="text-slate-200">{asset.populationExposed.toLocaleString()} citizens</strong>
            </span>
            <span>•</span>
            <span>
              Criticality Index: <strong className="text-cyan-300 font-mono">{asset.criticalityIndex}/10</strong>
            </span>
          </div>
        </div>

        {/* Section: Impact */}
        <div className="pt-3">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Predicted Physical Impact
          </div>
          <div className="font-semibold text-rose-300 text-sm mb-1">{asset.impactTitle}</div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            {asset.impactDescription}
          </p>
        </div>

        {/* Section: Recommended Action */}
        <div className="pt-3">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>Recommended Action Protocol</span>
            <span className="text-[11px] font-mono text-amber-400 lowercase">execute before T+20 min</span>
          </div>
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-slate-200 text-xs leading-relaxed font-medium">
            {asset.recommendedAction}
          </div>
        </div>

        {/* Section: Evidence */}
        <div className="pt-3">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
            Supporting Evidence & Sensor Correlation
          </div>
          <div className="flex flex-wrap gap-2">
            {asset.evidenceSources.map((ev, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700"
              >
                <Layers className="w-3 h-3 text-cyan-400" />
                {ev}
              </span>
            ))}
          </div>
        </div>

        {/* Section: Decision Status & Authorization Action */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Decision Status
            </div>
            <div>{getStatusBadge(currentStatus)}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg flex items-center gap-2 ${
                currentStatus === 'APPROVED' || currentStatus === 'IMPLEMENTED'
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/30'
              }`}
            >
              {currentStatus === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Mark as Implemented
                </>
              ) : currentStatus === 'IMPLEMENTED' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Action Active
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Authorize Action Protocol
                </>
              )}
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div className="pt-2 text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 animate-pulse">
            {feedbackMessage}
          </div>
        )}
      </div>

      {/* Footer Tagline matching screenshot */}
      <div className="bg-slate-900/90 px-5 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Continuous Adaptive Impact Twin telemetry</span>
        <span className="font-mono text-cyan-400">Ref: VX-1A7-TWIN</span>
      </div>
    </div>
  )
}
