import { useState } from 'react'
import {
  Bot,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  MessageSquare,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateAnalystResponse, SUGGESTED_PROMPTS } from '../domain/analyst'
import type { AnalystMessage } from '../domain/types'

export function AnalystView() {
  const { snapshot, selectedCellId } = useApp()
  const cell = snapshot.cells.find((c) => c.id === selectedCellId) ?? snapshot.cells[0]

  const [inputQuery, setInputQuery] = useState('')
  const [messages, setMessages] = useState<AnalystMessage[]>([
    {
      id: 'init-msg',
      sender: 'analyst',
      text: `Hello Operator. I am **Tropo**, grounded strictly in the live convective nowcast state for **${cell.name} (${cell.id})**. Select a question from the left panel or type a meteorological inquiry regarding cell kinematics, active hazards, impact exposure, or sensor consensus.`,
      timestamp: 'Just now',
      citations: ['Live Convective State Snapshot', 'Consensus Engine v1.0'],
      evidenceConfidence: 98,
    },
  ])

  const handleSend = (queryToSend = inputQuery) => {
    const q = queryToSend.trim()
    if (!q) return

    const userMsg: AnalystMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: 'Now',
    }

    const { text, citations, evidenceConfidence } = generateAnalystResponse(q, snapshot, cell)

    const analystMsg: AnalystMessage = {
      id: `analyst-${Date.now()}`,
      sender: 'analyst',
      text,
      timestamp: 'Now',
      citations,
      evidenceConfidence,
    }

    setMessages((prev) => [...prev, userMsg, analystMsg])
    setInputQuery('')
  }

  return (
    <div className="view-stack analyst-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 09 · GROUNDED METEOROLOGICAL COPILOT</span>
          </div>
          <h2>Tropo</h2>
          <p>
            Structured conversational assistant grounded strictly in active radar, satellite, and nowcast
            telemetry. Free from ungrounded hallucinations.
          </p>
        </div>

        <div className="analyst-badge">
          <ShieldCheck size={14} />
          <span>ZERO-HALLUCINATION POLICY ACTIVE</span>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="analyst-layout">
        {/* Left Side: Context Chip + Suggested Prompts */}
        <aside className="panel-surface analyst-sidebar-pane">
          {/* Active Context Chip */}
          <div className="analyst-context-chip">
            <div className="panel-kicker">
              <Radio size={12} />
              <span>ACTIVE CONTEXT STATE</span>
            </div>
            <h4>{cell.name} ({cell.id})</h4>
            <div className="context-meta-row">
              <span>INTENSITY: <b>{cell.intensity}%</b></span>
              <span>VECTOR: <b>{cell.speed} km/h {cell.direction}</b></span>
            </div>
            <div className="context-meta-row">
              <span>STAGE: <b className="text-amber">{cell.lifecycle}</b></span>
              <span>CONSENSUS: <b>{snapshot.consensus}%</b></span>
            </div>
          </div>

          {/* Categorized Suggested Prompts */}
          <div className="suggested-prompts-section">
            <div className="section-title">
              <Sparkles size={13} />
              <span>SUGGESTED OPERATIONAL INQUIRIES</span>
            </div>

            <div className="prompts-list">
              {SUGGESTED_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  className="prompt-suggestion-btn"
                  onClick={() => handleSend(p.question)}
                >
                  <span className="prompt-category-tag">{p.category}</span>
                  <span className="prompt-text">{p.question}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Conversation Transcript & Input */}
        <div className="panel-surface analyst-chat-pane">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="analyst-avatar-badge">
              <Bot size={20} />
            </div>
            <div>
              <b>TROPO COPILOT</b>
              <span>Synchronized with T+{Math.round(snapshot.minute)}m nowcast telemetry</span>
            </div>
            <span className="copilot-ready-tag">
              <span className="status-dot green" />
              <span>READY</span>
            </span>
          </div>

          {/* Messages Stream */}
          <div className="chat-messages-container">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-message-bubble ${m.sender === 'user' ? 'user-bubble' : 'analyst-bubble'}`}
              >
                <div className="bubble-header">
                  <span className="sender-name">
                    {m.sender === 'user' ? 'OPERATOR' : 'TROPO'}
                  </span>
                  <span className="bubble-time">{m.timestamp}</span>
                </div>

                <div className="bubble-body">
                  {m.text.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {/* Evidence Citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="citations-tray">
                    <span className="citations-label">GROUNDED SOURCES:</span>
                    <div className="citation-pills">
                      {m.citations.map((c, i) => (
                        <span key={i} className="citation-pill">
                          <Check size={11} />
                          <span>{c}</span>
                        </span>
                      ))}
                      {m.evidenceConfidence !== undefined && (
                        <span className="confidence-pill-mini">
                          {m.evidenceConfidence}% CONFIDENCE
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Box */}
          <div className="chat-input-bar">
            <input
              type="text"
              placeholder="Ask a meteorological question about the active storm or scenario…"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              aria-label="Ask Tropo a question"
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={!inputQuery.trim()}
              aria-label="Send query"
            >
              <Send size={15} />
            </button>
          </div>

          <div className="analyst-footnote">
            <Info size={12} />
            <span>
              If asked about variables outside the current simulation state, the analyst will
              strictly answer: <b>Insufficient current data in current scenario snapshot.</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
