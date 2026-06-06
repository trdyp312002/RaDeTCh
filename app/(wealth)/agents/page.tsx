"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

type AgentStatus = "idle" | "coding" | "reading" | "waiting" | "done" | "spawning" | "error"

interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  task: string
  progress: number
  spawnedBy?: string
  updatedAt: string
}

// Desk positions in isometric grid [col, row]
const DESK_POSITIONS: Record<string, [number, number]> = {
  orchestrator: [2, 0],
  researcher:   [0, 1],
  coder:        [1, 2],
  reviewer:     [3, 1],
}

const STATUS_META: Record<AgentStatus, { label: string; color: string; bg: string; icon: string; pulse: boolean }> = {
  idle:      { label: "Idle",      color: "text-stone-400",   bg: "bg-stone-100",   icon: "💤", pulse: false },
  coding:    { label: "Coding",    color: "text-blue-600",    bg: "bg-blue-100",    icon: "💻", pulse: true  },
  reading:   { label: "Reading",   color: "text-violet-600",  bg: "bg-violet-100",  icon: "📖", pulse: false },
  waiting:   { label: "Waiting",   color: "text-amber-600",   bg: "bg-amber-100",   icon: "⏳", pulse: true  },
  done:      { label: "Done",      color: "text-emerald-600", bg: "bg-emerald-100", icon: "✅", pulse: false },
  spawning:  { label: "Spawning",  color: "text-indigo-600",  bg: "bg-indigo-100",  icon: "🔀", pulse: true  },
  error:     { label: "Error",     color: "text-red-600",     bg: "bg-red-100",     icon: "❌", pulse: true  },
}

const ROLE_AVATAR: Record<string, string> = {
  Manager:     "🧑‍💼",
  Research:    "🔬",
  Engineering: "👨‍💻",
  QA:          "🧪",
}

// Isometric tile dimensions
const TW = 120 // tile width
const TH = 70  // tile height
const COLS = 5
const ROWS = 4

function isoX(col: number, row: number) {
  return (col - row) * (TW / 2)
}
function isoY(col: number, row: number) {
  return (col + row) * (TH / 2)
}

function FloorTile({ col, row }: { col: number; row: number }) {
  const x = isoX(col, row)
  const y = isoY(col, row)
  const isEven = (col + row) % 2 === 0
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon
        points={`0,0 ${TW / 2},${TH / 2} 0,${TH} ${-TW / 2},${TH / 2}`}
        fill={isEven ? "#f5f0eb" : "#ede8e3"}
        stroke="#d6cec7"
        strokeWidth="0.5"
      />
    </g>
  )
}

