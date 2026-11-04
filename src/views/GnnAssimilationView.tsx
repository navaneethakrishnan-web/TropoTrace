import React from 'react'
import {
  Share2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Radio,
  Wifi,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { GnnAssimilationVisualizer } from '../components/GnnAssimilationVisualizer'

export function GnnAssimilationView() {
  const { navigate } = useApp()

  return (
    <div className="view-stack gnn-assimilation-view">
      {/* Module Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 07 · GRAPH NEURAL NETWORK ATMOSPHERIC DATA ASSIMILATION</span>
          </div>
          <h2>GNN Data Assimilation &amp; Graph Neural Network</h2>
          <p>
            Physics-informed Graph Attention Network (GATv2) replacing traditional 4D-Var variational assimilation.
            Ingests heterogeneous multi-sensor observations, executes message passing across non-Euclidean spatial topology,
            and synthesizes continuous mass-conserving atmospheric states in milliseconds.
          </p>
        </div>

        <div className="observatory-status-pill">
          <span className="status-dot green" />
          <span>GNN INFERENCE: 118 MS · ACTIVE</span>
        </div>
      </div>

      {/* Main Interactive Visualizer */}
      <GnnAssimilationVisualizer initialMode="LIVE_OPENWEATHER" />

      {/* GNN Technical Architecture & Theory Guide */}
      <div className="panel-surface gnn-architecture-guide">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">
              <Cpu size={14} />
              <span>THEORETICAL FOUNDATION &amp; MATHEMATICAL FORMULATION</span>
            </div>
            <h3>Physics-Informed Graph Neural Network (PI-GNN) Pipeline</h3>
          </div>
          <span className="demo-label">NON-EUCLIDEAN ATMOSPHERIC OPERATOR</span>
        </div>

        <div className="gnn-theory-grid">
          <div className="theory-card">
            <div className="theory-step-num">01</div>
            <h4>Data Collection &amp; Fetching</h4>
            <p>
              Heterogeneous observation streams collected from Doppler S-Band Radar (reflectivity Z, radial velocity Vr),
              AWS mesonet stations (T, P, RH, wind), IMD lightning sensor arrays, INSAT-3DR geostationary radiance,
              and live OpenWeather surface telemetry.
            </p>
          </div>

          <div className="theory-card">
            <div className="theory-step-num">02</div>
            <h4>Spatial Graph Construction</h4>
            <p>
              Irregular spatial observation sites and convective mesh vertices modeled as graph nodes V. Directed edges E
              constructed using Delaunay triangulation and distance thresholding (d &lt; 35 km) with terrain slope (Δz)
              and wind advection alignment features.
            </p>
          </div>

          <div className="theory-card">
            <div className="theory-step-num">03</div>
            <h4>Graph Attention Message Passing</h4>
            <p>
              Multi-head attention coefficients (α_ij) dynamically weight information exchange based on physical proximity
              and upwind/downwind storm trajectory. Eliminates Euclidean grid interpolation artifacts common in traditional NWP.
            </p>
          </div>

          <div className="theory-card">
            <div className="theory-step-num">04</div>
            <h4>Physics-Informed Regularization</h4>
            <p>
              Soft neural penalties enforce atmospheric physical laws during training and inference: zero mass divergence
              (∇ · V ≈ 0), hydrostatic balance, and energy conservation across steep Western Ghats orography.
            </p>
          </div>
        </div>

        {/* Action Handoff Strip */}
        <div className="gnn-handoff-strip">
          <div className="handoff-text">
            <b>Downstream Convective Pipeline:</b> The continuous assimilated state feeds directly into the
            Adaptive Impact Twin and Storm Intelligence kinematic nowcast engines.
          </div>
          <button
            className="primary-action"
            onClick={() => navigate('impact')}
            title="Inspect continuous impact simulations in Adaptive Impact Twin"
          >
            <span>VIEW IN ADAPTIVE IMPACT TWIN</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
