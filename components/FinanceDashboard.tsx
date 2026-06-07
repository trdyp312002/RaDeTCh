"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts"
import {
  Plus, Trash2, Check, Loader2, AlertCircle,
  TrendingUp, TrendingDown, Wallet, BarChart2,
} from "lucide-react"
import { PortfolioPanel } from "./PortfolioPanel"

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

type Holding = {
  id: string
  symbol: string
  name: string
  portfolio: string
  quantity: number
  avgCost: number
  totalCost: number
}

type Snapshot = {
  date: string
  net_worth: number
  total_assets: number
  total_liabilities: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#6366f1", "#14b8a6", "#10b981", "#a855f7", "#f59e0b", "#06b6d4", "#f43f5e", "#8b5cf6"]

const PORTFOLIO_META: Record<string, { label: string; color: string; accent: string }> = {
  retirement: { label: "Retirement",  color: "text-indigo-400",  accent: "border-indigo-500/30" },
  long_term:  { label: "Long-term",   color: "text-teal-400",    accent: "border-teal-500/30"   },
  short_term: { label: "Short-term",  color: "text-amber-400",   accent: "border-amber-500/30"  },
}

// ─── Small Components ─────────────────────────────────────────────────────────

function SaveIndicator({ state }: { state?: "saving" | "saved" | "error" }) {
  if (!state) return null
  if (state === "saving") return <Loader2 size={12} className="animate-spin text-gray-400" />
  if (state === "saved") return <Check size={12} className="text-emerald-400" />
  return <AlertCircle size={12} className="text-red-400" />
}

function KpiCard({ label, value, sub, icon, negativeColor }: {
  label: string; value: string; sub: string
  icon: React.ReactNode; negativeColor?: boolean
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <span className={`text-lg font-mono font-semibold ${negativeColor ? "text-rose-400" : "text-white"}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 truncate">{sub}</span>
    </div>
  )
}

// ─── Editable Row ─────────────────────────────────────────────────────────────

type EditableRowProps = {
  id: string; label: string; amount: number; currency: string
  saveState?: "saving" | "saved" | "error"
  displayCurrency: "THB" | "USD"
  convertAmount: (a: number, from: string, to: string) => number
  onUpdateLabel: (id: string, v: string) => void
  onUpdateAmount: (id: string, v: string) => void
  onDelete: (id: string) => void
}

function EditableRow({
  id, label, amount, currency, saveState, displayCurrency,
  convertAmount, onUpdateLabel, onUpdateAmount, onDelete,
}: EditableRowProps) {
  const [editLabel, setEditLabel] = useState(label)
  const [editAmount, setEditAmount] = useState(String(amount))
  const [editingAmount, setEditingAmount] = useState(false)
  const displayAmt = convertAmount(amount, currency, displayCurrency)
  const prefix = displayCurrency === "THB" ? "฿" : "$"

  return (
    <div className="flex items-center gap-2 group py-1.5 border-b border-white/5 last:border-0">
      <input
        className="flex-1 bg-transparent text-sm text-gray-200 outline-none focus:text-white min-w-0"
        value={editLabel}
        onChange={e => setEditLabel(e.target.value)}
        onBlur={() => { if (editLabel !== label) onUpdateLabel(id, editLabel) }}
        onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
      />
      <div className="flex items-center gap-1 shrink-0">
        {editingAmount ? (
          <input autoFocus
            className="w-28 bg-white/5 rounded px-2 py-0.5 text-right text-sm font-mono text-white outline-none focus:ring-1 focus:ring-indigo-500"
            value={editAmount}
            onChange={e => setEditAmount(e.target.value)}
            onBlur={() => { setEditingAmount(false); if (editAmount !== String(amount)) onUpdateAmount(id, editAmount) }}
            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
          />
        ) : (
          <button
            onClick={() => setEditingAmount(true)}
            className="w-28 text-right text-sm font-mono text-gray-200 hover:text-white hover:bg-white/5 rounded px-2 py-0.5 transition-colors"
          >
            {prefix}{displayAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </button>
        )}
        <SaveIndicator state={saveState} />
        <button onClick={() => onDelete(id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Finance Section ──────────────────────────────────────────────────────────

function FinanceSection({ title, items, category, savingState, displayCurrency, convertAmount,
  onUpdateLabel, onUpdateAmount, onDelete, onAdd, accentColor = "text-gray-400" }: {
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
        <span className="text-xs font-mono text-gray-300">
          {prefix}{total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      {items.map(item => (
        <EditableRow key={item.id} {...item} saveState={savingState[item.id]}
          displayCurrency={displayCurrency} convertAmount={convertAmount}
          onUpdateLabel={onUpdateLabel} onUpdateAmount={onUpdateAmount} onDelete={onDelete} />
      ))}
      <button onClick={() => onAdd(category, "New item", 0)}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1 w-fit">
        <Plus size={11} /> Add row
      </button>
    </div>
  )
}

// ─── Monthly Section ──────────────────────────────────────────────────────────

function MonthlySection({ title, type, items, savingState, displayCurrency, convertAmount,
  onUpdateLabel, onUpdateAmount, onDelete, onAdd, accentColor = "text-gray-400" }: {
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
        <span className="text-xs font-mono text-gray-300">
          {prefix}{total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      {items.map(item => {
        const [editLabel, setEditLabel] = useState(item.label)
        const [editAmount, setEditAmount] = useState(String(item.amount))
        const [editingAmount, setEditingAmount] = useState(false)
        const displayAmt = convertAmount(item.amount, item.currency, displayCurrency)
        return (
          <div key={item.id} className="flex items-center gap-2 group py-1.5 border-b border-white/5 last:border-0">
            <input className="flex-1 bg-transparent text-sm text-gray-200 outline-none focus:text-white min-w-0"
              value={editLabel} onChange={e => setEditLabel(e.target.value)}
              onBlur={() => { if (editLabel !== item.label) onUpdateLabel(item.id, editLabel) }}
              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }} />
            <div className="flex items-center gap-1 shrink-0">
              {editingAmount ? (
                <input autoFocus
                  className="w-28 bg-white/5 rounded px-2 py-0.5 text-right text-sm font-mono text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editAmount} onChange={e => setEditAmount(e.target.value)}
                  onBlur={() => { setEditingAmount(false); if (editAmount !== String(item.amount)) onUpdateAmount(item.id, editAmount) }}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }} />
              ) : (
                <button onClick={() => setEditingAmount(true)}
                  className="w-28 text-right text-sm font-mono text-gray-200 hover:text-white hover:bg-white/5 rounded px-2 py-0.5 transition-colors">
                  {prefix}{displayAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </button>
              )}
              <SaveIndicator state={savingState[item.id]} />
              <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )
      })}
      <button onClick={() => onAdd(type, "New item", 0)}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1 w-fit">
        <Plus size={11} /> Add row
      </button>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function FinanceDashboard() {
  const [dbFinanceItems, setDbFinanceItems] = useState<DBFinanceItem[]>([])
  const [dbMonthlyItems, setDbMonthlyItems] = useState<DBMonthlyItem[]>([])
  const [savingState, setSavingState] = useState<Record<string, "saving" | "saved" | "error">>({})
  const [fxRates, setFxRates] = useState<Record<string, number>>({ THB: 35.5 })
  const [displayCurrency, setDisplayCurrency] = useState<"THB" | "USD">("THB")
  const [loading, setLoading] = useState(true)

  // New: portfolio + history
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [marketQuotes, setMarketQuotes] = useState<Record<string, any>>({})
  const [networthHistory, setNetworthHistory] = useState<Snapshot[]>([])
  const savedTodayRef = useRef(false)

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch("/api/finance").then(r => r.json()),
      fetch("/api/monthly").then(r => r.json()),
      fetch("/api/fx").then(r => r.json()),
      fetch("/api/networth").then(r => r.json()),
    ]).then(([finance, monthly, fx, history]) => {
      if (Array.isArray(finance)) setDbFinanceItems(finance)
      if (Array.isArray(monthly)) setDbMonthlyItems(monthly)
      if (fx?.rates) setFxRates(fx.rates)
      if (Array.isArray(history)) setNetworthHistory(history)
    }).catch(console.error).finally(() => setLoading(false))

    // Fetch holdings + quotes separately
    fetch("/api/holdings")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        setHoldings(data)
        const symbols = [...new Set(data.map((h: any) => h.symbol))].filter(Boolean).join(",")
        if (symbols) {
          fetch(`/api/market?symbols=${symbols}`)
            .then(r => r.json())
            .then(q => setMarketQuotes(q))
            .catch(console.error)
        }
      }).catch(console.error)
  }, [])

  // ─── Auto-save today's snapshot ─────────────────────────────────────────────

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, net_worth: nw, total_assets: ta, total_liabilities: tl }),
    })
      .then(r => r.json())
      .then(snap => {
        if (snap?.date) {
          setNetworthHistory(prev => {
            const rest = prev.filter(s => s.date !== snap.date)
            return [...rest, snap].sort((a, b) => a.date.localeCompare(b.date))
          })
        }
      })
      .catch(console.error)
  }, [loading, dbFinanceItems, convertAmount])

  // ─── Derived Totals ──────────────────────────────────────────────────────────

  const fmt = (amount: number, cur: "THB" | "USD") =>
    (cur === "THB" ? "฿" : "$") +
    amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const totals = useMemo(() => {
    const sum = (cats: string[]) =>
      dbFinanceItems.filter(i => cats.includes(i.category))
        .reduce((acc, i) => acc + convertAmount(i.amount, i.currency, displayCurrency), 0)

    const totalAssets = sum(["cash", "other_asset", "bond"])
    const totalLiabilities = sum(["liability"])
    const netWorth = totalAssets - totalLiabilities

    const totalIncome = dbMonthlyItems.filter(m => m.type.startsWith("income"))
      .reduce((acc, i) => acc + convertAmount(i.amount, i.currency, displayCurrency), 0)
    const totalExpenses = dbMonthlyItems.filter(m => m.type.startsWith("expense"))
      .reduce((acc, i) => acc + convertAmount(i.amount, i.currency, displayCurrency), 0)

    return { totalAssets, totalLiabilities, netWorth, totalIncome, totalExpenses, monthlySurplus: totalIncome - totalExpenses }
  }, [dbFinanceItems, dbMonthlyItems, displayCurrency, convertAmount])

  // ─── Net Worth Chart Data ────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    return networthHistory.map(s => ({
      date: s.date.slice(5), // MM-DD
      fullDate: s.date,
      netWorth: parseFloat(convertAmount(Number(s.net_worth), "THB", displayCurrency).toFixed(2)),
      assets: parseFloat(convertAmount(Number(s.total_assets), "THB", displayCurrency).toFixed(2)),
    }))
  }, [networthHistory, displayCurrency, convertAmount])

  // ─── Pie Chart Data ──────────────────────────────────────────────────────────

  const pieData = useMemo(() => {
    const groups: Record<string, number> = {}
    for (const item of dbFinanceItems) {
      if (item.amount <= 0 || item.category === "liability") continue
      groups[item.label] = (groups[item.label] || 0) + convertAmount(item.amount, item.currency, displayCurrency)
    }
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [dbFinanceItems, displayCurrency, convertAmount])

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const markSaving = (id: string) => setSavingState(prev => ({ ...prev, [id]: "saving" }))
  const markDone = (id: string, ok: boolean) => {
    setSavingState(prev => ({ ...prev, [id]: ok ? "saved" : "error" }))
    if (ok) setTimeout(() => setSavingState(prev => { const n = { ...prev }; delete n[id]; return n }), 2000)
  }

  const updateFinance = async (id: string, field: "label" | "amount", value: string) => {
    markSaving(id)
    const t = dbFinanceItems.find(f => f.id === id)
    if (!t) return
    try {
      const res = await fetch(`/api/finance/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: field === "label" ? value : t.label, amount: field === "amount" ? parseFloat(value) || 0 : t.amount, currency: t.currency }) })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setDbFinanceItems(prev => prev.map(i => i.id === id ? updated : i))
      markDone(id, true)
      savedTodayRef.current = false // re-snapshot on next effect
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
    const t = dbMonthlyItems.find(m => m.id === id)
    if (!t) return
    try {
      const res = await fetch(`/api/monthly/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: t.type, label: field === "label" ? value : t.label, amount: field === "amount" ? parseFloat(value) || 0 : t.amount, currency: t.currency }) })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setDbMonthlyItems(prev => prev.map(i => i.id === id ? updated : i))
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

  // ─── Grouped Items ───────────────────────────────────────────────────────────

  const cashItems = dbFinanceItems.filter(i => i.category === "cash")
  const investmentItems = dbFinanceItems.filter(i => i.category === "other_asset" || i.category === "bond")
  const liabilityItems = dbFinanceItems.filter(i => i.category === "liability")
  const incomeFix = dbMonthlyItems.filter(m => m.type === "income_fixed")
  const incomeVar = dbMonthlyItems.filter(m => m.type === "income_variable")
  const expenseFix = dbMonthlyItems.filter(m => m.type === "expense_fixed")
  const expenseVar = dbMonthlyItems.filter(m => m.type === "expense_variable")

  const commonProps = { savingState, displayCurrency, convertAmount }
  const prefix = displayCurrency === "THB" ? "฿" : "$"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Finance</h1>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {(["THB", "USD"] as const).map(cur => (
            <button key={cur} onClick={() => setDisplayCurrency(cur)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                displayCurrency === cur ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}>{cur}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Net Worth" value={fmt(totals.netWorth, displayCurrency)}
          sub={`Assets ${fmt(totals.totalAssets, displayCurrency)}`}
          icon={<Wallet size={16} className="text-indigo-400" />}
          negativeColor={totals.netWorth < 0} />
        <KpiCard label="Total Assets" value={fmt(totals.totalAssets, displayCurrency)}
          sub={`Liabilities ${fmt(totals.totalLiabilities, displayCurrency)}`}
          icon={<TrendingUp size={16} className="text-emerald-400" />} />
        <KpiCard label="Total Liabilities" value={fmt(totals.totalLiabilities, displayCurrency)}
          sub={`${((totals.totalLiabilities / Math.max(totals.totalAssets, 1)) * 100).toFixed(1)}% of assets`}
          icon={<TrendingDown size={16} className="text-rose-400" />} negativeColor />
        <KpiCard label="Monthly Surplus" value={fmt(totals.monthlySurplus, displayCurrency)}
          sub={`Income ${fmt(totals.totalIncome, displayCurrency)}`}
          icon={<BarChart2 size={16} className="text-teal-400" />}
          negativeColor={totals.monthlySurplus < 0} />
      </div>

      {/* Net Worth History */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Net Worth History</h2>
          <span className="text-xs text-gray-500">{networthHistory.length} days tracked</span>
        </div>

        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-32 text-xs text-gray-600">
            Collecting data — check back tomorrow for growth chart
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradNW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} width={70}
                tickFormatter={v => prefix + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0))}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-gray-900/95 border border-gray-800 rounded-lg px-3 py-2 text-xs">
                      <p className="text-gray-400 mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <div key={i} className="flex gap-2">
                          <span style={{ color: p.color }}>{p.name}:</span>
                          <span className="font-mono text-white">{fmt(p.value as number, displayCurrency)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="assets" name="Assets" stroke="#14b8a6" strokeWidth={1.5} fill="url(#gradA)" dot={false} />
              <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#6366f1" strokeWidth={2} fill="url(#gradNW)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Portfolio Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Investment Portfolios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["retirement", "long_term", "short_term"] as const).map(key => (
            <PortfolioPanel key={key} portfolioKey={key} displayCurrency={displayCurrency} convertAmount={convertAmount} />
          ))}
        </div>
      </div>

      {/* Balance Sheet + Monthly Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-white">Balance Sheet</h2>
          <FinanceSection title="Cash & Liquid" items={cashItems} category="cash" accentColor="text-teal-400"
            onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
            onDelete={deleteFinance} onAdd={addFinance} {...commonProps} />
          <FinanceSection title="Investments & Assets" items={investmentItems} category="other_asset" accentColor="text-indigo-400"
            onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
            onDelete={deleteFinance} onAdd={addFinance} {...commonProps} />
          <div className="border-t border-white/10 pt-4">
            <FinanceSection title="Liabilities" items={liabilityItems} category="liability" accentColor="text-rose-400"
              onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
              onDelete={deleteFinance} onAdd={addFinance} {...commonProps} />
          </div>
          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Net Worth</span>
            <span className={`text-sm font-mono font-semibold ${totals.netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {fmt(totals.netWorth, displayCurrency)}
            </span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-white">Monthly Cash Flow</h2>
          <MonthlySection title="Income — Fixed" type="income_fixed" items={incomeFix} accentColor="text-emerald-400"
            onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
            onDelete={deleteMonthly} onAdd={addMonthly} {...commonProps} />
          <MonthlySection title="Income — Variable" type="income_variable" items={incomeVar} accentColor="text-green-400"
            onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
            onDelete={deleteMonthly} onAdd={addMonthly} {...commonProps} />
          <div className="border-t border-white/10 pt-4">
            <MonthlySection title="Expenses — Fixed" type="expense_fixed" items={expenseFix} accentColor="text-rose-400"
              onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
              onDelete={deleteMonthly} onAdd={addMonthly} {...commonProps} />
          </div>
          <MonthlySection title="Expenses — Variable" type="expense_variable" items={expenseVar} accentColor="text-orange-400"
            onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
            onDelete={deleteMonthly} onAdd={addMonthly} {...commonProps} />
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Total Income</span>
              <span className="text-xs font-mono text-emerald-400">{fmt(totals.totalIncome, displayCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Total Expenses</span>
              <span className="text-xs font-mono text-rose-400">{fmt(totals.totalExpenses, displayCurrency)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/10">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Monthly Surplus</span>
              <span className={`text-sm font-mono font-semibold ${totals.monthlySurplus >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fmt(totals.monthlySurplus, displayCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      {pieData.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Asset Allocation</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const e = payload[0]
                    return (
                      <div className="bg-gray-900/95 border border-gray-800 rounded-lg px-3 py-2 text-xs">
                        <p className="text-gray-300">{e.name}</p>
                        <p className="font-mono text-white">{fmt(e.value as number, displayCurrency)}</p>
                        <p className="text-gray-400">{((e.value as number / totals.totalAssets) * 100).toFixed(1)}%</p>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 min-w-[140px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs text-gray-300 truncate">{entry.name}</span>
                  <span className="text-xs font-mono text-gray-400 ml-auto">
                    {totals.totalAssets > 0 ? ((entry.value / totals.totalAssets) * 100).toFixed(1) : "0"}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