function Desk({
  col,
  row,
  agent,
  selected,
  onClick,
}: {
  col: number
  row: number
  agent: Agent
  selected: boolean
  onClick: () => void
}) {
  const x = isoX(col, row)
  const y = isoY(col, row)
  const meta = STATUS_META[agent.status]
  const avatar = ROLE_AVATAR[agent.role] ?? "🤖"

  const deskColors: Record<AgentStatus, string> = {
    idle:     "#e7e2dc",
    coding:   "#bfdbfe",
    reading:  "#ddd6fe",
    waiting:  "#fde68a",
    done:     "#a7f3d0",
    spawning: "#c7d2fe",
    error:    "#fecaca",
  }
  const deskColor = deskColors[agent.status]

  return (
    <g
      transform={`translate(${x},${y})`}
      className="cursor-pointer"
      onClick={onClick}
      style={{ filter: selected ? "drop-shadow(0 0 8px rgba(79,70,229,0.6))" : undefined }}
    >
      {/* Desk top */}
      <polygon
        points={`0,${-TH * 0.6} ${TW / 2},${-TH * 0.1} 0,${TH * 0.4} ${-TW / 2},${-TH * 0.1}`}
        fill={deskColor}
        stroke="#c8c0b8"
        strokeWidth="1"
      />
      {/* Desk front-left face */}
      <polygon
        points={`${-TW / 2},${-TH * 0.1} 0,${TH * 0.4} 0,${TH * 0.7} ${-TW / 2},${TH * 0.2}`}
        fill="#c8bfb5"
        stroke="#b0a89e"
        strokeWidth="0.5"
      />
      {/* Desk front-right face */}
      <polygon
        points={`0,${TH * 0.4} ${TW / 2},${-TH * 0.1} ${TW / 2},${TH * 0.2} 0,${TH * 0.7}`}
        fill="#d4ccc4"
        stroke="#b0a89e"
        strokeWidth="0.5"
      />
      {/* Monitor */}
      <rect x="-14" y={-TH * 0.6 - 24} width="28" height="18" rx="2" fill="#1e1b18" />
      <rect x="-11" y={-TH * 0.6 - 22} width="22" height="14" rx="1" fill={agent.status === "coding" ? "#3b82f6" : agent.status === "reading" ? "#8b5cf6" : "#374151"} />
      {/* Monitor stand */}
      <rect x="-2" y={-TH * 0.6 - 6} width="4" height="6" fill="#4b5563" />

      {/* Avatar */}
      <text x="0" y={-TH * 0.6 - 30} textAnchor="middle" fontSize="20">
        {avatar}
      </text>

      {/* Status icon bubble */}
      <g transform={`translate(${TW * 0.35},${-TH * 0.7})`}>
        <circle cx="0" cy="0" r="10" fill="white" stroke="#e5e7eb" strokeWidth="1" />
        <text x="0" y="4" textAnchor="middle" fontSize="11">{meta.icon}</text>
      </g>

      {/* Name label */}
      <text x="0" y={TH * 0.55} textAnchor="middle" fontSize="10" fill="#57534e" fontWeight="600">
        {agent.name}
      </text>
    </g>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-stone-200 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents", { cache: "no-store" })
      if (res.ok) {
        const data: Agent[] = await res.json()
        setAgents(data)
        setLastUpdated(new Date().toLocaleTimeString("th-TH"))
      }
    } catch {
      // silent — keep showing last known state
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 3000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  const selectedAgent = agents.find((a) => a.id === selected)

  // SVG canvas size
  const svgW = 700
  const svgH = 500
  const originX = svgW / 2
  const originY = 80

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] to-[#EAE0D5] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-2">Multi-Agent</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-stone-800 tracking-tight">Office</h1>
            <p className="text-stone-500 mt-2 text-sm">
              Live agent workspace · refreshes every 3s · last update {lastUpdated || "—"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="px-5 py-2.5 bg-stone-800 text-white text-sm font-semibold rounded-full hover:bg-stone-700 transition-colors shadow-lg shadow-stone-800/20">
                ← Dashboard
              </button>
            </Link>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Isometric Office */}
          <div className="flex-1 bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-stone-200/50 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-800">Workspace</h2>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(STATUS_META) as AgentStatus[]).map((s) => (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_META[s].bg} ${STATUS_META[s].color}`}>
                    {STATUS_META[s].icon} {STATUS_META[s].label}
                  </span>
                ))}
              </div>
            </div>
            <svg
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full max-w-full"
            >
              <g transform={`translate(${originX},${originY})`}>
                {/* Floor */}
                {Array.from({ length: ROWS }, (_, row) =>
                  Array.from({ length: COLS }, (_, col) => (
                    <FloorTile key={`${col}-${row}`} col={col} row={row} />
                  ))
                )}
                {/* Desks — rendered in painter's order (back to front) */}
                {agents
                  .slice()
                  .sort((a, b) => {
                    const [ac, ar] = DESK_POSITIONS[a.id] ?? [0, 0]
                    const [bc, br] = DESK_POSITIONS[b.id] ?? [0, 0]
                    return ac + ar - (bc + br)
                  })
                  .map((agent) => {
                    const [col, row] = DESK_POSITIONS[agent.id] ?? [4, 3]
                    return (
                      <Desk
                        key={agent.id}
                        col={col}
                        row={row}
                        agent={agent}
                        selected={selected === agent.id}
                        onClick={() => setSelected(selected === agent.id ? null : agent.id)}
                      />
                    )
                  })}
              </g>
            </svg>
          </div>

          {/* Right panel */}
          <div className="lg:w-80 space-y-4">

            {/* Selected agent detail */}
            {selectedAgent ? (
              <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-stone-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{ROLE_AVATAR[selectedAgent.role] ?? "🤖"}</span>
                  <div>
                    <p className="font-extrabold text-stone-800 text-lg">{selectedAgent.name}</p>
                    <p className="text-xs text-stone-500">{selectedAgent.role}</p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full font-bold ${STATUS_META[selectedAgent.status].bg} ${STATUS_META[selectedAgent.status].color}`}>
                    {STATUS_META[selectedAgent.status].icon} {STATUS_META[selectedAgent.status].label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Current task</p>
                    <p className="text-sm font-semibold text-stone-800 bg-stone-50 rounded-xl px-3 py-2">{selectedAgent.task || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Progress</p>
                    <ProgressBar value={selectedAgent.progress} />
                    <p className="text-xs text-stone-500 mt-1 text-right">{selectedAgent.progress}%</p>
                  </div>
                  {selectedAgent.spawnedBy && (
                    <div>
                      <p className="text-xs text-stone-500">Spawned by</p>
                      <p className="text-sm font-semibold text-indigo-700">{selectedAgent.spawnedBy}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-stone-500">Last updated</p>
                    <p className="text-xs text-stone-400">{new Date(selectedAgent.updatedAt).toLocaleTimeString("th-TH")}</p>
                  </div>

                  {selectedAgent.status === "waiting" && (
                    <button
                      onClick={async () => {
                        await fetch("/api/agents", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: selectedAgent.id, status: "idle", task: "Approved — resuming" }),
                        })
                        fetchAgents()
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      ✅ Approve &amp; Resume
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/50 border border-white/40 rounded-3xl p-6 text-center text-stone-400 text-sm">
                Click a desk to inspect agent
              </div>
            )}

            {/* All agents status list */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-stone-200/50">
              <h3 className="font-bold text-stone-800 mb-3 text-sm uppercase tracking-widest">Status Board</h3>
              <div className="space-y-2">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(selected === a.id ? null : a.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-stone-100 ${selected === a.id ? "bg-indigo-50 border border-indigo-200" : ""}`}
                  >
                    <span className="text-lg">{ROLE_AVATAR[a.role] ?? "🤖"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800 truncate">{a.name}</p>
                      <p className="text-xs text-stone-500 truncate">{a.task || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_META[a.status].bg} ${STATUS_META[a.status].color} ${STATUS_META[a.status].pulse ? "animate-pulse" : ""}`}>
                      {STATUS_META[a.status].icon}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* API hint */}
            <div className="bg-stone-800/90 backdrop-blur-xl rounded-3xl p-5 text-xs font-mono text-stone-300 space-y-1">
              <p className="text-stone-400 text-xs font-sans font-bold mb-2">Wire your agent runner:</p>
              <p className="text-emerald-400"># Update status</p>
              <p>PATCH /api/agents</p>
              <p className="text-stone-500">{"{ id, status, task, progress }"}</p>
              <p className="text-emerald-400 mt-2"># Spawn new agent</p>
              <p>POST /api/agents</p>
              <p className="text-stone-500">{"{ id, name, role, status, task, spawnedBy }"}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
