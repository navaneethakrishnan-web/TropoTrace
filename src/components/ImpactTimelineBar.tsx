import React, { useEffect, useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface ImpactTimelineBarProps {
  currentMinute: number // e.g. 0 to 60
  minMinute?: number
  maxMinute?: number
  arrivalMinute: number
  onMinuteChange: (minute: number) => void
}

export const ImpactTimelineBar: React.FC<ImpactTimelineBarProps> = ({
  currentMinute,
  minMinute = 0,
  maxMinute = 60,
  arrivalMinute,
  onMinuteChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1) // 1x, 2x, 5x

  useEffect(() => {
    if (!isPlaying) return

    const intervalMs = Math.round(1000 / speed)
    const timer = setInterval(() => {
      onMinuteChange(currentMinute >= maxMinute ? minMinute : currentMinute + 1)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isPlaying, speed, currentMinute, minMinute, maxMinute, onMinuteChange])

  const timeToArrival = arrivalMinute - currentMinute
  const formatTimeLabel = () => {
    if (timeToArrival === 0) return 'T=0m · CONVECTIVE CORE OVERHEAD'
    if (timeToArrival > 0) return `T-${timeToArrival}m · PRIOR TO CONVECTIVE OVERHEAD`
    return `T+${Math.abs(timeToArrival)}m · POST-IMPACT RECESSION PHASE`
  }

  return (
    <div className="panel-surface twin-timeline-card">
      {/* Top Controls Row */}
      <div className="twin-timeline-header">
        <div className="twin-timeline-title-wrap">
          <div className="twin-timeline-icon">
            <Clock size={16} />
          </div>
          <div>
            <div className="twin-timeline-kicker">
              <span>4D IMPACT TIMELINE SCRUBBER</span>
              <span className="kicker-sep">·</span>
              <b className="kicker-highlight">{formatTimeLabel()}</b>
            </div>
            <div className="twin-timeline-title">
              Temporal Storm Lifecycle &amp; Asset Exposure Swath
            </div>
          </div>
        </div>

        {/* Playback Button Group */}
        <div className="twin-timeline-controls">
          {/* Speed selector */}
          <div className="segmented-control speed-segmented">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={speed === s ? 'active' : ''}
              >
                {s}X
              </button>
            ))}
          </div>

          <button
            onClick={() => onMinuteChange(minMinute)}
            className="twin-timeline-icon-btn"
            title="Reset to 0m"
          >
            <RotateCcw size={13} />
          </button>

          <button
            onClick={() => onMinuteChange(Math.max(minMinute, currentMinute - 5))}
            className="twin-timeline-icon-btn"
            title="Step Back 5 Min"
          >
            <ChevronLeft size={14} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`twin-timeline-play-btn ${isPlaying ? 'playing' : ''}`}
          >
            {isPlaying ? (
              <>
                <Pause size={13} />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={() => onMinuteChange(Math.min(maxMinute, currentMinute + 5))}
            className="twin-timeline-icon-btn"
            title="Step Forward 5 Min"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Scrubbable Timeline Track */}
      <div className="twin-timeline-track-wrapper">
        <div className="twin-timeline-track-inner">
          <input
            type="range"
            min={minMinute}
            max={maxMinute}
            value={currentMinute}
            onChange={(e) => onMinuteChange(Number(e.target.value))}
            className="twin-timeline-slider"
            style={{
              background: `linear-gradient(to right, #38e4c0 0%, #ffc857 ${(20 / maxMinute) * 100}%, #ff4438 ${(arrivalMinute / maxMinute) * 100}%, #1a332b ${(arrivalMinute / maxMinute) * 100}%, #1a332b 100%)`,
            }}
          />

          {/* Action deadline marker indicator */}
          <div
            className="twin-deadline-pin"
            style={{ left: `${(15 / maxMinute) * 100}%` }}
            title="Action Deadline: T+20 min"
          />
        </div>

        {/* Milestone Labels Row */}
        <div className="twin-timeline-milestones">
          <span>0m (Now)</span>
          <span className="milestone-deadline">
            <AlertTriangle size={11} />
            <span>T-20m Action Deadline</span>
          </span>
          <span className="milestone-peak">T=0m Peak Inundation</span>
          <span>+{maxMinute}m</span>
        </div>
      </div>
    </div>
  )
}
