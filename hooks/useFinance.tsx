"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { Plus, Trash2, Check, Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, BarChart2, ChevronDown, ChevronUp } from "lucide-react"
import MarketTicker from "@/components/MarketTicker"
import MarketCard from "@/components/MarketCard"
import PortfolioTab, { type PortfolioType } from "@/components/PortfolioTab"

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

export function FinanceSection({ title, items, category, savingState, displayCurrency, convertAmount,
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

export function MonthlySection({ title, type, items, savingState, displayCurrency, convertAmount,
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

export function useFinance() {
  // ── Balance Sheet state ──
  const [dbFinanceItems,  setDbFinanceItems]  = useState<DBFinanceItem[]>([])
  const [dbMonthlyItems,  setDbMonthlyItems]  = useState<DBMonthlyItem[]>([])
  const [savingState,     setSavingState]     = useState<Record<string, "saving" | "saved" | "error">>({})
  const [fxRates,         setFxRates]         = useState<Record<string, number>>({ THB: 35.5 })
  const [displayCurrency, setDisplayCurrency] = useState<"THB" | "USD">("THB")
  const [loading,         setLoading]         = useState(true)
  const [networthHistory, setNetworthHistory] = useState<Snapshot[]>([])
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
    const tl = sumTHB(["liability"])
    const nw = ta - tl
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
    const totalLiabilities = sum(["liability"])
    const netWorth         = totalAssets - totalLiabilities
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
      body: JSON.stringify({ category, label, amount, currency: "THB" }) }).catch(console.error)
    if (!res || !res.ok) return
    const item = await res.json()
    setDbFinanceItems(prev => [...prev, item])
  }

  const deleteFinance = async (id: string) => {
    await fetch(`/api/finance/${id}`, { method: "DELETE" }).catch(console.error)
    setDbFinanceItems(prev => prev.filter(i => i.id !== id))
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
      body: JSON.stringify({ type, label, amount, currency: "THB" }) }).catch(console.error)
    if (!res || !res.ok) return
    const item = await res.json()
    setDbMonthlyItems(prev => [...prev, item])
  }

  const deleteMonthly = async (id: string) => {
    await fetch(`/api/monthly/${id}`, { method: "DELETE" }).catch(console.error)
    setDbMonthlyItems(prev => prev.filter(i => i.id !== id))
  }

  const cashItems       = dbFinanceItems.filter(i => i.category === "cash")
  const investmentItems = dbFinanceItems.filter(i => i.category === "other_asset" || i.category === "bond")
  const liabilityItems  = dbFinanceItems.filter(i => i.category === "liability")
  const incomeFix       = dbMonthlyItems.filter(m => m.type === "income_fixed")
  const incomeVar       = dbMonthlyItems.filter(m => m.type === "income_variable")
  const expenseFix      = dbMonthlyItems.filter(m => m.type === "expense_fixed")
  const expenseVar      = dbMonthlyItems.filter(m => m.type === "expense_variable")

  const prefix = displayCurrency === "THB" ? "฿" : "$"

  const fmtPortValue = (usd: number) => {
    const v = convertAmount(usd, "USD", displayCurrency)
    return prefix + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const totalPortValue = PORTFOLIO_KEYS.reduce((s, k) => s + portKpis[k].value, 0)
  const totalPortDailyPnl = PORTFOLIO_KEYS.reduce((s, k) => s + portKpis[k].dailyPnl, 0)
  const totalPortPnl = PORTFOLIO_KEYS.reduce((s, k) => s + portKpis[k].pnl, 0)

  const pnlPct = totalPortValue > 0 ? (totalPortPnl / (totalPortValue - totalPortPnl)) * 100 : 0

  return {
    loading: false,
    displayCurrency, setDisplayCurrency,
    dbFinanceItems, setDbFinanceItems,
    dbMonthlyItems, setDbMonthlyItems,
    fxRates,
    networthHistory,
    portLoading, portHoldings, portQuotes,
    activeTab, setActiveTab,
    showBalanceSheet, setShowBalanceSheet,
    savingState,
    addFinance, updateFinance, deleteFinance,
    addMonthly, updateMonthly, deleteMonthly,
    convertAmount, fmtPortValue, prefix,
    totals,
    totalPortValue, totalPortDailyPnl, totalPortPnl, combinedChartData, pieData, pnlPct,
    cashItems, investmentItems, liabilityItems,
    incomeFix, incomeVar, expenseFix, expenseVar
  }
}
