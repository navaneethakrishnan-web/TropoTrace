import React, { useEffect, useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface ImpactTimelineBarProps {
  currentMinute: number // e.g. -30 to +45 or 0 to 60
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
    if (timeToArrival === 0) return 'T=0m • CONVECTIVE CORE OVERHEAD'
    if (timeToArrival > 0) return `T-${timeToArrival}m • PRIOR TO CONVECTIVE OVERHEAD`
    return `T+${Math.abs(timeToArrival)}m • POST-IMPACT RECESSION PHASE`
  }

  const milestones = [
    { minute: 5, label: 'T-30m Radar Lock' },
    { minute: 15, label: 'T-20m Action Deadline' },
    { minute: 35, label: 'T=0 Overhead Core' },
    { minute: 50, label: 'T+15m Dissipation' },
  ]

  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-slate-700/80 p-4 shadow-xl text-slate-100 flex flex-col gap-3 font-sans">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-2">
              <span>Interactive 4D Impact Timeline</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-amber-300 font-semibold">{formatTimeLabel()}</span>
            </div>
            <div className="text-xs text-slate-400">
              Scrub or play through the convective storm lifecycle and asset exposure window
            </div>
          </div>
        </div>

        {/* Playback Button Group */}
        <div className="flex items-center gap-2">
          {/* Speed selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded transition-colors font-mono ${
                  speed === s
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => onMinuteChange(minMinute)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Reset to Start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onMinuteChange(Math.max(minMinute, currentMinute - 5))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Step Back 5 Min"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Simulation</span>
              </>
            )}
          </button>

          <button
            onClick={() => onMinuteChange(Math.min(maxMinute, currentMinute + 5))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Step Forward 5 Min"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrubbable Timeline Track */}
      <div className="space-y-1.5 pt-1">
        <div className="relative">
          <input
            type="range"
            min={minMinute}
            max={maxMinute}
            value={currentMinute}
            onChange={(e) => onMinuteChange(Number(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />

          {/* Critical action threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none"
            style={{ left: `${(15 / maxMinute) * 100}%` }}
            title="Action Deadline: T+20 min"
          />
        </div>

        {/* Milestone Labels Row */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span>0m (Now)</span>
          <span className="text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 inline" /> T-20m Action Deadline
          </span>
          <span className="text-rose-400">T=0m Peak Inundation</span>
          <span>+{maxMinute}m</span>
        </div>
      </div>
    </div>
  )
}
