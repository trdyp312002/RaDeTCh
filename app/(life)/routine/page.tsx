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

// ─── Schedule Types & Constants ───────────────────────────────────────────────

type DayType = "weekday" | "saturday" | "sunday"
type BlockType = "sleep" | "exercise" | "prepare" | "commute" | "work" | "free" | "winddown" | "meal"
type TaskCat = "japanese" | "english" | "savings" | "other"

type ScheduleTask = {
  cat: TaskCat
  title: string
  titleEN: string
  duration: string
}

type ScheduleBlock = {
  id: string
  start: number
  end: number
  type: BlockType
  label: string
  desc?: string
  tasks?: ScheduleTask[]
}

const BLOCK_STYLE: Record<BlockType, { bg: string; border: string; text: string; icon: string }> = {
  sleep:    { bg: "bg-indigo-950/50",  border: "border-indigo-800/60",  text: "text-indigo-300",  icon: "💤" },
  exercise: { bg: "bg-emerald-950/50", border: "border-emerald-700/60", text: "text-emerald-300", icon: "🏃" },
  prepare:  { bg: "bg-stone-800/50",   border: "border-stone-600/60",   text: "text-stone-300",   icon: "🎒" },
  commute:  { bg: "bg-stone-700/40",   border: "border-stone-500/50",   text: "text-stone-400",   icon: "🚌" },
  work:     { bg: "bg-blue-950/50",    border: "border-blue-800/60",    text: "text-blue-300",    icon: "💼" },
  free:     { bg: "bg-violet-950/50",  border: "border-violet-600/60",  text: "text-violet-200",  icon: "⭐" },
  winddown: { bg: "bg-purple-950/50",  border: "border-purple-800/60",  text: "text-purple-300",  icon: "🌙" },
  meal:     { bg: "bg-teal-950/50",    border: "border-teal-800/60",    text: "text-teal-300",    icon: "🍚" },
}

const TASK_CAT_COLOR: Record<TaskCat, string> = {
  japanese: "#f472b6",
  english:  "#38bdf8",
  savings:  "#4ade80",
  other:    "#a78bfa",
}

const TASK_CAT_LABEL: Record<TaskCat, string> = {
  japanese: "🇯🇵 ภาษาญี่ปุ่น",
  english:  "🇬🇧 ภาษาอังกฤษ",
  savings:  "💰 การเงิน / ออม",
  other:    "📌 ทั่วไป",
}

