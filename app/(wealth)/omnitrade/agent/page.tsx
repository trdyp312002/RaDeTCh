import { readAllMarkdown } from '@/lib/markdown'
import ModuleCard from '@/components/ModuleCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OmniTrade — AI Agent Protocol' }

interface ToolMeta {
  title: string
  ability: string
  icon: string
  color: string
  level: number
  status: string
  latency: string
  description: string
  responsibilities: string[]
  dependencies: string[]
}

const toolOrder = ['multion', 'openinterpreter', 'make']

const capabilities = [
  {
    icon: '👁️',
    label: 'VISION',
    desc: 'Analyzes the browser screen in real time — reads UI elements, text, buttons, and page state',
    color: '#00f5ff',
  },
  {
    icon: '🧠',
    label: 'DECISION',
    desc: 'Chooses the next action based on current screen state and the task objective',
    color: '#a855f7',
  },
  {
    icon: '⚡',
    label: 'ACTION',
    desc: 'Executes clicks, form fills, scrolls, and navigation until the task completes',
    color: '#00ff41',
  },
]

const protocol = [
  { step: 1, action: 'INSTALL EXTENSION', detail: 'Add MultiOn to Chrome from multion.ai — no code needed' },
  { step: 2, action: 'WRITE TASK PROMPT', detail: 'Describe the goal clearly: target site → what to do → where to send output' },
  { step: 3, action: 'FIRST RUN (SUPERVISED)', detail: 'Watch the agent execute — verify each step before trusting it alone' },
  { step: 4, action: 'HUMAN VERIFY', detail: 'Review output before the final action is dispatched (Human-in-the-loop)' },
  { step: 5, action: 'REFINE PROMPT', detail: 'If agent misclicks or stalls, tighten the prompt and retry' },
  { step: 6, action: 'SCALE UP', detail: 'Expand to complex multi-step workflows once simple tasks run reliably' },
]

const warnings = [
  { code: 'SEC-01', msg: 'NEVER allow agent access to banking portals, passwords, or customer personal data until the tool\'s security model is fully verified' },
  { code: 'HAL-01', msg: 'AI agents hallucinate — always verify output before it triggers any real-world consequence' },
  { code: 'UI-01', msg: 'Website UI updates silently break agents — monitor runs and keep prompts current' },
]

export default function AgentPage() {
  const all = readAllMarkdown('agent')
  const tools = toolOrder
    .map((slug) => all.find((t) => t.slug === slug))
    .filter(Boolean) as typeof all

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ AUTOMATION LAYER
        </p>
        <h1 className="font-pixel glow-cyan" style={{ color: 'var(--cyan)', fontSize: '18px' }}>
          AI AGENT PROTOCOL
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Browser automation — AI sees, decides, and acts on any website
        </p>
        <a href="/omnitrade/agents" className="inline-block mt-4 px-4 py-2 bg-blue-500/20 border border-blue-400 text-blue-300 rounded hover:bg-blue-500/40 text-center font-pixel" style={{ fontSize: '10px' }}>
          → VIEW LIVE AGENT AQUARIUM (CRYPTO BOT)
        </a>
      </div>

      {/* Flow label */}
      <div
        className="p-3 font-pixel text-center"
        style={{
          border: '1px solid var(--border-dim)',
          color: 'var(--text-dim)',
          fontSize: '8px',
          letterSpacing: '2px',
        }}
      >
        VISION → DECISION → ACTION → [TARGET WEBSITE]
      </div>

      {/* Core capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {capabilities.map((cap) => (
          <div
            key={cap.label}
            className="flex flex-col gap-3 p-5"
            style={{
              background: 'var(--bg-card)',
              border: `2px solid ${cap.color}`,
              boxShadow: `4px 4px 0 ${cap.color}`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cap.icon}</span>
              <span className="font-pixel" style={{ color: cap.color, fontSize: '11px' }}>
                {cap.label}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              {cap.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div>
        <p className="font-pixel mb-4" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ RECOMMENDED TOOLS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tools.map((tool) => {
            const m = tool.meta as ToolMeta
            return (
              <ModuleCard
                key={tool.slug}
                title={m.title}
                ability={m.ability}
                icon={m.icon}
                color={m.color}
                level={m.level}
                status={m.status}
                latency={m.latency}
                description={m.description}
                responsibilities={m.responsibilities}
                dependencies={m.dependencies}
              />
            )
          })}
        </div>
      </div>

      {/* Deployment protocol */}
      <div>
        <p className="font-pixel mb-4" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ DEPLOYMENT PROTOCOL
        </p>
        <div className="flex flex-col gap-2">
          {protocol.map((p) => (
            <div
              key={p.step}
              className="flex items-start gap-4 p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)' }}
            >
              <span
                className="font-pixel flex-shrink-0"
                style={{ color: 'var(--cyan)', fontSize: '10px', minWidth: '24px' }}
              >
                {String(p.step).padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-pixel" style={{ color: 'var(--text-primary)', fontSize: '9px' }}>
                  {p.action}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {p.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      <div>
        <p className="font-pixel mb-4" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ SYSTEM WARNINGS
        </p>
        <div className="flex flex-col gap-2">
          {warnings.map((w) => (
            <div
              key={w.code}
              className="flex items-start gap-4 p-4"
              style={{
                background: 'rgba(255,68,68,0.05)',
                border: '1px solid rgba(255,68,68,0.3)',
              }}
            >
              <span className="font-pixel flex-shrink-0" style={{ color: '#ff4444', fontSize: '8px' }}>
                [{w.code}]
              </span>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {w.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
