'use client'

import { useState } from 'react'

interface Directive {
  assignTo: string
  directive: string
  context: string
}

interface SecretaryResponse {
  summary: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  directives: Directive[]
}

const PRIORITY_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  HIGH:   { bg: 'rgba(255,68,68,0.12)',   border: '#ff4444', color: '#ff4444' },
  MEDIUM: { bg: 'rgba(255,165,0,0.12)',   border: '#ffa500', color: '#ffa500' },
  LOW:    { bg: 'rgba(16,185,129,0.12)',  border: '#10b981', color: '#10b981' },
}

const ASSIGN_COLOR: Record<string, string> = {
  'Quant Researcher': '#60a5fa',
  'Backend Engineer': '#c084fc',
  'Risk Manager':     '#fb923c',
  'DevOps / SRE':     '#34d399',
}

export default function SecretaryCommand() {
  const [command, setCommand] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SecretaryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function forge() {
    if (!command.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/secretary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? res.statusText)
      }
      const parsed: SecretaryResponse = await res.json()
      setResult(parsed)

      // forward each directive to the bot command queue
      await Promise.allSettled(
        parsed.directives.map((d) =>
          fetch('/api/bot/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(d),
          })
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const p = result ? (PRIORITY_STYLE[result.priority] ?? PRIORITY_STYLE.LOW) : null

  return (
    <div
      className="flex flex-col gap-5 p-5 glass-card"
      style={{ border: '1px solid rgba(255,204,0,0.3)', boxShadow: '0 0 30px rgba(255,204,0,0.15)' }}
    >
      <p className="font-pixel" style={{ color: 'var(--gold)', fontSize: '8px' }}>
        ⚡ COMMAND FORGE — GRAND VIZIER INTERFACE
      </p>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full p-3 text-sm resize-none"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,204,0,0.25)',
            color: 'var(--text-primary)',
            minHeight: '90px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          placeholder={'Type raw command… e.g. "bot ช้ามาก", "reduce risk when crash", "need BTC signal"'}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) forge()
          }}
        />
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>
          Ctrl+Enter to forge
        </p>
      </div>

      <button
        onClick={forge}
        disabled={loading || !command.trim()}
        className="font-pixel self-start px-4 py-2"
        style={{
          background: 'rgba(255,204,0,0.12)',
          border: '1px solid rgba(255,204,0,0.5)',
          color: 'var(--gold)',
          fontSize: '8px',
          cursor: loading || !command.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !command.trim() ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? '◈ FORGING...' : '⚡ FORGE COMMAND'}
      </button>

      {error && (
        <p className="text-xs font-pixel" style={{ color: '#ff4444', fontSize: '7px' }}>
          ✗ {error}
        </p>
      )}

      {result && p && (
        <div className="flex flex-col gap-4">
          {/* summary + priority */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-pixel mb-1" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
                INTERPRETED INTENT
              </p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{result.summary}</p>
            </div>
            <div
              className="font-pixel px-3 py-1 shrink-0"
              style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.color, fontSize: '7px' }}
            >
              {result.priority}
            </div>
          </div>

          {/* directives */}
          <div className="flex flex-col gap-3">
            <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
              FORGED DIRECTIVES
            </p>
            {result.directives.map((d, i) => {
              const tc = ASSIGN_COLOR[d.assignTo] ?? 'var(--gold)'
              return (
                <div
                  key={i}
                  className="p-4 flex flex-col gap-1.5"
                  style={{ border: `1px solid ${tc}40`, background: `${tc}08` }}
                >
                  <p className="font-pixel" style={{ color: tc, fontSize: '7px' }}>
                    → {d.assignTo}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {d.directive}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    {d.context}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
