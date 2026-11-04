import React from 'react'
import { SplitSquareVertical, Eye, AlertOctagon, Sliders } from 'lucide-react'
import type { ImpactTwinHazard } from '../domain/impactTwin'
import { HAZARD_PROFILES } from '../domain/impactTwin'

interface BeforeAfterSliderControlProps {
  mode: 'BEFORE' | 'AFTER' | 'SLIDER'
  sliderValue: number // 0 to 100
  selectedHazard: ImpactTwinHazard
  onModeChange: (mode: 'BEFORE' | 'AFTER' | 'SLIDER') => void
  onSliderChange: (val: number) => void
}

export const BeforeAfterSliderControl: React.FC<BeforeAfterSliderControlProps> = ({
  mode,
  sliderValue,
  selectedHazard,
  onModeChange,
  onSliderChange,
}) => {
  const profile = HAZARD_PROFILES[selectedHazard]

  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-slate-700/80 p-4 shadow-xl text-slate-100 flex flex-col gap-3 font-sans">
      {/* Header and Mode Selector Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <SplitSquareVertical className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-cyan-400">
              Interactive Impact Twin Comparison
            </div>
            <div className="text-xs text-slate-400">
              Compare baseline normal geography against projected hazard impact
            </div>
          </div>
        </div>

        {/* 3-State Toggle Pill Buttons */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 gap-1">
          <button
            onClick={() => {
              onModeChange('BEFORE')
              onSliderChange(0)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'BEFORE'
                ? 'bg-slate-700 text-cyan-300 shadow-sm border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Before (Baseline)
          </button>

          <button
            onClick={() => onModeChange('SLIDER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'SLIDER'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Comparison Slider ({sliderValue}%)
          </button>

          <button
            onClick={() => {
              onModeChange('AFTER')
              onSliderChange(100)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'AFTER'
                ? 'bg-rose-600/90 text-white shadow-sm border border-rose-400/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            After (Hazard Impact)
          </button>
        </div>
      </div>

      {/* Interactive Range Slider (Visible when in SLIDER mode or always accessible for fine scrub) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
            Baseline Normal (0%)
          </span>
          <span className="font-mono text-cyan-300 font-bold">
            Impact Penetration: {sliderValue}%
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Peak Hazard Impact (100%)
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => {
            const val = Number(e.target.value)
            onSliderChange(val)
            if (val === 0) onModeChange('BEFORE')
            else if (val === 100) onModeChange('AFTER')
            else if (mode !== 'SLIDER') onModeChange('SLIDER')
          }}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      {/* Before / After Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
        <div
          className={`p-3 rounded-xl border transition-all ${
            sliderValue < 50
              ? 'bg-slate-900/90 border-cyan-500/40 text-slate-200'
              : 'bg-slate-900/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400 mb-1">
            Normal Condition: {profile.beforeLabel}
          </div>
          <p className="text-[11px] leading-relaxed">{profile.beforeDescription}</p>
        </div>

        <div
          className={`p-3 rounded-xl border transition-all ${
            sliderValue >= 50
              ? 'bg-rose-950/20 border-rose-500/40 text-slate-200'
              : 'bg-slate-900/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold text-rose-400 mb-1">
            Hazard Footprint: {profile.afterLabel}
          </div>
          <p className="text-[11px] leading-relaxed">{profile.afterDescription}</p>
        </div>
      </div>
    </div>
  )
}
