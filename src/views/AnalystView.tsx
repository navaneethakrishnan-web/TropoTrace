import { useRef, useState, useEffect } from 'react'
import {
  Bot,
  Check,
  Info,
  Loader2,
  MessageSquare,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateAnalystResponseAsync, SUGGESTED_PROMPTS } from '../domain/analyst'
import type { AnalystMessage } from '../domain/types'

export function AnalystView() {
  const { snapshot, selectedCellId } = useApp()
  const cell = snapshot.cells.find((c) => c.id === selectedCellId) ?? snapshot.cells[0]

  const [inputQuery, setInputQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<AnalystMessage[]>([
    {
      id: 'init-msg',
      sender: 'analyst',
      text: `Hello Operator. I am **Tropo**, your AI-powered meteorological copilot grounded in the live convective nowcast state for **${cell.name} (${cell.id})**. I'm powered by advanced AI to provide intelligent, context-aware storm analysis.\n\nSelect a question from the left panel or type any meteorological inquiry — I can analyze cell kinematics, active hazards, impact exposure, sensor consensus, and much more.`,
      timestamp: 'Just now',
      citations: ['Live Convective State Snapshot', 'Groq AI (GPT-OSS 120B)'],
      evidenceConfidence: 98,
    },
  ])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async (queryToSend = inputQuery) => {
    const q = queryToSend.trim()
    if (!q || isLoading) return

    const userMsg: AnalystMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputQuery('')
    setIsLoading(true)

    try {
      const { text, citations, evidenceConfidence } = await generateAnalystResponseAsync(q, snapshot, cell)

      const analystMsg: AnalystMessage = {
        id: `analyst-${Date.now()}`,
        sender: 'analyst',
        text,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        citations,
        evidenceConfidence,
      }

      setMessages((prev) => [...prev, analystMsg])
    } catch {
      const errorMsg: AnalystMessage = {
        id: `error-${Date.now()}`,
        sender: 'analyst',
        text: '**System Error:** Failed to process your query. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        citations: ['System Diagnostics'],
        evidenceConfidence: 0,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Simple markdown bold rendering
  const renderText = (text: string) => {
    return text.split('\n\n').map((para, i) => (
      <p key={i}>
        {para.split(/(\*\*.*?\*\*)/).map((segment, j) => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return <strong key={j}>{segment.slice(2, -2)}</strong>
          }
          return <span key={j}>{segment}</span>
        })}
      </p>
    ))
  }

  return (
    <div className="view-stack analyst-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>MODULE 09 · AI-POWERED METEOROLOGICAL COPILOT</span>
          </div>
          <h2>Tropo</h2>
          <p>
            AI-powered conversational copilot grounded in active radar, satellite, and nowcast
            telemetry. Powered by Groq GPT-OSS 120B for intelligent analysis.
          </p>
        </div>

        <div className="analyst-badge">
          <ShieldCheck size={14} />
          <span>AI-GROUNDED ANALYSIS · ZERO-HALLUCINATION POLICY</span>
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
                  disabled={isLoading}
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
              <b>TROPO AI COPILOT</b>
              <span>Synchronized with T+{Math.round(snapshot.minute)}m nowcast telemetry · Groq GPT-OSS 120B</span>
            </div>
            <span className="copilot-ready-tag">
              <span className={`status-dot ${isLoading ? 'amber' : 'green'}`} />
              <span>{isLoading ? 'THINKING' : 'READY'}</span>
            </span>
          </div>

          {/* Messages Stream */}
          <div className="chat-messages-container" ref={chatContainerRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-message-bubble ${m.sender === 'user' ? 'user-bubble' : 'analyst-bubble'}`}
              >
                <div className="bubble-header">
                  <span className="sender-name">
                    {m.sender === 'user' ? 'OPERATOR' : 'TROPO AI'}
                  </span>
                  <span className="bubble-time">{m.timestamp}</span>
                </div>

                <div className="bubble-body">
                  {renderText(m.text)}
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

            {/* Loading indicator */}
            {isLoading && (
              <div className="chat-message-bubble analyst-bubble">
                <div className="bubble-header">
                  <span className="sender-name">TROPO AI</span>
                  <span className="bubble-time">analyzing…</span>
                </div>
                <div className="bubble-body loading-bubble">
                  <Loader2 size={16} className="spinning" />
                  <span>Analyzing live convective state with AI…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="chat-input-bar">
            <input
              type="text"
              placeholder="Ask any meteorological question about the active storm or scenario…"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              aria-label="Ask Tropo a question"
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={!inputQuery.trim() || isLoading}
              aria-label="Send query"
            >
              {isLoading ? <Loader2 size={15} className="spinning" /> : <Send size={15} />}
            </button>
          </div>

          <div className="analyst-footnote">
            <Info size={12} />
            <span>
              Tropo is powered by <b>Groq AI (GPT-OSS 120B)</b> and grounded in live scenario data.
              All responses are evidence-based with cited sources and confidence scores.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
