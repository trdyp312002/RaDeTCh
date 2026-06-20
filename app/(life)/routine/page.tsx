"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type MandalaAction = { id: string; subgoal_id: string; position: number; text: string; completed: number }
type MandalaSubgoal = { id: string; chart_id: string; position: number; title: string; color: string }
type MandalaChart = { id: string; main_goal: string }

type Milestone = {
  id: string
  year: number
  title: string
  description: string
  category: string
  color: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

const CATEGORY_OPTIONS = [
  { value: "career", label: "Career" },
  { value: "wealth", label: "Wealth" },
  { value: "health", label: "Health" },
  { value: "personal", label: "Personal" },
  { value: "life", label: "Life" },
]

const PALETTE = [
  "#818cf8", "#34d399", "#fb923c", "#f472b6",
  "#38bdf8", "#a78bfa", "#fbbf24", "#4ade80",
  "#e879f9", "#22d3ee",
]

// ─── Mandala layout helpers ───────────────────────────────────────────────────
//
// 9×9 grid divided into nine 3×3 blocks.
// Center block (rows 3-5, cols 3-5):
//   - (4,4) = main goal
//   - 8 surrounding cells = sub-goals at positions 0-7
//
// Each sub-goal at center-block position p mirrors to the center of its
// corresponding outer block, whose 8 surrounding cells are that sub-goal's actions.

// sub-goal position p → [row, col] in center 3×3 block (3-5,3-5)
const SG_POS: [number, number][] = [
  [3, 3], [3, 4], [3, 5],
  [4, 3], [4, 5],
  [5, 3], [5, 4], [5, 5],
]

// outer block index for sub-goal p (0=TL,1=TC,2=TR,3=ML,4=MR,5=BL,6=BC,7=BR)
const OUTER_BLOCK_ORIGIN: [number, number][] = [
  [0, 0], [0, 3], [0, 6],
  [3, 0], [3, 6],
  [6, 0], [6, 3], [6, 6],
]

function outerCenter(p: number): [number, number] {
  const [or, oc] = OUTER_BLOCK_ORIGIN[p]
  return [or + 1, oc + 1]
}

// 8 action positions in outer block p (clockwise from TL, skipping center)
function actionCells(p: number): [number, number][] {
  const [or, oc] = OUTER_BLOCK_ORIGIN[p]
  return [
    [or, oc], [or, oc + 1], [or, oc + 2],
    [or + 1, oc], [or + 1, oc + 2],
    [or + 2, oc], [or + 2, oc + 1], [or + 2, oc + 2],
  ]
}

// Build a 9×9 cell-type map
type CellType =
  | { kind: "main" }
  | { kind: "subgoal"; sgPos: number }
  | { kind: "action"; sgPos: number; actionPos: number }
  | { kind: "empty" }

function buildCellMap(): CellType[][] {
  const map: CellType[][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ kind: "empty" as const }))
  )
  map[4][4] = { kind: "main" }
  for (let p = 0; p < 8; p++) {
    const [sr, sc] = SG_POS[p]
    map[sr][sc] = { kind: "subgoal", sgPos: p }
    const [cr, cc] = outerCenter(p)
    map[cr][cc] = { kind: "subgoal", sgPos: p }
    const cells = actionCells(p)
    cells.forEach(([ar, ac], apos) => {
      map[ar][ac] = { kind: "action", sgPos: p, actionPos: apos }
    })
  }
  return map
}

const CELL_MAP = buildCellMap()

// ─── Mandala Tab ──────────────────────────────────────────────────────────────

