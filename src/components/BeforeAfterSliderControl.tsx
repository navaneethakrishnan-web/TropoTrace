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
    <div className="panel-surface twin-comparison-card">
      {/* Header and Mode Selector Buttons */}
      <div className="twin-comp-header">
        <div className="twin-comp-title-wrap">
          <div className="twin-comp-icon">
            <SplitSquareVertical size={16} />
          </div>
          <div>
            <div className="twin-comp-kicker">
              IMPACT TWIN COMPARISON
            </div>
            <div className="twin-comp-title">
              Baseline Normal vs Projected Convective Hazard
            </div>
          </div>
        </div>

        {/* 3-State Toggle Pill Buttons */}
        <div className="segmented-control twin-segmented-mode" role="tablist">
          <button
            onClick={() => {
              onModeChange('BEFORE')
              onSliderChange(0)
            }}
            className={mode === 'BEFORE' ? 'active' : ''}
            role="tab"
          >
            <Eye size={12} />
            <span>BEFORE</span>
          </button>

          <button
            onClick={() => onModeChange('SLIDER')}
            className={mode === 'SLIDER' ? 'active' : ''}
            role="tab"
          >
            <Sliders size={12} />
            <span>SLIDER ({sliderValue}%)</span>
          </button>

          <button
            onClick={() => {
              onModeChange('AFTER')
              onSliderChange(100)
            }}
            className={mode === 'AFTER' ? 'active severe' : ''}
            role="tab"
          >
            <AlertOctagon size={12} />
            <span>AFTER</span>
          </button>
        </div>
      </div>

      {/* Interactive Range Slider */}
      <div className="twin-slider-wrapper">
        <div className="twin-slider-labels">
          <span className="label-before">
            <i className="status-dot green" />
            <span>Baseline Normal (0%)</span>
          </span>
          <span className="label-value">
            Impact Penetration: <b>{sliderValue}%</b>
          </span>
          <span className="label-after">
            <i className="status-dot red" />
            <span>Peak Convective Hazard (100%)</span>
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
          className="twin-range-slider"
          style={{
            background: `linear-gradient(to right, #38e4c0 0%, #ffc857 ${sliderValue * 0.7}%, #ff4438 ${sliderValue}%, #1a332b ${sliderValue}%, #1a332b 100%)`,
          }}
        />
      </div>

      {/* Before / After Context Cards */}
      <div className="twin-comp-details">
        <div className={`twin-detail-box before-box ${sliderValue < 50 ? 'active' : ''}`}>
          <div className="twin-detail-badge before">
            NORMAL BASELINE: {profile.beforeLabel.toUpperCase()}
          </div>
          <p className="twin-detail-desc">{profile.beforeDescription}</p>
        </div>

        <div className={`twin-detail-box after-box ${sliderValue >= 50 ? 'active' : ''}`}>
          <div className="twin-detail-badge after">
            PROJECTED IMPACT: {profile.afterLabel.toUpperCase()}
          </div>
          <p className="twin-detail-desc">{profile.afterDescription}</p>
        </div>
      </div>
    </div>
  )
}