function fmt(m: number): string {
  const h = Math.floor(m / 60) % 24
  const mm = m % 60
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

function durStr(start: number, end: number): string {
  const d = end - start
  if (d >= 60) {
    const h = Math.floor(d / 60)
    const m = d % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${d}m`
}

// ── Task library ──────────────────────────────────────────────────────────────

const T_ANKI:    ScheduleTask = { cat: "japanese", title: "Anki 単語復習", titleEN: "Vocab Flashcards", duration: "20m" }
const T_GRAM:    ScheduleTask = { cat: "japanese", title: "N3/N2 文法練習", titleEN: "Grammar Practice", duration: "40m" }
const T_SHADOW:  ScheduleTask = { cat: "japanese", title: "シャドーイング", titleEN: "Shadowing Practice", duration: "20m" }
const T_JPPOD:   ScheduleTask = { cat: "japanese", title: "日本語ポッドキャスト", titleEN: "Japanese Podcast", duration: "30m" }
const T_JPWRITE: ScheduleTask = { cat: "japanese", title: "日本語で日記を書く", titleEN: "Japanese Journal", duration: "15m" }
const T_JPREAD:  ScheduleTask = { cat: "japanese", title: "多読 (Japanese reading)", titleEN: "Extensive Reading JP", duration: "30m" }
const T_JPMOCK:  ScheduleTask = { cat: "japanese", title: "N3/N2 Mock Test 練習問題", titleEN: "Practice Test", duration: "60m" }

const T_ENVOC:   ScheduleTask = { cat: "english",  title: "English Vocabulary", titleEN: "Vocab Review", duration: "15m" }
const T_ENWRITE: ScheduleTask = { cat: "english",  title: "English Writing Practice", titleEN: "Essay / Journal", duration: "30m" }
const T_ENPOD:   ScheduleTask = { cat: "english",  title: "English Podcast / TED Talk", titleEN: "Listening Practice", duration: "25m" }
const T_ENSPEAK: ScheduleTask = { cat: "english",  title: "Speaking Output Practice", titleEN: "Speaking / Output", duration: "20m" }
const T_ENREAD:  ScheduleTask = { cat: "english",  title: "อ่านหนังสือ / บทความ EN", titleEN: "English Reading", duration: "30m" }

const T_EXPENSE: ScheduleTask = { cat: "savings",  title: "บันทึกค่าใช้จ่ายวันนี้", titleEN: "Log Daily Expenses", duration: "10m" }
const T_BUDGET:  ScheduleTask = { cat: "savings",  title: "ทบทวนงบประมาณสัปดาห์", titleEN: "Weekly Budget Review", duration: "20m" }
const T_INVEST:  ScheduleTask = { cat: "savings",  title: "วิจัยการลงทุน / ETF / หุ้น", titleEN: "Investment Research", duration: "30m" }
const T_FREAD:   ScheduleTask = { cat: "savings",  title: "อ่านหนังสือการเงิน", titleEN: "Read Finance Book", duration: "20m" }
const T_NWREVIEW:ScheduleTask = { cat: "savings",  title: "ตรวจสอบ Net Worth", titleEN: "Net Worth Check", duration: "15m" }

const T_PLAN:    ScheduleTask = { cat: "other",    title: "ทบทวนสัปดาห์ / วางแผน", titleEN: "Weekly Review & Plan", duration: "30m" }
const T_REFLECT: ScheduleTask = { cat: "other",    title: "ทบทวนวัน + เขียน goal", titleEN: "Daily Reflection", duration: "10m" }

// ── Schedules ─────────────────────────────────────────────────────────────────

const WEEKDAY: ScheduleBlock[] = [
  {
    id: "exercise", start: 360, end: 390, type: "exercise",
    label: "ออกกำลังกาย",
    desc: "วิ่ง / ออกกำลังกาย — ช่วยให้สมองตื่นตัวพร้อมทำงาน",
  },
  {
    id: "prepare", start: 390, end: 420, type: "prepare",
    label: "เตรียมตัว + ออกจากบ้าน 07:00",
    desc: "อาบน้ำ แต่งตัว เตรียมของ — ออกประตูไม่เกิน 07:00",
  },
  {
    id: "work", start: 480, end: 1140, type: "work",
    label: "ทำงาน (จ–ศ  08:00–19:00)",
    desc: "11 ชั่วโมง — เวลาที่เปลี่ยนแปลงไม่ได้ ใช้ให้คุ้มค่า",
  },
  {
    id: "commute", start: 1140, end: 1170, type: "commute",
    label: "เดินทางกลับบ้าน",
    desc: "ฟัง Japanese Podcast ระหว่างทางได้เลย 🎧",
    tasks: [T_JPPOD, T_ENPOD],
  },
  {
    id: "dinner", start: 1170, end: 1210, type: "meal",
    label: "อาหารเย็น + พักผ่อนเล็กน้อย",
    desc: "กิน พัก สั้น ๆ ก่อนเริ่ม session เย็น — ไม่เกิน 40 นาที",
  },
  {
    id: "free-eve", start: 1200, end: 1290, type: "free",
    label: "⭐ เวลาว่าง — Self-Development (20:00–21:30)",
    desc: "1.5h — เวลาที่มีค่าที่สุดของวัน ใช้ให้เต็มที่",
    tasks: [T_ANKI, T_GRAM, T_SHADOW, T_ENVOC, T_ENWRITE, T_EXPENSE, T_REFLECT],
  },
  {
    id: "winddown", start: 1290, end: 1320, type: "winddown",
    label: "เตรียมนอน + ทบทวนวัน (21:30–22:00)",
    desc: "วางโทรศัพท์ ไม่ดู social media เขียน reflection สั้น ๆ",
  },
  {
    id: "sleep", start: 1320, end: 1440, type: "sleep",
    label: "นอนหลับ 22:00",
    desc: "เป้าหมาย 8 ชั่วโมง → ตื่น 06:00",
  },
]

const SATURDAY: ScheduleBlock[] = [
  {
    id: "exercise", start: 360, end: 390, type: "exercise",
    label: "ออกกำลังกาย (วันเสาร์)",
    desc: "สามารถออกหนักกว่าวันธรรมดาได้ — มีเวลาพักหลังจากนี้",
  },
  {
    id: "breakfast", start: 390, end: 430, type: "meal",
    label: "อาหารเช้า + เตรียมวันเสาร์",
    desc: "กิน พักสั้น เตรียม study session เช้า",
  },
  {
    id: "deep-jp", start: 430, end: 720, type: "free",
    label: "⭐ Deep Focus: ภาษาญี่ปุ่น (07:10–12:00)",
    desc: "5 ชั่วโมง — ช่วงที่สมองสดที่สุด เน้น Japanese intensive",
    tasks: [T_GRAM, T_ANKI, T_SHADOW, T_JPREAD, T_JPWRITE, T_JPMOCK],
  },
  {
    id: "lunch", start: 720, end: 780, type: "meal",
    label: "พักกลางวัน 12:00–13:00",
    desc: "พัก recharge ก่อน session บ่าย",
  },
  {
    id: "afternoon", start: 780, end: 1020, type: "free",
    label: "⭐ ช่วงบ่าย: English + Financial (13:00–17:00)",
    desc: "4 ชั่วโมง — สลับ English skills กับ finance work",
    tasks: [T_ENWRITE, T_ENREAD, T_ENPOD, T_ENSPEAK, T_INVEST, T_BUDGET, T_FREAD],
  },
  {
    id: "rest", start: 1020, end: 1110, type: "meal",
    label: "พักผ่อน + กิจกรรมส่วนตัว (17:00–18:30)",
    desc: "เวลาอิสระ — ดูอนิเมะ เล่นเกม ออกไปข้างนอก",
  },
  {
    id: "review", start: 1110, end: 1200, type: "free",
    label: "⭐ Review สัปดาห์ + วางแผน (18:30–20:00)",
    desc: "ทบทวนความก้าวหน้า วางแผนสัปดาห์หน้า ตรวจสอบการเงิน",
    tasks: [T_PLAN, T_NWREVIEW, T_EXPENSE, T_BUDGET],
  },
  {
    id: "free-eve", start: 1200, end: 1290, type: "free",
    label: "⭐ ยามค่ำ — เสริม + ผ่อนคลาย (20:00–21:30)",
    desc: "1.5h เบา ๆ — ดูซีรีส์ญี่ปุ่น ฟัง podcast อ่าน",
    tasks: [T_ANKI, T_JPWRITE, T_ENVOC, T_FREAD, T_REFLECT],
  },
  {
    id: "winddown", start: 1290, end: 1320, type: "winddown",
    label: "เตรียมนอน (21:30–22:00)",
    desc: "Wind down routine — พร้อมสำหรับสัปดาห์ใหม่",
  },
  {
    id: "sleep", start: 1320, end: 1440, type: "sleep",
    label: "นอนหลับ 22:00",
    desc: "8 ชั่วโมง → ตื่น 06:00 พักผ่อนให้เต็มที่",
  },
]

const SUNDAY: ScheduleBlock[] = [
  {
    id: "exercise", start: 360, end: 390, type: "exercise",
    label: "ออกกำลังกาย (วันอาทิตย์)",
    desc: "เบา ๆ ได้ — ยืดเหยียด / เดินออกกำลังกาย",
  },
  {
    id: "breakfast", start: 390, end: 430, type: "meal",
    label: "อาหารเช้า + พักผ่อน",
    desc: "วันอาทิตย์เป็นวัน recharge — ไม่ต้องรีบ",
  },
  {
    id: "free-am", start: 430, end: 720, type: "free",
    label: "⭐ ช่วงเช้า: Japanese Study (07:10–12:00)",
    desc: "5 ชั่วโมง — ทบทวนสิ่งที่เรียนสัปดาห์นี้ ฝึก listening",
    tasks: [T_ANKI, T_JPPOD, T_SHADOW, T_JPREAD, T_GRAM],
  },
  {
    id: "lunch", start: 720, end: 810, type: "meal",
    label: "พักกลางวัน (12:00–13:30)",
    desc: "วันหยุด — พักนานหน่อยได้ ไปกินข้าวข้างนอก",
  },
  {
    id: "free-pm", start: 810, end: 1020, type: "free",
    label: "⭐ ช่วงบ่าย: English + Side Project (13:30–17:00)",
    desc: "3.5 ชั่วโมง — English focus + งาน side project / ทักษะใหม่",
    tasks: [T_ENSPEAK, T_ENWRITE, T_ENREAD, T_ENPOD, T_INVEST],
  },
  {
    id: "rest", start: 1020, end: 1110, type: "meal",
    label: "พักผ่อน / เวลาครอบครัว (17:00–18:30)",
    desc: "เวลาส่วนตัว ครอบครัว หรือทำสิ่งที่ชอบ",
  },
  {
    id: "prep-week", start: 1110, end: 1200, type: "free",
    label: "⭐ เตรียมสัปดาห์ใหม่ (18:30–20:00)",
    desc: "วางแผน ทบทวน goals ตั้ง intention สำหรับจันทร์",
    tasks: [T_PLAN, T_NWREVIEW, T_BUDGET, T_REFLECT],
  },
  {
    id: "free-eve", start: 1200, end: 1290, type: "free",
    label: "⭐ ยามค่ำ — ผ่อนคลาย (20:00–21:30)",
    desc: "1.5h อ่านหนังสือ ดูอนิเมะ ฟัง podcast เบา ๆ",
    tasks: [T_ANKI, T_JPWRITE, T_FREAD, T_ENVOC],
  },
  {
    id: "winddown", start: 1290, end: 1320, type: "winddown",
    label: "เตรียมนอน + mindset จันทร์ (21:30–22:00)",
    desc: "เตรียม outfit เตรียม bag ทบทวน goal ของสัปดาห์",
  },
  {
    id: "sleep", start: 1320, end: 1440, type: "sleep",
    label: "นอนหลับ 22:00",
    desc: "8 ชั่วโมง — พร้อมลุยสัปดาห์ใหม่ 💪",
  },
]

// ─── Mandala layout helpers ───────────────────────────────────────────────────

const SG_POS: [number, number][] = [
  [3, 3], [3, 4], [3, 5],
  [4, 3], [4, 5],
  [5, 3], [5, 4], [5, 5],
]

const OUTER_BLOCK_ORIGIN: [number, number][] = [
  [0, 0], [0, 3], [0, 6],
  [3, 0], [3, 6],
  [6, 0], [6, 3], [6, 6],
]

function outerCenter(p: number): [number, number] {
  const [or, oc] = OUTER_BLOCK_ORIGIN[p]
  return [or + 1, oc + 1]
}

function actionCells(p: number): [number, number][] {
  const [or, oc] = OUTER_BLOCK_ORIGIN[p]
  return [
    [or, oc], [or, oc + 1], [or, oc + 2],
    [or + 1, oc], [or + 1, oc + 2],
    [or + 2, oc], [or + 2, oc + 1], [or + 2, oc + 2],
  ]
}

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
      <div className="flex-1 min-w-0">
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

              return <div key={`${row}-${col}`} className="aspect-square rounded-sm bg-stone-100/40" />
            })
          )}
        </div>

        {saving && (
          <p className="text-xs text-stone-400 mt-2 text-right">Saving…</p>
        )}
      </div>

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

  const allYears = milestones.map((m) => m.year)
  const minYear = Math.min(CURRENT_YEAR - 1, ...allYears)
  const maxYear = Math.max(CURRENT_YEAR + 5, ...allYears)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

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

      <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm overflow-hidden">
        <div ref={scrollRef} className="overflow-x-auto pb-4 pt-6 px-6">
          <div className="relative" style={{ minWidth: `${years.length * 80}px` }}>
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-stone-200 -translate-y-1/2" />

            {milestones.map((m, idx) => {
              const x = (m.year - minYear) / (maxYear - minYear)
              const isAbove = idx % 2 === 0
              return (
                <div
                  key={m.id}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${x * 100}%`, top: isAbove ? 0 : undefined, bottom: isAbove ? undefined : 0 }}
                >
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
          <div className="text-xs mt-1">กด &quot;+ Add Milestone&quot; เพื่อเริ่มจองอนาคตของคุณ</div>
        </div>
      )}

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

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab() {
  const now = new Date()
  const dow = now.getDay()
  const defaultDay: DayType = dow === 6 ? "saturday" : dow === 0 ? "sunday" : "weekday"

  const [dayType, setDayType] = useState<DayType>(defaultDay)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["free-eve", "deep-jp", "free-am"]))

  const schedule = dayType === "weekday" ? WEEKDAY : dayType === "saturday" ? SATURDAY : SUNDAY
  const freeBlocks = schedule.filter((b) => b.type === "free")
  const totalFreeMin = freeBlocks.reduce((s, b) => s + b.end - b.start, 0)
  const currentMin = now.getHours() * 60 + now.getMinutes()

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const tasksByCat = (cat: TaskCat) =>
    freeBlocks.flatMap((b) => b.tasks ?? []).filter((t) => t.cat === cat)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Timeline */}
      <div className="flex-1 min-w-0">
        {/* Day selector */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(["weekday", "saturday", "sunday"] as DayType[]).map((d) => (
            <button
              key={d}
              onClick={() => setDayType(d)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                dayType === d
                  ? "bg-stone-800 text-white shadow-md"
                  : "bg-white/70 text-stone-500 hover:bg-white hover:text-stone-700 border border-white"
              }`}
            >
              {d === "weekday" ? "จ–ศ 💼" : d === "saturday" ? "เสาร์ 🌅" : "อาทิตย์ 🏖️"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-stone-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            NOW = {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
          </div>
        </div>

        {/* Sleep banner */}
        <div className="mb-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center gap-3">
          <span className="text-lg">💤</span>
          <div>
            <span className="font-semibold">นอนหลับ</span> 22:00 → ตื่น 06:00
            <span className="ml-1 font-bold text-indigo-200">(8 ชั่วโมง)</span>
            <span className="ml-3 text-indigo-400">· เตรียมนอน 21:30</span>
          </div>
        </div>

        {/* Blocks */}
        <div className="flex flex-col gap-2">
          {schedule.map((block) => {
            const style = BLOCK_STYLE[block.type]
            const isNow = dayType === defaultDay && currentMin >= block.start && currentMin < block.end
            const isFree = block.type === "free"
            const isExp = expanded.has(block.id)
            const hasCommuteTask = block.type === "commute" && block.tasks && block.tasks.length > 0

            return (
              <div
                key={block.id}
                className={`rounded-xl border ${style.bg} ${style.border} overflow-hidden transition-all ${
                  isNow ? "ring-2 ring-yellow-400/70 shadow-lg shadow-yellow-400/10" : ""
                }`}
              >
                <div
                  className={`flex items-start gap-3 px-4 py-3 ${isFree || hasCommuteTask ? "cursor-pointer select-none" : ""}`}
                  onClick={isFree || hasCommuteTask ? () => toggle(block.id) : undefined}
                >
                  <span className="text-base w-6 text-center flex-shrink-0 mt-0.5">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${style.text}`}>
                      {block.label}
                      {isNow && (
                        <span className="ml-2 text-[10px] bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          ● NOW
                        </span>
                      )}
                    </div>
                    {block.desc && (
                      <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{block.desc}</div>
                    )}
                    <div className="text-[11px] text-stone-600 mt-1">
                      {fmt(block.start)} – {fmt(block.end)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-stone-500 bg-stone-800/40 rounded-full px-2 py-0.5">
                      {durStr(block.start, block.end)}
                    </span>
                    {(isFree || hasCommuteTask) && (
                      <span className="text-stone-400 text-xs">{isExp ? "▲" : "▼"}</span>
                    )}
                  </div>
                </div>

                {/* Task list */}
                {(isFree || hasCommuteTask) && isExp && block.tasks && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/10">
                    <div className="text-[10px] text-stone-400 mb-2 font-semibold uppercase tracking-wider">
                      กิจกรรมแนะนำ
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {block.tasks.map((t, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: TASK_CAT_COLOR[t.cat] }}
                          />
                          <span className="text-xs text-stone-300 flex-1">{t.title}</span>
                          <span
                            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                            style={{ backgroundColor: TASK_CAT_COLOR[t.cat] + "22", color: TASK_CAT_COLOR[t.cat] }}
                          >
                            {t.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-72 flex-shrink-0 flex flex-col gap-4">
        {/* Free time total */}
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-white">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">เวลาว่างวันนี้</div>
          <div className="text-3xl font-black text-stone-800">
            {Math.floor(totalFreeMin / 60)}h{totalFreeMin % 60 > 0 ? ` ${totalFreeMin % 60}m` : ""}
          </div>
          <div className="text-xs text-stone-500 mt-1">จาก {freeBlocks.length} ช่วงเวลา</div>
          {dayType === "weekday" && (
            <div className="mt-2 text-xs text-stone-400">เวลาว่างทั้งสัปดาห์ ~<strong className="text-stone-600">30h</strong></div>
          )}
        </div>

        {/* Per category */}
        {(["japanese", "english", "savings"] as TaskCat[]).map((cat) => {
          const tasks = tasksByCat(cat)
          if (tasks.length === 0) return null
          const totalMin = tasks.reduce((s, t) => {
            const n = parseInt(t.duration)
            return s + (isNaN(n) ? 0 : n)
          }, 0)
          return (
            <div key={cat} className="bg-white/80 rounded-2xl p-4 shadow-sm border border-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TASK_CAT_COLOR[cat] }} />
                <div className="text-xs font-bold text-stone-700">{TASK_CAT_LABEL[cat]}</div>
                {totalMin > 0 && (
                  <span className="ml-auto text-xs font-bold" style={{ color: TASK_CAT_COLOR[cat] }}>
                    {totalMin}m
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {tasks.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-stone-600 leading-tight">{t.title}</span>
                    <span className="text-[10px] text-stone-400 flex-shrink-0">{t.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Weekly overview */}
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-white">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">เวลาว่าง / สัปดาห์</div>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">จ–ศ (5 วัน)</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full bg-violet-400 rounded-full" style={{ width: "28%" }} />
                </div>
                <span className="font-bold text-violet-600 w-10 text-right">~7.5h</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">เสาร์</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full bg-violet-400 rounded-full" style={{ width: "70%" }} />
                </div>
                <span className="font-bold text-violet-600 w-10 text-right">~11.8h</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">อาทิตย์</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full bg-violet-400 rounded-full" style={{ width: "67%" }} />
                </div>
                <span className="font-bold text-violet-600 w-10 text-right">~11.3h</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="font-bold text-stone-700">รวม</span>
              <span className="font-black text-stone-800">~30.6h / week</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-white">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Legend</div>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(BLOCK_STYLE) as [BlockType, typeof BLOCK_STYLE[BlockType]][])
              .filter(([k]) => k !== "sleep" && k !== "commute")
              .map(([type, s]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-xs text-stone-500 capitalize">{type}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Secretary Tab ────────────────────────────────────────────────────────────

type ChatMsg = { role: "user" | "assistant"; content: string; ts: string }

function SecretaryTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [discordStatus, setDiscordStatus] = useState<"" | "ok" | "err" | "nokey">("")
  const [discordPreview, setDiscordPreview] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const nowStr = () =>
    new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const dow = now.getDay()
    const greeting =
      hour < 7 ? "おはようございます！ 🌅" :
      hour < 12 ? "สวัสดีตอนเช้า！ おはよう！ 🌤️" :
      hour < 17 ? "สวัสดีตอนบ่าย！ こんにちは！ ☀️" :
      "สวัสดีตอนเย็น！ こんばんは！ 🌆"
    const dayContext = dow === 0 || dow === 6
      ? "วันนี้เป็นวันหยุด มีเวลาเยอะมาก!"
      : "วันนี้เป็นวันทำงาน เตรียมพร้อมใช้เวลาว่างยามเย็นให้คุ้มค่า"
    callSecretary(`${greeting} ${dayContext} ช่วยสรุปแผนและแนะนำสิ่งที่ควรทำวันนี้ให้หน่อยนะ`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const callSecretary = async (text: string, silent = false) => {
    if (!text.trim() || loading) return
    if (!silent) {
      setMessages((p) => [...p, { role: "user", content: text, ts: nowStr() }])
    }
    setInput("")
    setLoading(true)
    try {
      const r = await fetch("/api/life-secretary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const d = await r.json()
      setMessages((p) => [
        ...p,
        { role: "assistant", content: d.message ?? d.error ?? "ไม่มีคำตอบ", ts: nowStr() },
      ])
    } catch {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "❌ ไม่สามารถเชื่อมต่อได้", ts: nowStr() },
      ])
    }
    setLoading(false)
  }

  const sendDiscord = async () => {
    setDiscordLoading(true)
    setDiscordStatus("")
    setDiscordPreview("")
    try {
      const r = await fetch("/api/life-secretary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discord" }),
      })
      const d = await r.json()
      setDiscordPreview(d.preview ?? "")
      if (d.ok) {
        setDiscordStatus("ok")
        setMessages((p) => [
          ...p,
          { role: "assistant", content: "✅ ส่งแจ้งเตือน Discord แล้ว! ตรวจสอบ channel ของคุณได้เลย 📣", ts: nowStr() },
        ])
      } else {
        setDiscordStatus("nokey")
      }
    } catch {
      setDiscordStatus("err")
    }
    setDiscordLoading(false)
    setTimeout(() => setDiscordStatus(""), 4000)
  }

  const QUICK = [
    "📅 วางแผนสัปดาห์นี้ให้หน่อย",
    "🇯🇵 ควรเรียนภาษาญี่ปุ่นอะไรวันนี้?",
    "💰 แนะนำการประหยัดเงินและลงทุน",
    "⏰ สร้าง evening routine 2.5 ชั่วโมงให้หน่อย",
    "💪 ช่วยให้กำลังใจ + คำคมญี่ปุ่น",
    "🗒️ สรุปสิ่งที่ควรทำในช่วง weekend",
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-stone-800 text-white text-sm flex items-center justify-center font-bold">W</span>
            WhyMan
          </h2>
          <p className="text-xs text-stone-400 mt-0.5 ml-10">
            Personal Life Secretary · 🇯🇵 ญี่ปุ่น · 🇬🇧 อังกฤษ · 💰 การเงิน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendDiscord}
            disabled={discordLoading}
            title="ส่ง daily briefing ไป Discord"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              discordStatus === "ok"
                ? "bg-emerald-500 text-white"
                : discordStatus === "err" || discordStatus === "nokey"
                ? "bg-red-500 text-white"
                : "bg-[#5865F2] text-white hover:bg-[#4752c4]"
            }`}
          >
            {discordLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                กำลังส่ง…
              </>
            ) : discordStatus === "ok" ? (
              "✅ ส่งแล้ว!"
            ) : discordStatus === "nokey" ? (
              "⚠️ ตั้งค่า Webhook"
            ) : (
              <><span>📣</span> Discord</>
            )}
          </button>
        </div>
      </div>

      {/* Discord no-key warning */}
      {discordStatus === "nokey" && discordPreview && (
        <div className="mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-xs text-amber-300">
          <div className="font-bold mb-1">⚠️ ยังไม่ได้ตั้งค่า DISCORD_WEBHOOK_URL (WhyMan preview)</div>
          <div className="text-amber-400 mb-1">เพิ่มใน .env.local แล้ว restart server — ตัวอย่างข้อความที่จะส่ง:</div>
          <pre className="whitespace-pre-wrap text-[10px] text-amber-200 mt-1 max-h-24 overflow-y-auto leading-relaxed">
            {discordPreview.slice(0, 300)}…
          </pre>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
        {QUICK.map((a, i) => (
          <button
            key={i}
            onClick={() => callSecretary(a)}
            disabled={loading}
            className="flex-shrink-0 px-3 py-1.5 bg-white/70 border border-stone-200 text-stone-600 text-xs rounded-full hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-40"
          >
            {a}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-stone-400 text-sm">
            <div className="text-center">
              <div className="text-3xl mb-2 font-black">W</div>
              <div>กำลังโหลด briefing แรก…</div>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 font-bold">
                W
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-stone-800 text-white rounded-tr-sm"
                  : "bg-white border border-stone-100 shadow-sm text-stone-700 rounded-tl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              <div className="text-[10px] mt-1.5 opacity-50">{m.ts}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 font-bold">
              W
            </div>
            <div className="bg-white border border-stone-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              callSecretary(input)
            }
          }}
          placeholder="สั่งงาน WhyMan… (Enter ส่ง)"
          className="flex-1 bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-stone-400"
        />
        <button
          onClick={() => callSecretary(input)}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-stone-800 text-white rounded-2xl hover:bg-stone-700 disabled:opacity-40 transition-colors text-sm font-semibold"
        >
          ส่ง
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "mandala" | "timeline" | "schedule" | "secretary"

export default function RoutinePage() {
  const [tab, setTab] = useState<Tab>("schedule")

  const TABS = [
    { key: "schedule" as Tab,   label: "Daily Schedule", icon: "📅" },
    { key: "secretary" as Tab,  label: "WhyMan AI",       icon: "🤖" },
    { key: "mandala" as Tab,    label: "Mandala Chart",  icon: "⬡"  },
    { key: "timeline" as Tab,   label: "Life Timeline",  icon: "◈"  },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: "linear-gradient(135deg, #f0f7f9 0%, #e8edf5 100%)" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-stone-800 tracking-tight">
            Routine & Future Planning
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            จัดการชีวิตกับ WhyMan AI — Schedule · AI Secretary · Mandala · Timeline
          </p>
          <div className="flex gap-3 mt-3 flex-wrap">
            {[
              { label: "🇯🇵 ภาษาญี่ปุ่น", color: "bg-pink-100 text-pink-700" },
              { label: "🇬🇧 ภาษาอังกฤษ", color: "bg-sky-100 text-sky-700" },
              { label: "💰 ออมเงิน / ลงทุน", color: "bg-emerald-100 text-emerald-700" },
            ].map((g) => (
              <span key={g.label} className={`text-xs font-semibold px-3 py-1 rounded-full ${g.color}`}>
                {g.label}
              </span>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/60 backdrop-blur-xl rounded-2xl p-1 border border-white shadow-sm w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
          {tab === "schedule"   && <ScheduleTab />}
          {tab === "secretary"  && <SecretaryTab />}
          {tab === "mandala"    && <MandalaTab />}
          {tab === "timeline"   && <TimelineTab />}
        </div>
      </div>
    </div>
  )
}
