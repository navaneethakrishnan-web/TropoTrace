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
import type { WorkflowStageId } from '../domain/impactTwin'
import { WORKFLOW_STAGES } from '../domain/impactTwin'

interface ImpactWorkflowStepperProps {
  currentStageId: WorkflowStageId
  onStageChange: (stageId: WorkflowStageId) => void
}

const STAGE_ICONS: Record<WorkflowStageId, React.ReactNode> = {
  STAGE_1_DETECTION: <Radar size={15} />,
  STAGE_2_IMPACT_ZONE: <Maximize2 size={15} />,
  STAGE_3_POPULATION: <Users size={15} />,
  STAGE_4_INFRASTRUCTURE: <Building2 size={15} />,
  STAGE_5_ANALYSIS: <Activity size={15} />,
  STAGE_6_PRECAUTIONS: <ShieldCheck size={15} />,
  STAGE_7_DECISION: <CheckCircle size={15} />,
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
    <div className="panel-surface twin-workflow-stepper">
      {/* Top Header Row with Navigation Controls */}
      <div className="twin-workflow-header">
        <div className="twin-workflow-title-wrap">
          <span className="twin-workflow-stage-badge">
            STAGE {currentStage.stepNumber} OF 7
          </span>
          <h4 className="twin-workflow-stage-title">
            {currentStage.title}
          </h4>
        </div>

        <div className="twin-workflow-controls">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`twin-tour-btn ${isPlaying ? 'active' : ''}`}
            title={isPlaying ? 'Pause Auto-Walkthrough' : 'Auto-Play 7-Stage Workflow'}
          >
            {isPlaying ? (
              <>
                <Pause size={14} />
                <span>PAUSE TOUR</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>AUTO-TOUR</span>
              </>
            )}
          </button>

          <div className="twin-step-nav-group">
            <button
              onClick={handlePrev}
              className="twin-step-nav-btn"
              title="Previous Stage"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="twin-step-nav-counter">
              {currentStage.stepNumber} / 7
            </span>
            <button
              onClick={handleNext}
              className="twin-step-nav-btn"
              title="Next Stage"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 7-Step Interactive Progress Bar */}
      <div className="twin-workflow-grid">
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
              className={`twin-workflow-step ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
            >
              <div className="twin-step-top">
                <span className="twin-step-number">{stage.stepNumber}</span>
                <span className="twin-step-icon">{STAGE_ICONS[stage.id]}</span>
              </div>

              <div className="twin-step-label">
                {stage.shortLabel.replace(/^\d+\.\s*/, '')}
              </div>

              {isActive && <div className="twin-step-indicator-bar" />}
            </button>
          )
        })}
      </div>

      {/* Stage Context Narrative Callout */}
      <div className="twin-workflow-narrative">
        <div className="twin-narrative-icon">
          <Info size={16} />
        </div>
        <div className="twin-narrative-body">
          <div className="twin-narrative-desc">
            {currentStage.description}
          </div>
          <div className="twin-narrative-summary">
            {currentStage.summary}
          </div>
        </div>
      </div>
    </div>
  )
}
