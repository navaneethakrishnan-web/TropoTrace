import React, { useEffect, useState } from 'react'
import {
  Radar,
  Maximize2,
  Users,
  Building2,
  Activity,
  ShieldCheck,
  CheckCircle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react'
import type { WorkflowStageId, WorkflowStageInfo } from '../domain/impactTwin'
import { WORKFLOW_STAGES } from '../domain/impactTwin'

interface ImpactWorkflowStepperProps {
  currentStageId: WorkflowStageId
  onStageChange: (stageId: WorkflowStageId) => void
}

const STAGE_ICONS: Record<WorkflowStageId, React.ReactNode> = {
  STAGE_1_DETECTION: <Radar className="w-4 h-4" />,
  STAGE_2_IMPACT_ZONE: <Maximize2 className="w-4 h-4" />,
  STAGE_3_POPULATION: <Users className="w-4 h-4" />,
  STAGE_4_INFRASTRUCTURE: <Building2 className="w-4 h-4" />,
  STAGE_5_ANALYSIS: <Activity className="w-4 h-4" />,
  STAGE_6_PRECAUTIONS: <ShieldCheck className="w-4 h-4" />,
  STAGE_7_DECISION: <CheckCircle className="w-4 h-4" />,
}

export const ImpactWorkflowStepper: React.FC<ImpactWorkflowStepperProps> = ({
  currentStageId,
  onStageChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  const activeIndex = WORKFLOW_STAGES.findIndex((s) => s.id === currentStageId)
  const currentStage = WORKFLOW_STAGES[activeIndex] || WORKFLOW_STAGES[0]

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      onStageChange(WORKFLOW_STAGES[(activeIndex + 1) % WORKFLOW_STAGES.length].id)
    }, 4500)

    return () => clearInterval(timer)
  }, [isPlaying, activeIndex, onStageChange])

  const handlePrev = () => {
    const prevIndex = (activeIndex - 1 + WORKFLOW_STAGES.length) % WORKFLOW_STAGES.length
    onStageChange(WORKFLOW_STAGES[prevIndex].id)
  }

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % WORKFLOW_STAGES.length
    onStageChange(WORKFLOW_STAGES[nextIndex].id)
  }

  return (
    <div className="bg-[#0f172a]/95 rounded-2xl border border-slate-700/80 p-4 shadow-xl text-slate-100 flex flex-col gap-3 font-sans">
      {/* Top Header Row with Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-md">
            Stage {currentStage.stepNumber} of 7
          </span>
          <span className="text-sm font-bold text-white tracking-wide">
            {currentStage.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
            }`}
            title={isPlaying ? 'Pause Auto-Walkthrough' : 'Auto-Play 7-Stage Workflow'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Tour</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto-Tour</span>
              </>
            )}
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Previous Stage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-400">
              {currentStage.stepNumber}/7
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Next Stage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7-Step Interactive Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isActive = stage.id === currentStageId
          const isPassed = idx < activeIndex

          return (
            <button
              key={stage.id}
              onClick={() => {
                setIsPlaying(false)
                onStageChange(stage.id)
              }}
              className={`p-2.5 rounded-xl text-left border transition-all duration-200 relative group flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : isPassed
                  ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50 text-slate-300'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {stage.stepNumber}
                </span>
                <span className={isActive ? 'text-cyan-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'}>
                  {STAGE_ICONS[stage.id]}
                </span>
              </div>

              <div className="text-[11px] font-semibold tracking-wide truncate w-full text-slate-200">
                {stage.shortLabel.replace(/^\d+\.\s*/, '')}
              </div>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-cyan-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Stage Context Narrative Callout */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="text-slate-200 leading-relaxed font-medium">
            {currentStage.description}
          </div>
          <div className="text-cyan-300/90 text-[11px] font-mono">
            {currentStage.summary}
          </div>
        </div>
      </div>
    </div>
  )
}
