'use client'

import { useEffect, useState, useCallback } from 'react'
import LiveStatus from '@/components/LiveStatus'
import LiveMetrics from '@/components/LiveMetrics'
import LiveHUD from '@/components/LiveHUD'

interface AgentState {
  status: string
  message: string
}

interface AgentsMap {
  Observer:   AgentState
  Questioner: AgentState
  Advocate:   AgentState
  Summarizer: AgentState
  Executor:   AgentState
  Supervisor: AgentState
}

const AGENT_ORDER: (keyof AgentsMap)[] = [
  'Observer', 'Questioner', 'Advocate', 'Summarizer', 'Executor', 'Supervisor',
]

const AGENT_ICONS: Record<string, string> = {
  Observer:   '📡',
  Questioner: '❓',
  Advocate:   '⚖️',
  Summarizer: '📝',
  Executor:   '⚡',
  Supervisor: '🕵️',
}

const STATUS_COLOR: Record<string, string> = {
  Sleeping:    'var(--text-dim)',
  Thinking:    'var(--cyan)',
  Observing:   'var(--cyan)',
  Questioning: 'var(--yellow)',
  Arguing:     'var(--red)',
  Summarizing: 'var(--purple-bright)',
  Deciding:    'var(--gold)',
  Reviewing:   'var(--magenta)',
  Watching:    'var(--green)',
  Done:        'var(--green)',
  Error:       'var(--red)',
}

function AgentCard({ name, state }: { name: string; state: AgentState }) {
  const color = STATUS_COLOR[state.status] ?? 'var(--text-dim)'
  const sleeping = state.status === 'Sleeping'

  return (
    <div
      className="glass-card flex flex-col gap-3 p-4"
      style={{ border: `1px solid ${color}30` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '18px' }}>{AGENT_ICONS[name]}</span>
          <span className="font-pixel" style={{ color: 'var(--text-primary)', fontSize: '7px' }}>
            {name.toUpperCase()}
          </span>
        </div>
        <span
          className="font-pixel"
          style={{ color, fontSize: '6px', border: `1px solid ${color}50`, padding: '2px 6px' }}
        >
          {state.status.toUpperCase()}
        </span>
      </div>
      <p
        className="font-pixel leading-relaxed"
        style={{
          color: sleeping ? 'var(--text-dim)' : 'var(--text-primary)',
          fontSize: '7px',
          opacity: sleeping ? 0.5 : 1,
          minHeight: '32px',
        }}
      >
        {state.message}
      </p>
    </div>
  )
}

export default function ProjectOmnitechPage() {
  const [agents, setAgents] = useState<AgentsMap | null>(null)
  const [forcing, setForcing] = useState(false)
  const [lastAgentSync, setLastAgentSync] = useState('')

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/agents', { cache: 'no-store' })
      if (res.ok) {
        setAgents(await res.json())
        setLastAgentSync(new Date().toLocaleTimeString())
      }
    } catch {
      // keep previous
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const id = setInterval(fetchAgents, 5_000)
    return () => clearInterval(id)
  }, [fetchAgents])

  async function forceRun() {
    setForcing(true)
    try {
      await fetch('/api/bot/agents', { method: 'POST' })
      setTimeout(fetchAgents, 800)
    } finally {
      setTimeout(() => setForcing(false), 2000)
    }
  }

  return (
    <div className="omnitrade-theme relative min-h-screen" style={{ background: 'var(--bg-dark)' }}>
      {/* Space background */}
      <div className="space-bg">
        <div className="space-stars" />
        <div className="space-nebula" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
              <h1
                className="font-pixel glow-cyan"
                style={{ color: 'var(--cyan)', fontSize: '13px', letterSpacing: '0.12em' }}
              >
                OMNITRADE COMMAND CENTER
              </h1>
            </div>
            <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
              EMA 9/21 STRATEGY · 6-AGENT AI VALIDATION · BINANCE
            </p>
          </div>
        </div>

        {/* ── Bot Status ── */}
        <LiveStatus />

        {/* ── Live Metrics ── */}
        <LiveMetrics />

        {/* ── 6 Agents Panel ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
                ■ AI AGENT COUNCIL
              </p>
              {lastAgentSync && (
                <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>
                  SYNC {lastAgentSync} · AUTO 5s
                </p>
              )}
            </div>
            <button
              onClick={forceRun}
              disabled={forcing}
              className="font-pixel"
              style={{
                color: forcing ? 'var(--text-dim)' : 'var(--cyan)',
                border: `1px solid ${forcing ? 'var(--text-dim)' : 'var(--cyan)'}`,
                padding: '6px 14px',
                fontSize: '7px',
                background: 'transparent',
                cursor: forcing ? 'not-allowed' : 'pointer',
                opacity: forcing ? 0.5 : 1,
              }}
            >
              {forcing ? 'WAKING...' : '⚡ FORCE RUN'}
            </button>
          </div>

          {agents ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AGENT_ORDER.map((name) => (
                <AgentCard key={name} name={name} state={agents[name]} />
              ))}
            </div>
          ) : (
            <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
              CONNECTING TO AGENT COUNCIL...
            </p>
          )}
        </div>

        {/* ── Full Trading HUD ── */}
        <div className="flex flex-col gap-4">
          <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            ■ TRADING TERMINAL
          </p>
          <LiveHUD />
        </div>

      </div>
    </div>
  )
}