function MandalaTab() {
  const [chart, setChart] = useState<MandalaChart | null>(null)
  const [subgoals, setSubgoals] = useState<MandalaSubgoal[]>([])
  const [actions, setActions] = useState<MandalaAction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingMain, setEditingMain] = useState(false)
  const [mainDraft, setMainDraft] = useState("")
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/mandala")
      .then((r) => r.json())
      .then((data) => {
        setChart(data.chart)
        setSubgoals(data.subgoals ?? [])
        setActions(data.actions ?? [])
        setMainDraft(data.chart?.main_goal ?? "")
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (editingCell && editRef.current) editRef.current.focus()
  }, [editingCell])

  const sgByPos = Object.fromEntries(subgoals.map((sg) => [sg.position, sg]))
  const actByKey = Object.fromEntries(
    actions.map((a) => {
      const sg = subgoals.find((s) => s.id === a.subgoal_id)
      return [`${sg?.position ?? "?"}-${a.position}`, a]
    })
  )

  const saveAll = useCallback(async () => {
    if (!chart) return
    setSaving(true)
    const payload = {
      subgoals: subgoals.map((sg) => ({
        ...sg,
        actions: actions.filter((a) => a.subgoal_id === sg.id),
      })),
    }
    await fetch(`/api/mandala/${chart.id}/subgoals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(false)
  }, [chart, subgoals, actions])

  const saveMainGoal = async () => {
    if (!chart) return
    await fetch(`/api/mandala/${chart.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ main_goal: mainDraft }),
    })
    setChart((c) => c ? { ...c, main_goal: mainDraft } : c)
    setEditingMain(false)
  }

  const updateSubgoalText = (pos: number, title: string) => {
    setSubgoals((prev) => prev.map((sg) => sg.position === pos ? { ...sg, title } : sg))
  }

  const updateSubgoalColor = (pos: number, color: string) => {
    setSubgoals((prev) => prev.map((sg) => sg.position === pos ? { ...sg, color } : sg))
  }

  const updateActionText = (sgPos: number, aPos: number, text: string) => {
    const sg = sgByPos[sgPos]
    if (!sg) return
    setActions((prev) =>
      prev.map((a) => a.subgoal_id === sg.id && a.position === aPos ? { ...a, text } : a)
    )
  }

  const toggleAction = async (a: MandalaAction) => {
    const next = a.completed ? 0 : 1
    setActions((prev) => prev.map((x) => x.id === a.id ? { ...x, completed: next } : x))
    await fetch(`/api/mandala/action/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: next === 1 }),
    })
  }

  const progressOf = (pos: number) => {
    const sg = sgByPos[pos]
    if (!sg) return 0
    const acts = actions.filter((a) => a.subgoal_id === sg.id)
    const done = acts.filter((a) => a.completed).length
    return acts.length ? Math.round((done / acts.length) * 100) : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Loading Mandala Chart…
      </div>
    )
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left: grid */}
      <div className="flex-1 min-w-0">
        {/* Main goal input */}
        <div className="mb-4 flex items-center gap-3">
          {editingMain ? (
            <>
              <input
                autoFocus
                value={mainDraft}
                onChange={(e) => setMainDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveMainGoal(); if (e.key === "Escape") setEditingMain(false) }}
                placeholder="เป้าหมายหลักของคุณ…"
                className="flex-1 text-lg font-bold bg-white/80 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-stone-800"
              />
              <button onClick={saveMainGoal} className="px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-600 transition-colors">Save</button>
              <button onClick={() => setEditingMain(false)} className="px-3 py-2 text-stone-400 hover:text-stone-600 text-sm">Cancel</button>
            </>
          ) : (
            <button
              onClick={() => setEditingMain(true)}
              className="text-xl font-bold text-stone-800 hover:text-indigo-600 transition-colors flex items-center gap-2 group"
            >
              {chart?.main_goal || <span className="text-stone-400 font-normal text-base">คลิกเพื่อตั้งเป้าหมายหลัก…</span>}
              <span className="opacity-0 group-hover:opacity-100 text-stone-400 text-sm font-normal">✏️</span>
            </button>
          )}
        </div>

        {/* 9×9 grid */}
        <div
          className="grid gap-[2px] w-full"
          style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              if (editingCell) { saveAll(); setEditingCell(null) }
            }
          }}
        >
          {Array.from({ length: 9 }).map((_, row) =>
            Array.from({ length: 9 }).map((_, col) => {
              const cell = CELL_MAP[row][col]

              // ── Main goal cell ─────────────────────────────────────
              if (cell.kind === "main") {
                return (
                  <div
                    key={`${row}-${col}`}
                    className="aspect-square rounded-lg bg-stone-800 flex items-center justify-center p-1 shadow-lg"
                    title={chart?.main_goal}
                  >
                    <span className="text-white text-[10px] sm:text-xs font-bold text-center leading-tight line-clamp-3 px-1">
                      {chart?.main_goal || "GOAL"}
                    </span>
                  </div>
                )
              }

              // ── Sub-goal cell ──────────────────────────────────────
              if (cell.kind === "subgoal") {
                const sg = sgByPos[cell.sgPos]
                const color = sg?.color ?? "#818cf8"
                const cellKey = `sg-${cell.sgPos}-${row}-${col}`
                const isEditing = editingCell === cellKey
                return (
                  <div
                    key={`${row}-${col}`}
                    className="aspect-square rounded-lg flex items-center justify-center p-1 shadow cursor-pointer"
                    style={{ backgroundColor: color, opacity: 0.92 }}
                    onClick={() => setEditingCell(cellKey)}
                  >
                    {isEditing ? (
                      <input
                        ref={editRef}
                        value={sg?.title ?? ""}
                        onChange={(e) => updateSubgoalText(cell.sgPos, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { saveAll(); setEditingCell(null) } }}
                        onBlur={() => { saveAll(); setEditingCell(null) }}
                        className="w-full h-full bg-transparent text-white text-[9px] font-bold text-center outline-none placeholder-white/60"
                        placeholder="Sub-goal"
                      />
                    ) : (
                      <span className="text-white text-[9px] sm:text-[10px] font-bold text-center leading-tight line-clamp-3 px-0.5 select-none">
                        {sg?.title || <span className="opacity-40">Sub-goal {cell.sgPos + 1}</span>}
                      </span>
                    )}
                  </div>
                )
              }

              // ── Action cell ────────────────────────────────────────
              if (cell.kind === "action") {
                const sg = sgByPos[cell.sgPos]
                const color = sg?.color ?? "#818cf8"
                const a = actByKey[`${cell.sgPos}-${cell.actionPos}`]
                const cellKey = `act-${cell.sgPos}-${cell.actionPos}`
                const isEditing = editingCell === cellKey
                return (
                  <div
                    key={`${row}-${col}`}
                    className="aspect-square rounded-md flex flex-col items-center justify-center p-0.5 cursor-pointer group relative"
                    style={{ backgroundColor: color + "22", border: `1px solid ${color}44` }}
                    onClick={() => !isEditing && setEditingCell(cellKey)}
                  >
                    {isEditing ? (
                      <input
                        ref={editRef}
                        value={a?.text ?? ""}
                        onChange={(e) => updateActionText(cell.sgPos, cell.actionPos, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { saveAll(); setEditingCell(null) } }}
                        onBlur={() => { saveAll(); setEditingCell(null) }}
                        className="w-full bg-transparent text-[8px] text-center outline-none"
                        style={{ color }}
                        placeholder="Action"
                      />
                    ) : (
                      <>
                        {a?.completed ? (
                          <div
                            className="w-3 h-3 rounded-full flex items-center justify-center mb-0.5 flex-shrink-0"
                            style={{ backgroundColor: color }}
                            onClick={(e) => { e.stopPropagation(); if (a) toggleAction(a) }}
                          >
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5.5l2.5 2.5 4-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full border flex-shrink-0 mb-0.5 opacity-40 group-hover:opacity-80 transition-opacity"
                            style={{ borderColor: color }}
                            onClick={(e) => { e.stopPropagation(); if (a) toggleAction(a) }}
                          />
                        )}
                        <span
                          className="text-[7px] sm:text-[8px] text-center leading-tight line-clamp-2 select-none"
                          style={{ color, opacity: a?.text ? 0.85 : 0.3 }}
                        >
                          {a?.text || "…"}
                        </span>
                      </>
                    )}
                  </div>
                )
              }

              // ── Empty (shouldn't happen) ───────────────────────────
              return <div key={`${row}-${col}`} className="aspect-square rounded-sm bg-stone-100/40" />
            })
          )}
        </div>

        {saving && (
          <p className="text-xs text-stone-400 mt-2 text-right">Saving…</p>
        )}
      </div>

      {/* Right: progress panel */}
      <div className="xl:w-64 flex-shrink-0 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-stone-600 uppercase tracking-wider mb-1">Sub-goal Progress</h3>
        {subgoals.map((sg) => {
          const pct = progressOf(sg.position)
          return (
            <div key={sg.id} className="bg-white/80 rounded-xl p-3 shadow-sm border border-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sg.color }} />
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-stone-700 truncate">
                    {sg.title || `Sub-goal ${sg.position + 1}`}
                  </span>
                </div>
                <span className="text-[11px] font-bold ml-auto" style={{ color: sg.color }}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: sg.color }}
                />
              </div>
              {/* Color picker */}
              <div className="flex gap-1 mt-2 flex-wrap">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => { updateSubgoalColor(sg.position, c); saveAll() }}
                    className="w-3.5 h-3.5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: sg.color === c ? "#111" : "transparent" }}
                  />
                ))}
              </div>
            </div>
          )
        })}

        <div className="bg-white/80 rounded-xl p-3 shadow-sm border border-white mt-1">
          <div className="text-xs text-stone-500 mb-1">Overall completion</div>
          <div className="text-2xl font-bold text-stone-800">
            {actions.length ? Math.round((actions.filter((a) => a.completed).length / actions.length) * 100) : 0}%
          </div>
          <div className="text-xs text-stone-400 mt-0.5">
            {actions.filter((a) => a.completed).length} / {actions.length} actions done
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  career: "#818cf8",
  wealth: "#34d399",
  health: "#fb923c",
  personal: "#f472b6",
  life: "#38bdf8",
}

function MilestoneModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Milestone>
  onSave: (m: Omit<Milestone, "id">) => void
  onClose: () => void
}) {
  const [year, setYear] = useState(initial?.year ?? CURRENT_YEAR + 1)
  const [title, setTitle] = useState(initial?.title ?? "")
  const [desc, setDesc] = useState(initial?.description ?? "")
  const [cat, setCat] = useState(initial?.category ?? "life")
  const [color, setColor] = useState(initial?.color ?? "#818cf8")

  const handleCatChange = (c: string) => {
    setCat(c)
    setColor(CATEGORY_COLORS[c] ?? "#818cf8")
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-stone-800 mb-4">
          {initial?.id ? "Edit Milestone" : "Add Milestone"}
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-stone-500 mb-1 block">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-stone-500 mb-1 block">Category</label>
              <select
                value={cat}
                onChange={(e) => handleCatChange(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build SaaS that earns $5,000/mo"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">Description (optional)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="เขียนราวกับมันเกิดขึ้นแล้ว…"
              rows={3}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: color === c ? "#111" : "transparent" }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onSave({ year, title, description: desc, category: cat, color })}
            disabled={!title.trim()}
            className="flex-1 py-2 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-500 text-sm hover:text-stone-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function TimelineTab() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Milestone | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((data) => setMilestones(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  // Scroll to current year on load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-year="${CURRENT_YEAR}"]`)
      if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }
  }, [loading])

  const handleAdd = async (data: Omit<Milestone, "id">) => {
    const res = await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const created = await res.json()
    setMilestones((prev) => [...prev, created].sort((a, b) => a.year - b.year))
    setModalOpen(false)
  }

  const handleUpdate = async (data: Omit<Milestone, "id">) => {
    if (!editing) return
    const res = await fetch(`/api/timeline/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setMilestones((prev) => prev.map((m) => m.id === editing.id ? updated : m).sort((a, b) => a.year - b.year))
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/timeline/${id}`, { method: "DELETE" })
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    setEditing(null)
  }

  // Build year range for the timeline ruler
  const allYears = milestones.map((m) => m.year)
  const minYear = Math.min(CURRENT_YEAR - 1, ...allYears)
  const maxYear = Math.max(CURRENT_YEAR + 5, ...allYears)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  // Nearest upcoming milestone
  const upcoming = [...milestones].filter((m) => m.year >= CURRENT_YEAR).sort((a, b) => a.year - b.year)[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Loading Timeline…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Life Timeline</h2>
          <p className="text-sm text-stone-500 mt-0.5">คิดย้อนจากยอดเขา — กำหนดจุดหมาย แล้วแตกกลับมาหาวันนี้</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Milestone
        </button>
      </div>

      {/* Timeline ruler */}
      <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm overflow-hidden">
        <div ref={scrollRef} className="overflow-x-auto pb-4 pt-6 px-6">
          <div className="relative" style={{ minWidth: `${years.length * 80}px` }}>
            {/* Center line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-stone-200 -translate-y-1/2" />

            {/* Milestone cards */}
            {milestones.map((m, idx) => {
              const x = (m.year - minYear) / (maxYear - minYear)
              const isAbove = idx % 2 === 0
              return (
                <div
                  key={m.id}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${x * 100}%`, top: isAbove ? 0 : undefined, bottom: isAbove ? undefined : 0 }}
                >
                  {/* Connector line */}
                  <div
                    className="absolute left-1/2 w-0.5 -translate-x-1/2"
                    style={{
                      backgroundColor: m.color,
                      height: "20px",
                      top: isAbove ? "100%" : undefined,
                      bottom: isAbove ? undefined : "100%",
                    }}
                  />
                  <button
                    onClick={() => setEditing(m)}
                    className="relative w-36 text-left rounded-xl p-2.5 shadow-md border border-white/80 hover:scale-105 transition-transform"
                    style={{ backgroundColor: m.color + "18", borderColor: m.color + "44" }}
                  >
                    <div className="text-xs font-bold mb-0.5" style={{ color: m.color }}>
                      {m.year} · {m.category}
                    </div>
                    <div className="text-[12px] font-semibold text-stone-800 leading-tight line-clamp-2">
                      {m.title}
                    </div>
                  </button>
                </div>
              )
            })}

            {/* Year markers */}
            <div className="flex" style={{ height: "130px", alignItems: "center" }}>
              {years.map((y) => (
                <div
                  key={y}
                  data-year={y}
                  className="flex-shrink-0 flex flex-col items-center"
                  style={{ width: "80px" }}
                >
                  <div
                    className={`w-px h-3 ${y === CURRENT_YEAR ? "bg-rose-400" : "bg-stone-300"}`}
                  />
                  <span
                    className={`text-[11px] mt-1 font-medium ${
                      y === CURRENT_YEAR ? "text-rose-500 font-bold" : "text-stone-400"
                    }`}
                  >
                    {y}
                    {y === CURRENT_YEAR && (
                      <span className="ml-1 text-[9px] bg-rose-100 text-rose-500 px-1 rounded">NOW</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Backward Plan section */}
      {upcoming && (
        <div className="bg-white/80 rounded-2xl border border-white shadow-sm p-5">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
            Backward Plan — Next Milestone
          </div>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: upcoming.color }}
            >
              {upcoming.year}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-stone-800">{upcoming.title}</div>
              {upcoming.description && (
                <p className="text-sm text-stone-500 mt-1 leading-relaxed">{upcoming.description}</p>
              )}
              <div className="mt-3 flex gap-2 flex-wrap">
                {[
                  { label: "Years left", value: upcoming.year - CURRENT_YEAR },
                  { label: "Category", value: upcoming.category },
                ].map((stat) => (
                  <div key={stat.label} className="bg-stone-50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-stone-400">{stat.label}: </span>
                    <span className="font-semibold text-stone-700">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <div className="text-4xl mb-3">🗺️</div>
          <div className="text-sm font-medium">ยังไม่มี milestone</div>
          <div className="text-xs mt-1">กด "+ Add Milestone" เพื่อเริ่มจองอนาคตของคุณ</div>
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <MilestoneModal onSave={handleAdd} onClose={() => setModalOpen(false)} />
      )}
      {editing && (
        <MilestoneModal
          initial={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(null)}
        />
      )}
      {editing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => handleDelete(editing.id)}
            className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            Delete this milestone
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "mandala" | "timeline"

export default function RoutinePage() {
  const [tab, setTab] = useState<Tab>("mandala")

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: "linear-gradient(135deg, #f0f7f9 0%, #e8edf5 100%)" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-800 tracking-tight">Routine & Future Planning</h1>
          <p className="text-sm text-stone-500 mt-1">จองอนาคตด้วยสมุดโน้ตเล่มเดียว — Mandala Chart + Life Timeline</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/60 backdrop-blur-xl rounded-2xl p-1 border border-white shadow-sm w-fit">
          {([
            { key: "mandala", label: "Mandala Chart", icon: "⬡" },
            { key: "timeline", label: "Life Timeline", icon: "◈" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key
                  ? "bg-stone-800 text-white shadow-md"
                  : "text-stone-500 hover:text-stone-700 hover:bg-white/60"
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {tab === "mandala" && <MandalaTab />}
          {tab === "timeline" && <TimelineTab />}
        </div>
      </div>
    </div>
  )
}
