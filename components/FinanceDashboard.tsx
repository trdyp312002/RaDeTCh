"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { Plus, Trash2, Check, Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, BarChart2, ChevronDown, ChevronUp } from "lucide-react"
import MarketTicker from "./MarketTicker"
import MarketCard from "./MarketCard"
import PortfolioTab, { type PortfolioType } from "./PortfolioTab"

// ─── Types ────────────────────────────────────────────────────────────────────

type DBFinanceItem = {
  id: string
  category: "cash" | "other_asset" | "bond" | "liability"
  label: string
  amount: number
  currency: string
}

type DBMonthlyItem = {
  id: string
  type: "income_fixed" | "income_variable" | "expense_fixed" | "expense_variable"
  label: string
  amount: number
  currency: string
}

type HoldingForChart = {
  id: string
  symbol: string
  quantity: number
  totalCost: number
  transactions: { date: string; type: "BUY" | "SELL"; quantity: number }[]
}

type QuoteForChart = {
  currentPrice: number
  previousClose: number
  history: { isoDate?: string; price: number }[]
}

type Snapshot = { date: string; net_worth: number; total_assets: number; total_liabilities: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#6366f1", "#14b8a6", "#10b981", "#a855f7", "#f59e0b", "#06b6d4", "#f43f5e", "#8b5cf6"]

const PORTFOLIO_KEYS: PortfolioType[] = ["retirement", "long_term", "short_term"]

const PORTFOLIO_META: Record<PortfolioType, { label: string; color: string; lineColor: string; accent: string }> = {
  retirement: { label: "Retirement",  color: "text-indigo-600", lineColor: "#6366f1", accent: "border-indigo-200" },
  long_term:  { label: "Long-term",   color: "text-teal-600",   lineColor: "#14b8a6", accent: "border-teal-200"   },
  short_term: { label: "Short-term",  color: "text-amber-600",  lineColor: "#f59e0b", accent: "border-amber-200"  },
}

const MARKET_CARDS = [
  { symbol: "BTC-USD",    name: "Bitcoin",       accent: "amber"   },
  { symbol: "GC=F",       name: "Gold",          accent: "orange"  },
  { symbol: "^GSPC",      name: "S&P 500",       accent: "emerald" },
  { symbol: "^IXIC",      name: "NASDAQ",        accent: "teal"    },
  { symbol: "^N225",      name: "Nikkei 225",    accent: "rose"    },
  { symbol: "^SET.BK",    name: "SET Index",     accent: "violet"  },
  { symbol: "SET50.BK",   name: "SET 50",        accent: "violet"  },
  { symbol: "^KS11",      name: "KOSPI",         accent: "sky"     },
  { symbol: "^TWII",      name: "Taiwan",        accent: "indigo"  },
  { symbol: "^STOXX50E",  name: "Euro Stoxx 50", accent: "emerald" },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SaveIndicator({ state }: { state?: "saving" | "saved" | "error" }) {
  if (!state) return null
  if (state === "saving") return <Loader2 size={12} className="animate-spin text-stone-500" />
  if (state === "saved")  return <Check    size={12} className="text-emerald-600" />
  return <AlertCircle size={12} className="text-red-400" />
}

function KpiCard({ label, value, sub, icon, negative, colorClass }: {
  label: string; value: string; sub: string; icon: React.ReactNode; negative?: boolean; colorClass?: string
}) {
  return (
    <div className={`border border-stone-100 shadow-xl shadow-stone-200/50 rounded-3xl p-5 flex flex-col gap-2 ${colorClass || "bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-600/80">{label}</span>
        {icon}
      </div>
      <span className={`text-2xl font-black tracking-tight mt-1 ${negative && !colorClass ? "text-rose-500" : "text-stone-800"}`}>{value}</span>
      <span className="text-xs font-medium text-stone-600 truncate">{sub}</span>
    </div>
  )
}

// ─── Editable Row ─────────────────────────────────────────────────────────────

function EditableRow({
  id, label, amount, currency, saveState, displayCurrency, convertAmount,
  onUpdateLabel, onUpdateAmount, onDelete,
}: {
  id: string; label: string; amount: number; currency: string
  saveState?: "saving" | "saved" | "error"
  displayCurrency: "THB" | "USD"
  convertAmount: (a: number, from: string, to: string) => number
  onUpdateLabel: (id: string, v: string) => void
  onUpdateAmount: (id: string, v: string) => void
  onDelete: (id: string) => void
}) {
  const [editLabel,   setEditLabel]   = useState(label)
  const [editAmount,  setEditAmount]  = useState(String(amount))
  const [editingAmt,  setEditingAmt]  = useState(false)

  // Sync with parent state changes (e.g. after save from another session)
  useEffect(() => { setEditLabel(label) }, [label])
  useEffect(() => { if (!editingAmt) setEditAmount(String(amount)) }, [amount, editingAmt])

  const displayAmt = convertAmount(amount, currency, displayCurrency)
  const prefix = displayCurrency === "THB" ? "฿" : "$"

  return (
    <div className="flex items-center gap-2 group py-1.5 border-b border-stone-100 last:border-0">
      <input
        className="flex-1 bg-transparent text-sm text-stone-600 outline-none focus:text-stone-800 min-w-0"
        value={editLabel} onChange={e => setEditLabel(e.target.value)}
        onBlur={() => { if (editLabel !== label) onUpdateLabel(id, editLabel) }}
        onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
      />
      <div className="flex items-center gap-1 shrink-0">
        {editingAmt ? (
          <input autoFocus
            className="w-28 bg-stone-100 rounded px-2 py-0.5 text-right text-sm font-mono text-stone-800 outline-none focus:ring-1 focus:ring-indigo-500"
            value={editAmount} onChange={e => setEditAmount(e.target.value)}
            onBlur={() => { setEditingAmt(false); if (editAmount !== String(amount)) onUpdateAmount(id, editAmount) }}
            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
          />
        ) : (
          <button onClick={() => setEditingAmt(true)}
            className="w-28 text-right text-sm font-mono text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded px-2 py-0.5 transition-colors">
            {prefix}{displayAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </button>
        )}
        <SaveIndicator state={saveState} />
        <button onClick={() => onDelete(id)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-400 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Finance / Monthly Sections ───────────────────────────────────────────────

function FinanceSection({ title, items, category, savingState, displayCurrency, convertAmount,
  onUpdateLabel, onUpdateAmount, onDelete, onAdd, accentColor = "text-stone-500" }: {
  title: string; items: DBFinanceItem[]; category: DBFinanceItem["category"]
  savingState: Record<string, "saving" | "saved" | "error">
  displayCurrency: "THB" | "USD"; convertAmount: (a: number, from: string, to: string) => number
  onUpdateLabel: (id: string, v: string) => void; onUpdateAmount: (id: string, v: string) => void
  onDelete: (id: string) => void; onAdd: (cat: DBFinanceItem["category"], l: string, a: number) => void
  accentColor?: string
}) {
  const total = items.reduce((s, i) => s + convertAmount(i.amount, i.currency, displayCurrency), 0)
  const prefix = displayCurrency === "THB" ? "฿" : "$"
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accentColor}`}>{title}</span>
        <span className="text-xs font-mono text-stone-500">
          {prefix}{total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      {items.map(item => (
        <EditableRow key={item.id} {...item} saveState={savingState[item.id]}
          displayCurrency={displayCurrency} convertAmount={convertAmount}
          onUpdateLabel={onUpdateLabel} onUpdateAmount={onUpdateAmount} onDelete={onDelete} />
      ))}
      <button onClick={() => onAdd(category, "New item", 0)}
        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-500 transition-colors mt-1 w-fit">
        <Plus size={11} /> Add row
      </button>
    </div>
  )
}

function MonthlyRow({ item, savingState, displayCurrency, convertAmount, onUpdateLabel, onUpdateAmount, onDelete }: {
  item: DBMonthlyItem
  savingState: Record<string, "saving" | "saved" | "error">
  displayCurrency: "THB" | "USD"
  convertAmount: (a: number, from: string, to: string) => number
  onUpdateLabel: (id: string, v: string) => void
  onUpdateAmount: (id: string, v: string) => void
  onDelete: (id: string) => void
}) {
  const [editLabel,  setEditLabel]  = useState(item.label)
  const [editAmount, setEditAmount] = useState(String(item.amount))
  const [editingAmt, setEditingAmt] = useState(false)

  // Sync with parent state changes
  useEffect(() => { setEditLabel(item.label) }, [item.label])
  useEffect(() => { if (!editingAmt) setEditAmount(String(item.amount)) }, [item.amount, editingAmt])

  const displayAmt = convertAmount(item.amount, item.currency, displayCurrency)
  const prefix = displayCurrency === "THB" ? "฿" : "$"

  return (
    <div className="flex items-center gap-2 group py-1.5 border-b border-stone-100 last:border-0">
      <input className="flex-1 bg-transparent text-sm text-stone-600 outline-none focus:text-stone-800 min-w-0"
        value={editLabel} onChange={e => setEditLabel(e.target.value)}
        onBlur={() => { if (editLabel !== item.label) onUpdateLabel(item.id, editLabel) }}
        onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }} />
      <div className="flex items-center gap-1 shrink-0">
        {editingAmt ? (
          <input autoFocus
            className="w-28 bg-stone-100 rounded px-2 py-0.5 text-right text-sm font-mono text-stone-800 outline-none focus:ring-1 focus:ring-indigo-500"
            value={editAmount} onChange={e => setEditAmount(e.target.value)}
            onBlur={() => { setEditingAmt(false); if (editAmount !== String(item.amount)) onUpdateAmount(item.id, editAmount) }}
            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }} />
        ) : (
          <button onClick={() => setEditingAmt(true)}
            className="w-28 text-right text-sm font-mono text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded px-2 py-0.5 transition-colors">
            {prefix}{displayAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </button>
        )}
        <SaveIndicator state={savingState[item.id]} />
        <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-400 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function MonthlySection({ title, type, items, savingState, displayCurrency, convertAmount,
  onUpdateLabel, onUpdateAmount, onDelete, onAdd, accentColor = "text-stone-500" }: {
  title: string; type: DBMonthlyItem["type"]; items: DBMonthlyItem[]
  savingState: Record<string, "saving" | "saved" | "error">
  displayCurrency: "THB" | "USD"; convertAmount: (a: number, from: string, to: string) => number
  onUpdateLabel: (id: string, v: string) => void; onUpdateAmount: (id: string, v: string) => void
  onDelete: (id: string) => void; onAdd: (t: DBMonthlyItem["type"], l: string, a: number) => void
  accentColor?: string
}) {
  const total = items.reduce((s, i) => s + convertAmount(i.amount, i.currency, displayCurrency), 0)
  const prefix = displayCurrency === "THB" ? "฿" : "$"
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accentColor}`}>{title}</span>
        <span className="text-xs font-mono text-stone-500">
          {prefix}{total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      {items.map(item => (
        <MonthlyRow key={item.id} item={item} savingState={savingState}
          displayCurrency={displayCurrency} convertAmount={convertAmount}
          onUpdateLabel={onUpdateLabel} onUpdateAmount={onUpdateAmount} onDelete={onDelete} />
      ))}
      <button onClick={() => onAdd(type, "New item", 0)}
        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-500 transition-colors mt-1 w-fit">
        <Plus size={11} /> Add row
      </button>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function FinanceDashboard() {
  // ── Balance Sheet state ──
  const [dbFinanceItems,  setDbFinanceItems]  = useState<DBFinanceItem[]>([])
  const [dbMonthlyItems,  setDbMonthlyItems]  = useState<DBMonthlyItem[]>([])
  const [savingState,     setSavingState]     = useState<Record<string, "saving" | "saved" | "error">>({})
  const [fxRates,         setFxRates]         = useState<Record<string, number>>({ THB: 35.5 })
  const [displayCurrency, setDisplayCurrency] = useState<"THB" | "USD">("THB")
  const [loading,         setLoading]         = useState(true)
  const [networthHistory, setNetworthHistory] = useState<Snapshot[]>([])
  const [toast,           setToast]           = useState<{ msg: string; ok: boolean } | null>(null)
  const savedTodayRef = useRef(false)

  // ── Portfolio section ──
  const [activeTab, setActiveTab] = useState<PortfolioType>("retirement")
  const [showBalanceSheet, setShowBalanceSheet] = useState(false)

  // ── Combined portfolio chart data ──
  const [portHoldings, setPortHoldings] = useState<Record<PortfolioType, HoldingForChart[]>>({
    retirement: [], long_term: [], short_term: []
  })
  const [portQuotes, setPortQuotes] = useState<Record<string, QuoteForChart>>({})
  const [portLoading, setPortLoading] = useState(true)

  // ── Fetch balance sheet ──
  useEffect(() => {
    Promise.all([
      fetch("/api/finance").then(r => r.json()),
      fetch("/api/monthly").then(r => r.json()),
      fetch("/api/fx").then(r => r.json()),
      fetch("/api/networth").then(r => r.json()),
    ]).then(([finance, monthly, fx, history]) => {
      if (Array.isArray(finance))  setDbFinanceItems(finance)
      if (Array.isArray(monthly))  setDbMonthlyItems(monthly)
      if (fx?.rates)               setFxRates(fx.rates)
      if (Array.isArray(history))  setNetworthHistory(history)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // ── Fetch portfolio data for combined chart ──
  useEffect(() => {
    setPortLoading(true)
    Promise.all(
      PORTFOLIO_KEYS.map(k => fetch(`/api/holdings?portfolio=${k}`).then(r => r.json()))
    ).then(([ret, lt, st]) => {
      const byPort = { retirement: ret as HoldingForChart[], long_term: lt as HoldingForChart[], short_term: st as HoldingForChart[] }
      setPortHoldings(byPort)

      const allHoldings = [...ret, ...lt, ...st] as HoldingForChart[]
      const symbols = [...new Set(allHoldings.map(h => h.symbol))].filter(Boolean)
      if (symbols.length === 0) { setPortLoading(false); return }

      fetch(`/api/market?symbols=${symbols.join(",")}&range=1y`)
        .then(r => r.json())
        .then(q => setPortQuotes(q))
        .catch(console.error)
        .finally(() => setPortLoading(false))
    }).catch(() => setPortLoading(false))
  }, [])

  // ── Auto-save today's networth snapshot ──
  const convertAmount = useCallback((amount: number, from: string, to: string): number => {
    if (from === to) return amount
    const thbRate = fxRates.THB || 35.5
    const usd = from === "THB" ? amount / thbRate : amount
    return to === "USD" ? usd : usd * thbRate
  }, [fxRates])

  useEffect(() => {
    if (loading || savedTodayRef.current || !dbFinanceItems.length) return
    savedTodayRef.current = true
    const sumTHB = (cats: string[]) =>
      dbFinanceItems.filter(i => cats.includes(i.category))
        .reduce((acc, i) => acc + convertAmount(i.amount, i.currency, "THB"), 0)
    const ta = sumTHB(["cash", "other_asset", "bond"])
    const tl = 0
    const nw = ta
    const today = new Date().toISOString().split("T")[0]
    fetch("/api/networth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, net_worth: nw, total_assets: ta, total_liabilities: tl }),
    }).then(r => r.json()).then(snap => {
      if (snap?.date) {
        setNetworthHistory(prev => {
          const rest = prev.filter(s => s.date !== snap.date)
          return [...rest, snap].sort((a, b) => a.date.localeCompare(b.date))
        })
      }
    }).catch(console.error)
  }, [loading, dbFinanceItems, convertAmount])

  // ── Combined Portfolio Chart ──
  const combinedChartData = useMemo(() => {
    if (Object.values(portHoldings).every(h => h.length === 0)) return []

    const symbolPrices: Record<string, { isoDate: string; price: number }[]> = {}
    for (const [sym, q] of Object.entries(portQuotes)) {
      const pts = (q.history ?? []).filter(h => h.isoDate).map(h => ({ isoDate: h.isoDate!, price: h.price }))
      if (pts.length) symbolPrices[sym] = pts
    }

    const allDates = [...new Set(
      Object.values(symbolPrices).flatMap(pts => pts.map(p => p.isoDate))
    )].sort()

    if (allDates.length === 0) return []

    function portValueAt(holdings: HoldingForChart[], isoDate: string): number {
      let v = 0
      for (const h of holdings) {
        let qty = 0
        for (const tx of h.transactions) {
          if (tx.date <= isoDate) qty += tx.type === "BUY" ? tx.quantity : -tx.quantity
        }
        if (qty <= 0) continue
        const prices = symbolPrices[h.symbol]
        if (!prices?.length) continue
        const entry = prices.filter(p => p.isoDate <= isoDate).at(-1)
        if (entry) v += qty * entry.price
      }
      return v
    }

    return allDates.map(isoDate => ({
      date: isoDate.slice(5),
      isoDate,
      retirement: portValueAt(portHoldings.retirement, isoDate),
      long_term:  portValueAt(portHoldings.long_term,  isoDate),
      short_term: portValueAt(portHoldings.short_term, isoDate),
      total:      portValueAt([...portHoldings.retirement, ...portHoldings.long_term, ...portHoldings.short_term], isoDate),
    })).filter(p => p.total > 0)
  }, [portHoldings, portQuotes])

  // ── Portfolio KPI (current snapshot) ──
  const portKpis = useMemo(() => {
    const result: Record<PortfolioType, { value: number; cost: number; dailyPnl: number; pnl: number }> = {
      retirement: { value: 0, cost: 0, dailyPnl: 0, pnl: 0 },
      long_term:  { value: 0, cost: 0, dailyPnl: 0, pnl: 0 },
      short_term: { value: 0, cost: 0, dailyPnl: 0, pnl: 0 },
    }
    for (const key of PORTFOLIO_KEYS) {
      for (const h of portHoldings[key]) {
        const q = portQuotes[h.symbol]
        if (!q) continue
        let qty = 0
        for (const tx of h.transactions) qty += tx.type === "BUY" ? tx.quantity : -tx.quantity
        if (qty <= 0) continue
        result[key].value    += qty * q.currentPrice
        result[key].cost     += h.totalCost
        result[key].dailyPnl += qty * (q.currentPrice - (q.previousClose ?? q.currentPrice))
      }
      result[key].pnl = result[key].value - result[key].cost
    }
    return result
  }, [portHoldings, portQuotes])

  // ── Balance Sheet totals ──
  const fmt = (amount: number, cur: "THB" | "USD") =>
    (cur === "THB" ? "฿" : "$") +
    amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const totals = useMemo(() => {
    const sum = (cats: string[]) =>
      dbFinanceItems.filter(i => cats.includes(i.category))
        .reduce((acc, i) => acc + convertAmount(i.amount, i.currency, displayCurrency), 0)
    const totalAssets      = sum(["cash", "other_asset", "bond"])
    const totalLiabilities = 0
    const netWorth         = totalAssets
    const totalIncome      = dbMonthlyItems.filter(m => m.type.startsWith("income"))
      .reduce((acc, i) => acc + convertAmount(i.amount, i.currency, displayCurrency), 0)
    const totalExpenses    = dbMonthlyItems.filter(m => m.type.startsWith("expense"))
      .reduce((acc, i) => acc + convertAmount(i.amount, i.currency, displayCurrency), 0)
    return { totalAssets, totalLiabilities, netWorth, totalIncome, totalExpenses, monthlySurplus: totalIncome - totalExpenses }
  }, [dbFinanceItems, dbMonthlyItems, displayCurrency, convertAmount])

  const chartData = useMemo(() => networthHistory.map(s => ({
    date: s.date.slice(5),
    netWorth: parseFloat(convertAmount(Number(s.net_worth),    "THB", displayCurrency).toFixed(2)),
    assets:   parseFloat(convertAmount(Number(s.total_assets), "THB", displayCurrency).toFixed(2)),
  })), [networthHistory, displayCurrency, convertAmount])

  const pieData = useMemo(() => {
    const groups: Record<string, number> = {}
    for (const item of dbFinanceItems) {
      if (item.amount <= 0 || item.category === "liability") continue
      groups[item.label] = (groups[item.label] || 0) + convertAmount(item.amount, item.currency, displayCurrency)
    }
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [dbFinanceItems, displayCurrency, convertAmount])

  // ── Mutations ──
  const markSaving = (id: string) => setSavingState(prev => ({ ...prev, [id]: "saving" }))
  const markDone   = (id: string, ok: boolean) => {
    setSavingState(prev => ({ ...prev, [id]: ok ? "saved" : "error" }))
    if (ok) setTimeout(() => setSavingState(prev => { const n = { ...prev }; delete n[id]; return n }), 2000)
  }

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const updateFinance = async (id: string, field: "label" | "amount", value: string) => {
    markSaving(id)
    const t = dbFinanceItems.find(f => f.id === id); if (!t) return
    try {
      const res = await fetch(`/api/finance/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: field === "label" ? value : t.label, amount: field === "amount" ? parseFloat(value) || 0 : t.amount, currency: t.currency }),
      })
      if (!res.ok) throw new Error()
      setDbFinanceItems(prev => prev.map(i => i.id === id ? { ...i, [field]: field === "amount" ? parseFloat(value) || 0 : value } : i))
      markDone(id, true); savedTodayRef.current = false
    } catch { markDone(id, false) }
  }

  const addFinance = async (category: DBFinanceItem["category"], label: string, amount: number) => {
    const res = await fetch("/api/finance", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, label, amount, currency: "THB" }) }).catch(() => null)
    if (!res || !res.ok) { showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", false); return }
    const item = await res.json()
    setDbFinanceItems(prev => [...prev, item])
    savedTodayRef.current = false
  }

  const deleteFinance = async (id: string) => {
    const res = await fetch(`/api/finance/${id}`, { method: "DELETE" }).catch(() => null)
    if (!res || !res.ok) { showToast("ลบไม่สำเร็จ กรุณาลองใหม่", false); return }
    setDbFinanceItems(prev => prev.filter(i => i.id !== id))
    savedTodayRef.current = false
  }

  const updateMonthly = async (id: string, field: "label" | "amount", value: string) => {
    markSaving(id)
    const t = dbMonthlyItems.find(m => m.id === id); if (!t) return
    try {
      const res = await fetch(`/api/monthly/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: t.type, label: field === "label" ? value : t.label, amount: field === "amount" ? parseFloat(value) || 0 : t.amount, currency: t.currency }),
      })
      if (!res.ok) throw new Error()
      setDbMonthlyItems(prev => prev.map(i => i.id === id ? { ...i, [field]: field === "amount" ? parseFloat(value) || 0 : value } : i))
      markDone(id, true)
    } catch { markDone(id, false) }
  }

  const addMonthly = async (type: DBMonthlyItem["type"], label: string, amount: number) => {
    const res = await fetch("/api/monthly", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label, amount, currency: "THB" }) }).catch(() => null)
    if (!res || !res.ok) { showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", false); return }
    const item = await res.json()
    setDbMonthlyItems(prev => [...prev, item])
  }

  const deleteMonthly = async (id: string) => {
    const res = await fetch(`/api/monthly/${id}`, { method: "DELETE" }).catch(() => null)
    if (!res || !res.ok) { showToast("ลบไม่สำเร็จ กรุณาลองใหม่", false); return }
    setDbMonthlyItems(prev => prev.filter(i => i.id !== id))
  }

  const cashItems       = dbFinanceItems.filter(i => i.category === "cash")
  const investmentItems = dbFinanceItems.filter(i => i.category === "other_asset" || i.category === "bond")
  const liabilityItems  = [] as DBFinanceItem[]
  const incomeFix       = dbMonthlyItems.filter(m => m.type === "income_fixed")
  const incomeVar       = dbMonthlyItems.filter(m => m.type === "income_variable")
  const expenseFix      = dbMonthlyItems.filter(m => m.type === "expense_fixed")
  const expenseVar      = dbMonthlyItems.filter(m => m.type === "expense_variable")

  const prefix = displayCurrency === "THB" ? "฿" : "$"

  const fmtPortValue = (usd: number) => {
    const v = convertAmount(usd, "USD", displayCurrency)
    return prefix + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-stone-400" size={24} />
      </div>
    )
  }

  const totalPortValue = PORTFOLIO_KEYS.reduce((s, k) => s + portKpis[k].value, 0)
  const totalPortDailyPnl = PORTFOLIO_KEYS.reduce((s, k) => s + portKpis[k].dailyPnl, 0)
  const totalPortPnl = PORTFOLIO_KEYS.reduce((s, k) => s + portKpis[k].pnl, 0)

  const pnlPct = totalPortValue > 0 ? (totalPortPnl / (totalPortValue - totalPortPnl)) * 100 : 0

  return (
    <div className="bauhaus-theme flex flex-col min-h-screen w-full relative">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-xl text-sm font-bold text-white transition-all ${toast.ok ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}
      {/* Ticker Bar */}
      <div className="ticker-wrap border-b-4 border-[var(--color-on-background)] bg-[var(--color-primary-container)] z-30 sticky top-0 hidden md:block">
        <div className="ticker text-lg">
          <MarketTicker />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-10 overflow-y-auto">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-[var(--color-surface)] brutal-border brutal-shadow p-6 flex flex-col relative overflow-hidden text-[var(--color-on-surface)]">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#cbd5e1 2px, transparent 2px)", backgroundSize: "20px 20px" }}></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h2 className="font-bold text-xl uppercase tracking-tight text-[var(--color-outline-variant)] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Total Portfolio Value</h2>
                <p className="font-black text-4xl md:text-6xl lg:text-8xl tracking-tighter text-[var(--color-on-surface)]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {fmtPortValue(totalPortValue)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-[var(--color-primary)] text-white px-3 py-1 text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>{totalPortPnl >= 0 ? "+" : ""}{pnlPct.toFixed(1)}% YTD</span>
                  <span className="text-[var(--color-tertiary)] font-bold">{totalPortPnl >= 0 ? "+" : ""}{fmtPortValue(totalPortPnl)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 z-20 hidden sm:flex">
                 <button onClick={() => setDisplayCurrency(displayCurrency === "THB" ? "USD" : "THB")} className="bg-[var(--color-primary)] text-white font-bold uppercase px-4 py-2 border-2 border-[var(--color-on-background)] hover:bg-[var(--color-secondary)] transition-colors text-sm text-left flex justify-between items-center w-40 cursor-pointer brutal-shadow-sm active:translate-y-1 active:translate-x-1 active:shadow-none" style={{ fontFamily: "Manrope, sans-serif" }}>
                   {displayCurrency} <span className="material-symbols-outlined text-sm">swap_horiz</span>
                 </button>
                 {PORTFOLIO_KEYS.map(k => (
                   <button key={k} onClick={() => setActiveTab(k)} className={`${activeTab === k ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)]"} font-bold uppercase px-4 py-2 border-2 border-[var(--color-on-background)] transition-colors text-sm text-left w-40 cursor-pointer brutal-shadow-sm active:translate-y-1 active:translate-x-1 active:shadow-none`} style={{ fontFamily: "Manrope, sans-serif" }}>
                     {PORTFOLIO_META[k].label}
                   </button>
                 ))}
              </div>
            </div>

            <div className="mt-auto h-64 border-l-4 border-b-4 border-[var(--color-on-background)] p-2 relative z-10 bg-white/5 backdrop-blur-sm">
                {portLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={18} className="animate-spin text-stone-400" />
                  </div>
                ) : combinedChartData.length < 2 ? (
                  <div className="flex items-center justify-center h-full text-xs text-stone-400">
                    Add holdings to start tracking combined portfolio value
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        {PORTFOLIO_KEYS.map(k => (
                          <linearGradient key={k} id={`cgrad-${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={PORTFOLIO_META[k].lineColor} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={PORTFOLIO_META[k].lineColor} stopOpacity={0}   />
                          </linearGradient>
                        ))}
                        <linearGradient id="cgrad-total" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fill: "var(--color-outline)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis
                        tick={{ fill: "var(--color-outline)", fontSize: 10 }} axisLine={false} tickLine={false} width={70}
                        tickFormatter={v => prefix + (Math.abs(v) >= 1000 ? (convertAmount(v, "USD", displayCurrency) / 1000).toFixed(1) + "k" : convertAmount(v, "USD", displayCurrency).toFixed(0))}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] shadow-xl p-3 text-xs brutal-shadow-sm">
                              <p className="text-[var(--color-outline)] mb-2 text-[10px] font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>{label}</p>
                              {payload.map((p, i) => (
                                <div key={i} className="flex justify-between gap-4 font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>
                                  <span style={{ color: p.name === "Total" ? "var(--color-primary)" : p.color }} className="text-[10px] uppercase">{p.name}:</span>
                                  <span className="text-[var(--color-on-surface)]">{fmtPortValue(p.value as number)}</span>
                                </div>
                              ))}
                            </div>
                          )
                        }}
                      />
                      {PORTFOLIO_KEYS.map(k => (
                        <Area key={k} type="monotone" dataKey={k} name={PORTFOLIO_META[k].label}
                          stroke={PORTFOLIO_META[k].lineColor} strokeWidth={2}
                          fill={`url(#cgrad-${k})`} dot={false} isAnimationActive={false} />
                      ))}
                      <Area type="monotone" dataKey="total" name="Total"
                        stroke="var(--color-primary)" strokeWidth={3}
                        fill="url(#cgrad-total)" dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
            </div>
          </div>

          {/* Allocation Sidebar */}
          <div className="bg-[var(--color-primary)] text-white brutal-border brutal-shadow p-6 flex flex-col">
            <h2 className="font-bold text-2xl uppercase mb-6 text-[var(--color-primary-container)] border-b-2 border-[var(--color-primary-container)] pb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Allocation</h2>
            <div className="space-y-6 flex-1">
              {pieData.map((d, i) => {
                const colors = ["bg-[var(--color-primary-container)]", "bg-[var(--color-tertiary)]", "bg-[var(--color-tertiary-fixed-dim)]", "bg-[var(--color-secondary)]"];
                const borderColors = ["border-[var(--color-primary-container)]", "border-[var(--color-tertiary)]", "border-[var(--color-tertiary-fixed-dim)]", "border-[var(--color-secondary)]"];
                const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between font-bold mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                      <span className="uppercase text-sm">{d.name}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className={`w-full h-6 bg-[var(--color-surface-variant)] border-2 ${borderColors[i % 4]} overflow-hidden`}>
                      <div className={`h-full ${colors[i % 4]}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="w-full mt-8 bg-transparent text-[var(--color-primary-container)] border-2 border-[var(--color-primary-container)] font-bold uppercase py-3 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)] transition-colors cursor-pointer" style={{ fontFamily: "Manrope, sans-serif" }} onClick={() => setShowBalanceSheet(!showBalanceSheet)}>
              {showBalanceSheet ? "HIDE BALANCE SHEET" : "MANAGE BALANCE SHEET"}
            </button>
          </div>
        </section>

        {/* Portfolio Tab injection */}
        <div className="bg-[var(--color-surface)] brutal-border brutal-shadow p-6 text-[var(--color-on-surface)]">
          <PortfolioTab portfolio={activeTab} displayCurrency={displayCurrency} fxRates={fxRates} />
        </div>

        {/* Balance Sheet conditional */}
        {showBalanceSheet && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t-4 border-[var(--color-on-background)] pt-8 text-[var(--color-on-surface)]">
             <div className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] brutal-shadow p-5 flex flex-col gap-5">
               <h2 className="text-xl font-bold uppercase text-[var(--color-primary)]" style={{ fontFamily: "Manrope, sans-serif" }}>Assets</h2>
               <FinanceSection title="Cash & Liquid" items={cashItems} category="cash" accentColor="text-teal-600"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
                  onDelete={deleteFinance} onAdd={addFinance} />
                <FinanceSection title="Investments & Assets" items={investmentItems} category="other_asset" accentColor="text-indigo-600"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
                  onDelete={deleteFinance} onAdd={addFinance} />
                <div className="hidden border-t-2 border-[var(--color-primary)] pt-4">
                  <FinanceSection title="Liabilities & Debt" items={liabilityItems} category="liability" accentColor="text-[var(--color-error)]"
                    savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                    onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
                    onDelete={deleteFinance} onAdd={addFinance} />
                </div>
             </div>

             <div className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] brutal-shadow p-5 flex flex-col gap-5">
                <h2 className="text-xl font-bold uppercase text-[var(--color-primary)]" style={{ fontFamily: "Manrope, sans-serif" }}>Cash Flow</h2>
                <MonthlySection title="Fixed Income" type="income_fixed" items={incomeFix} accentColor="text-teal-600"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                  onDelete={deleteMonthly} onAdd={addMonthly} />
                <MonthlySection title="Variable Income" type="income_variable" items={incomeVar} accentColor="text-emerald-500"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                  onDelete={deleteMonthly} onAdd={addMonthly} />
                <div className="hidden border-t-2 border-[var(--color-primary)] pt-4">
                  <MonthlySection title="Fixed Expenses" type="expense_fixed" items={expenseFix} accentColor="text-rose-500"
                    savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                    onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                    onDelete={deleteMonthly} onAdd={addMonthly} />
                  <MonthlySection title="Variable Expenses" type="expense_variable" items={expenseVar} accentColor="text-orange-500"
                    savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                    onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                    onDelete={deleteMonthly} onAdd={addMonthly} />
                </div>
             </div>
           </div>
        )}
      </main>
    </div>
  )
}
