"use client"

import { useState, useEffect, useCallback, useMemo, Fragment } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PortfolioType = "long_term" | "short_term" | "retirement"

type Transaction = {
  id: string
  holding_id: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  fees: number
  date: string
  notes: string | null
  created_at: string
}

type Holding = {
  id: string
  symbol: string
  name: string
  type: string
  portfolio: string
  created_at: string
  updated_at: string
  quantity: number
  avgCost: number
  totalCost: number
  transactions: Transaction[]
  currentPrice?: number
  previousClose?: number
  currentValue?: number
  dailyPnl?: number
  unrealizedPnl?: number
  unrealizedPnlPct?: number
  priceHistory?: { date: string; isoDate?: string; price: number }[]
}

type Props = {
  portfolio: PortfolioType
  displayCurrency: "THB" | "USD"
  fxRates: Record<string, number>
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PORTFOLIO_CONFIG: Record<PortfolioType, {
  label: string; emoji: string; description: string; symbolHint: string; defaultType: string
  color: string; accent: string
}> = {
  long_term: {
    label: "Long-term Portfolio", emoji: "📈",
    description: "Growth assets with a 10-year horizon — AI Infrastructure, Energy, Space, Cybersecurity.",
    symbolHint: "e.g. NVDA, AVGO, PLTR", defaultType: "stock",
    color: "text-teal-600", accent: "border-teal-200",
  },
  short_term: {
    label: "Short-term Portfolio", emoji: "🤖",
    description: "Bot trading only — Technical analysis-driven ETF trades.",
    symbolHint: "e.g. SPY, QQQ, TQQQ", defaultType: "etf",
    color: "text-amber-600", accent: "border-amber-200",
  },
  retirement: {
    label: "Retirement Portfolio", emoji: "₿",
    description: "Store of Wealth: Bitcoin, Gold, Land — long-term value preservation. Hold indefinitely.",
    symbolHint: "BTC-USD", defaultType: "crypto",
    color: "text-indigo-600", accent: "border-indigo-200",
  },
}

const CHART_COLORS: Record<PortfolioType, string> = {
  retirement: "#6366f1",
  long_term:  "#14b8a6",
  short_term: "#f59e0b",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PortfolioTab({ portfolio, displayCurrency, fxRates }: Props) {
  const cfg = PORTFOLIO_CONFIG[portfolio]
  const thbRate = fxRates.THB || 35.5
  const chartColor = CHART_COLORS[portfolio]

  const toDisplay = (usd: number) => displayCurrency === "THB" ? usd * thbRate : usd
  const sym = displayCurrency === "THB" ? "฿" : "$"
  const fmt = (n: number) =>
    sym + toDisplay(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtUSD = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtQty = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 8 })

  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all")

  const [showAddHolding, setShowAddHolding] = useState(false)
  const [newSymbol, setNewSymbol] = useState("")
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState(cfg.defaultType)
  const [addingHolding, setAddingHolding] = useState(false)
  const [addHoldingError, setAddHoldingError] = useState("")

  const [txHoldingId, setTxHoldingId] = useState<string | null>(null)
  const [txType, setTxType] = useState<"BUY" | "SELL">("BUY")
  const [txQty, setTxQty] = useState("")
  const [txPrice, setTxPrice] = useState("")
  const [txFees, setTxFees] = useState("0")
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [txNotes, setTxNotes] = useState("")
  const [addingTx, setAddingTx] = useState(false)

  // ── Fetch ──
  const fetchHoldings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/holdings?portfolio=${portfolio}`)
      const data: Holding[] = await res.json()

      const withQty = data.filter(h => h.quantity > 0 || h.transactions.length > 0)
      if (withQty.length > 0) {
        const symbols = [...new Set(withQty.map(h => h.symbol))].join(",")
        try {
          const mRes = await fetch(`/api/market?symbols=${symbols}`)
          const quotes = await mRes.json()
          setHoldings(data.map(h => {
            const q = quotes[h.symbol]
            if (q && h.quantity > 0) {
              const previousClose = q.previousClose ?? q.currentPrice
              const currentValue = h.quantity * q.currentPrice
              const unrealizedPnl = currentValue - h.totalCost
              const unrealizedPnlPct = h.totalCost > 0 ? (unrealizedPnl / h.totalCost) * 100 : 0
              const dailyPnl = h.quantity * (q.currentPrice - previousClose)
              return {
                ...h,
                currentPrice: q.currentPrice,
                previousClose,
                currentValue,
                dailyPnl,
                unrealizedPnl,
                unrealizedPnlPct,
                priceHistory: q.history ?? [],
              }
            }
            return h
          }))
        } catch {
          setHoldings(data)
        }
      } else {
        setHoldings(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [portfolio])

  useEffect(() => { fetchHoldings() }, [fetchHoldings])

  // ── Totals ──
  const totalCost    = holdings.reduce((s, h) => s + h.totalCost, 0)
  const totalValue   = holdings.reduce((s, h) => s + (h.currentValue ?? 0), 0)
  const totalPnl     = totalValue > 0 ? totalValue - totalCost : 0
  const totalPnlPct  = totalCost > 0 && totalValue > 0 ? (totalPnl / totalCost) * 100 : 0
  const totalDailyPnl = holdings.reduce((s, h) => s + (h.dailyPnl ?? 0), 0)
  const hasMarketData = holdings.some(h => h.currentPrice != null)

  // ── Portfolio value history chart ──
  const portfolioValueHistory = useMemo(() => {
    if (holdings.length === 0) return []

    const symbolPrices: Record<string, { isoDate: string; price: number }[]> = {}
    for (const h of holdings) {
      if (!h.priceHistory?.length) continue
      symbolPrices[h.symbol] = h.priceHistory
        .filter(p => p.isoDate)
        .map(p => ({ isoDate: p.isoDate!, price: p.price }))
    }

    const allDates = [...new Set(
      Object.values(symbolPrices).flatMap(pts => pts.map(p => p.isoDate))
    )].sort()

    if (allDates.length === 0) return []

    return allDates.map(isoDate => {
      let value = 0
      for (const h of holdings) {
        let qty = 0
        for (const tx of h.transactions) {
          if (tx.date <= isoDate) {
            qty += tx.type === "BUY" ? tx.quantity : -tx.quantity
          }
        }
        if (qty <= 0) continue
        const prices = symbolPrices[h.symbol]
        if (!prices?.length) continue
        const entry = prices.filter(p => p.isoDate <= isoDate).at(-1)
        if (!entry) continue
        value += qty * entry.price
      }
      return { date: isoDate.slice(5), isoDate, value }
    }).filter(p => p.value > 0)
  }, [holdings])

  // ── Handlers ──
  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSymbol.trim() || !newName.trim()) return
    setAddingHolding(true)
    setAddHoldingError("")
    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: newSymbol.toUpperCase().trim(), name: newName.trim(), type: newType, portfolio }),
      })
      if (!res.ok) {
        const err = await res.json()
        setAddHoldingError(err.error || "Failed to add holding")
        return
      }
      setNewSymbol(""); setNewName(""); setShowAddHolding(false)
      await fetchHoldings()
    } catch {
      setAddHoldingError("Network error")
    } finally {
      setAddingHolding(false)
    }
  }

  const handleDeleteHolding = async (id: string, symbol: string) => {
    if (!confirm(`Delete ${symbol} and all its transactions? This cannot be undone.`)) return
    try {
      await fetch(`/api/holdings/${id}`, { method: "DELETE" })
      setHoldings(prev => prev.filter(h => h.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (e) { console.error(e) }
  }

  const handleAddTransaction = async (e: React.FormEvent, holdingId: string) => {
    e.preventDefault()
    if (!txQty || !txPrice || !txDate) return
    setAddingTx(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdingId, type: txType,
          quantity: parseFloat(txQty), price: parseFloat(txPrice),
          fees: parseFloat(txFees) || 0, date: txDate, notes: txNotes || null,
        }),
      })
      if (!res.ok) return
      setTxQty(""); setTxPrice(""); setTxFees("0"); setTxNotes(""); setTxHoldingId(null)
      await fetchHoldings()
    } catch (e) { console.error(e) }
    finally { setAddingTx(false) }
  }

  const openTxForm = (holdingId: string) => {
    setTxHoldingId(holdingId)
    setTxType("BUY"); setTxQty(""); setTxPrice(""); setTxFees("0"); setTxNotes("")
    setTxDate(new Date().toISOString().slice(0, 10))
  }

  // ── Derived State ──
  const filteredHoldings = useMemo(() => {
    if (filter === "gainers") return holdings.filter(h => (h.unrealizedPnl ?? 0) >= 0)
    if (filter === "losers") return holdings.filter(h => (h.unrealizedPnl ?? 0) < 0)
    return holdings
  }, [holdings, filter])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Summary Banner ── */}
      <div className={`bg-[var(--color-surface)] border border-gray-200/40 rounded-3xl p-6 md:p-8 shadow-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.3em] font-semibold mb-3 ${cfg.color}`}>
              {cfg.emoji} {cfg.label}
            </p>
            <div className="flex gap-6 flex-wrap">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-0.5">Invested</p>
                <p className="text-xl font-extrabold font-mono text-stone-800">{fmt(totalCost)}</p>
              </div>
              {hasMarketData && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-0.5">Value</p>
                  <p className={`text-xl font-extrabold font-mono ${totalValue >= totalCost ? "text-emerald-600" : "text-rose-500"}`}>
                    {fmt(totalValue)}
                  </p>
                </div>
              )}
              {hasMarketData && totalCost > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-0.5">Today</p>
                  <p className={`text-xl font-extrabold font-mono ${totalDailyPnl >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {totalDailyPnl >= 0 ? "+" : ""}{fmt(totalDailyPnl)}
                  </p>
                </div>
              )}
              {hasMarketData && totalCost > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-0.5">Total P&L</p>
                  <p className={`text-xl font-extrabold font-mono ${totalPnl >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)}
                  </p>
                  <p className={`text-[10px] font-bold font-mono ${totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}% ROI
                  </p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => { setShowAddHolding(!showAddHolding); setAddHoldingError("") }}
            className={`shrink-0 flex items-center gap-2 bg-stone-50 shadow-lg shadow-stone-200/50 hover:bg-white/[0.09] border border-stone-100 px-4 py-2 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 transition-all cursor-pointer`}
          >
            + Add Holding
          </button>
        </div>

        {/* Portfolio Value Chart */}
        {portfolioValueHistory.length > 1 && (
          <div className="mt-5 pt-4 border-t border-white/[0.05]">
            <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-3">Portfolio Value · 30D</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={portfolioValueHistory} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`ptab-grad-${portfolio}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-white/95 shadow-xl border border-stone-100 rounded px-2 py-1.5 text-[10px]">
                          <p className="text-stone-500 text-[9px]">{payload[0].payload.date}</p>
                          <p className="font-mono text-stone-800">{fmt(payload[0].value as number)}</p>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone" dataKey="value"
                    stroke={chartColor} strokeWidth={2}
                    fill={`url(#ptab-grad-${portfolio})`}
                    dot={false} isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Holding Form ── */}
      {showAddHolding && (
        <div className="bg-white border border-stone-100 shadow-xl shadow-stone-200/50 rounded-3xl p-5 animate-fadeIn">
          <h4 className="text-xs font-semibold text-stone-800 mb-4">New Holding</h4>
          <form onSubmit={handleAddHolding} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1.5">Symbol</label>
              <input
                value={newSymbol} onChange={e => setNewSymbol(e.target.value)}
                placeholder={cfg.symbolHint}
                className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs font-mono text-stone-800 w-36 outline-none focus:ring-1 focus:ring-white/20"
                required
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1.5">Name</label>
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Apple Inc."
                className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs text-stone-800 w-48 outline-none focus:ring-1 focus:ring-white/20"
                required
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1.5">Type</label>
              <select
                value={newType} onChange={e => setNewType(e.target.value)}
                className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs text-stone-800 outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addingHolding}
                className="bg-stone-200 hover:bg-white/15 text-stone-800 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50">
                {addingHolding ? "Adding…" : "Add"}
              </button>
              <button type="button"
                onClick={() => { setShowAddHolding(false); setNewSymbol(""); setNewName(""); setAddHoldingError("") }}
                className="text-stone-400 hover:text-stone-500 px-4 py-2 rounded-lg text-xs transition-all cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
          {addHoldingError && <p className="text-xs text-rose-500 mt-3">{addHoldingError}</p>}
        </div>
      )}

      {/* ── Holdings ── */}
      {loading ? (
        <div className="bg-white border border-stone-100 shadow-xl shadow-stone-200/50 rounded-3xl p-12 text-center">
          <div className="w-5 h-5 border-2 border-stone-200 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-400 text-xs">Loading…</p>
        </div>
      ) : holdings.length === 0 ? (
        <div className="bg-white border border-stone-100 shadow-xl shadow-stone-200/50 rounded-3xl p-12 text-center">
          <p className="text-2xl mb-3">{cfg.emoji}</p>
          <p className="text-stone-500 text-xs mb-4">No holdings yet.</p>
          <button onClick={() => setShowAddHolding(true)}
            className="bg-stone-200 hover:bg-white/15 text-stone-800 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all">
            + Add First Holding
          </button>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-gray-200/40 rounded-3xl overflow-hidden shadow-sm mt-8">
          <div className="px-6 py-4 border-b border-gray-200/40 bg-[var(--color-surface-container)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-lg font-bold text-[var(--color-on-surface)] capitalize">Holdings</h4>
              <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">{filteredHoldings.length} position{filteredHoldings.length !== 1 ? "s" : ""}</span>
            </div>
            
            <div className="flex gap-2">
              {(["all", "gainers", "losers"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border ${
                    filter === f 
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm" 
                      : "bg-transparent text-[var(--color-on-surface-variant)] border-[var(--color-outline)]/30 hover:bg-gray-100"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest">Symbol</th>
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right">Qty</th>
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right">Avg Cost</th>
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right">Total Cost</th>
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right">Live Price</th>
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right">Value</th>
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right">Today</th>
                  <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right">P&L</th>
                  {portfolio === "retirement" && (
                    <th className="px-5 py-3 text-[9px] font-semibold text-stone-400 uppercase tracking-widest">Chart</th>
                  )}
                  <th className="w-8 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map(h => (
                  <Fragment key={h.id}>
                    {/* ── Main Row ── */}
                    <tr
                      key={h.id}
                      className={`border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                        expandedId === h.id ? "bg-gray-50/80" : ""
                      }`}
                      onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] font-bold ${expandedId === h.id ? cfg.color : "text-stone-400"}`}>
                            {expandedId === h.id ? "▲" : "▼"}
                          </span>
                          <div>
                            <p className="text-xs font-bold font-mono text-stone-800">{h.symbol}</p>
                            <p className="text-[9px] text-stone-400 capitalize">{h.name} · {h.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-stone-500 text-right">{fmtQty(h.quantity)}</td>
                      <td className="px-5 py-3 text-xs font-mono text-stone-400 text-right">
                        {h.avgCost > 0 ? fmtUSD(h.avgCost) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-stone-500 text-right">
                        {h.totalCost > 0 ? fmt(h.totalCost) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-right">
                        {h.currentPrice != null
                          ? <span className="text-sky-400 font-semibold">{fmtUSD(h.currentPrice)}</span>
                          : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono font-semibold text-stone-800 text-right">
                        {h.currentValue != null ? fmt(h.currentValue) : <span className="text-gray-700">—</span>}
                      </td>
                      <td className={`px-5 py-3 text-xs font-mono text-right ${
                        h.dailyPnl != null ? (h.dailyPnl >= 0 ? "text-emerald-600" : "text-rose-500") : "text-gray-700"
                      }`}>
                        {h.dailyPnl != null
                          ? `${h.dailyPnl >= 0 ? "+" : ""}${fmt(h.dailyPnl)}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {h.unrealizedPnl != null ? (
                          <div>
                            <p className={`text-xs font-mono font-semibold ${h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                              {h.unrealizedPnl >= 0 ? "+" : ""}{fmt(h.unrealizedPnl)}
                            </p>
                            <p className={`text-[9px] font-mono ${h.unrealizedPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {h.unrealizedPnlPct != null && `${h.unrealizedPnlPct >= 0 ? "+" : ""}${h.unrealizedPnlPct.toFixed(2)}%`}
                            </p>
                          </div>
                        ) : <span className="text-gray-700 text-xs">—</span>}
                      </td>

                      {/* Retirement inline sparkline */}
                      {portfolio === "retirement" && (
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          {h.priceHistory && h.priceHistory.length > 1 ? (
                            <div className="w-20 h-8">
                              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <LineChart data={h.priceHistory.slice(-30)}>
                                  <Line
                                    type="monotone" dataKey="price"
                                    stroke={chartColor} strokeWidth={1.5}
                                    dot={false} isAnimationActive={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-700">—</span>
                          )}
                        </td>
                      )}

                      <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteHolding(h.id, h.symbol)}
                          className="text-[9px] text-gray-700 hover:text-rose-500 font-semibold px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>

                    {/* ── Expanded Detail Row ── */}
                    {expandedId === h.id && (
                      <tr key={`${h.id}-exp`}>
                        <td colSpan={portfolio === "retirement" ? 10 : 9}
                          className="bg-gray-50/40 border-b border-gray-200/40 px-6 py-6">
                          <div className="space-y-6">

                            {/* Price Chart (non-retirement; retirement already shows inline) */}
                            {portfolio !== "retirement" && h.priceHistory && h.priceHistory.length > 1 && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-3">
                                  30-Day Price · {h.symbol}
                                </p>
                                <div className="h-32">
                                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <AreaChart
                                      data={h.priceHistory.slice(-30)}
                                      margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
                                    >
                                      <defs>
                                        <linearGradient id={`hgrad-${h.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} />
                                      <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                                      <Tooltip
                                        content={({ active, payload }) => {
                                          if (!active || !payload?.length) return null
                                          return (
                                            <div className="bg-white/95 shadow-xl border border-stone-100 rounded px-2 py-1.5 text-[10px]">
                                              <p className="text-stone-500 text-[9px]">{payload[0].payload.date}</p>
                                              <p className="font-mono text-stone-800">{fmtUSD(payload[0].value as number)}</p>
                                            </div>
                                          )
                                        }}
                                      />
                                      <Area type="monotone" dataKey="price"
                                        stroke={chartColor} strokeWidth={2}
                                        fill={`url(#hgrad-${h.id})`} dot={false} isAnimationActive={false}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* Retirement: larger chart in expanded */}
                            {portfolio === "retirement" && h.priceHistory && h.priceHistory.length > 1 && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-3">
                                  30-Day Price · {h.symbol}
                                </p>
                                <div className="h-40">
                                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <AreaChart
                                      data={h.priceHistory.slice(-30)}
                                      margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
                                    >
                                      <defs>
                                        <linearGradient id={`hgrad-ret-${h.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} />
                                      <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                                      <Tooltip
                                        content={({ active, payload }) => {
                                          if (!active || !payload?.length) return null
                                          return (
                                            <div className="bg-white/95 shadow-xl border border-stone-100 rounded px-2 py-1.5 text-[10px]">
                                              <p className="text-stone-500 text-[9px]">{payload[0].payload.date}</p>
                                              <p className="font-mono text-stone-800">{fmtUSD(payload[0].value as number)}</p>
                                            </div>
                                          )
                                        }}
                                      />
                                      <Area type="monotone" dataKey="price"
                                        stroke={chartColor} strokeWidth={2}
                                        fill={`url(#hgrad-ret-${h.id})`} dot={false} isAnimationActive={false}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* Add Transaction */}
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-3">Add Transaction</p>
                              {txHoldingId === h.id ? (
                                <form onSubmit={e => handleAddTransaction(e, h.id)}
                                  className="flex flex-wrap gap-3 items-end bg-white border border-stone-100 shadow-xl shadow-stone-200/50 rounded-3xl p-4">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">Type</label>
                                    <select value={txType} onChange={e => setTxType(e.target.value as "BUY" | "SELL")}
                                      className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs font-bold text-stone-800 outline-none">
                                      <option value="BUY">BUY</option>
                                      <option value="SELL">SELL</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">Quantity</label>
                                    <input value={txQty} onChange={e => setTxQty(e.target.value)}
                                      placeholder="0.00" type="number" step="any" min="0"
                                      className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs w-24 font-mono text-stone-800 outline-none focus:ring-1 focus:ring-white/20"
                                      required />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">Price (USD)</label>
                                    <input value={txPrice} onChange={e => setTxPrice(e.target.value)}
                                      placeholder="0.00" type="number" step="any" min="0"
                                      className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs w-28 font-mono text-stone-800 outline-none focus:ring-1 focus:ring-white/20"
                                      required />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">Fees</label>
                                    <input value={txFees} onChange={e => setTxFees(e.target.value)}
                                      placeholder="0.00" type="number" step="any" min="0"
                                      className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs w-20 font-mono text-stone-800 outline-none focus:ring-1 focus:ring-white/20" />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">Date</label>
                                    <input value={txDate} onChange={e => setTxDate(e.target.value)} type="date"
                                      className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs font-mono text-stone-800 outline-none focus:ring-1 focus:ring-white/20"
                                      required />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">Notes</label>
                                    <input value={txNotes} onChange={e => setTxNotes(e.target.value)}
                                      placeholder="optional"
                                      className="bg-stone-100 border border-stone-100 rounded-lg px-3 py-2 text-xs w-36 text-stone-800 outline-none focus:ring-1 focus:ring-white/20" />
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="submit" disabled={addingTx}
                                      className="bg-stone-200 hover:bg-white/15 text-stone-800 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all">
                                      {addingTx ? "Saving…" : "Save"}
                                    </button>
                                    <button type="button" onClick={() => setTxHoldingId(null)}
                                      className="text-stone-400 hover:text-stone-500 px-3.5 py-2 rounded-lg text-xs cursor-pointer transition-all">
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button onClick={() => openTxForm(h.id)}
                                  className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-stone-500 hover:text-stone-800 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer">
                                  + Add Transaction
                                </button>
                              )}
                            </div>

                            {/* Transaction History */}
                            {h.transactions.length > 0 && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-3">
                                  Transactions ({h.transactions.length})
                                </p>
                                <div className="overflow-x-auto rounded-xl border border-white/60">
                                  <table className="w-full text-left border-collapse min-w-[580px]">
                                    <thead>
                                      <tr className="border-b border-white/60 bg-white/[0.02]">
                                        {["Date", "Type", "Qty", "Price", "Fees", "Total", "Notes"].map(h2 => (
                                          <th key={h2} className="px-4 py-2.5 text-[9px] font-semibold text-stone-400 uppercase tracking-widest text-right first:text-left last:text-right">{h2}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                      {[...h.transactions]
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(tx => (
                                          <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-2.5 text-[10px] text-stone-400 font-mono">{tx.date}</td>
                                            <td className="px-4 py-2.5">
                                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                tx.type === "BUY" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"
                                              }`}>{tx.type}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[10px] font-mono text-stone-500 text-right">{fmtQty(tx.quantity)}</td>
                                            <td className="px-4 py-2.5 text-[10px] font-mono text-stone-500 text-right">{fmtUSD(tx.price)}</td>
                                            <td className="px-4 py-2.5 text-[10px] font-mono text-stone-400 text-right">
                                              {tx.fees > 0 ? fmtUSD(tx.fees) : "—"}
                                            </td>
                                            <td className="px-4 py-2.5 text-[10px] font-mono font-semibold text-stone-800 text-right">
                                              {fmtUSD(tx.quantity * tx.price + tx.fees)}
                                            </td>
                                            <td className="px-4 py-2.5 text-[9px] text-stone-400">{tx.notes || "—"}</td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
