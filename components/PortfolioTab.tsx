"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
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
  // Calculated by calcPosition
  quantity: number
  avgCost: number
  totalCost: number
  transactions: Transaction[]
  // Enriched client-side from Yahoo Finance
  currentPrice?: number
  currentValue?: number
  unrealizedPnl?: number
  unrealizedPnlPct?: number
  priceHistory?: { date: string; price: number }[]
}

type Props = {
  portfolio: PortfolioType
  displayCurrency: "THB" | "USD"
  fxRates: Record<string, number>
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PORTFOLIO_CONFIG: Record<PortfolioType, {
  label: string; emoji: string; description: string; symbolHint: string; defaultType: string
}> = {
  long_term: {
    label: "Long-term Portfolio",
    emoji: "📈",
    description: "US stocks — buy and hold for long-term capital growth.",
    symbolHint: "e.g. AAPL, VOO, MSFT",
    defaultType: "stock"
  },
  short_term: {
    label: "Short-term Portfolio",
    emoji: "🤖",
    description: "AI bot trading — short-term positions managed by automated strategies.",
    symbolHint: "e.g. TSLA, NVDA, SPY",
    defaultType: "stock"
  },
  retirement: {
    label: "Retirement Portfolio",
    emoji: "₿",
    description: "Bitcoin DCA accumulation — long-term store of value and retirement reserve.",
    symbolHint: "BTC-USD",
    defaultType: "crypto"
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PortfolioTab({ portfolio, displayCurrency, fxRates }: Props) {
  const cfg = PORTFOLIO_CONFIG[portfolio]
  const thbRate = fxRates.THB || 35.5

  // ── Formatters ──
  const toDisplay = (usd: number) => displayCurrency === "THB" ? usd * thbRate : usd
  const sym = displayCurrency === "THB" ? "฿" : "$"
  const fmt = (n: number) =>
    sym + toDisplay(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtUSD = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtQty = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 8 })

  // ── State ──
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Add Holding form
  const [showAddHolding, setShowAddHolding] = useState(false)
  const [newSymbol, setNewSymbol] = useState("")
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState(cfg.defaultType)
  const [addingHolding, setAddingHolding] = useState(false)
  const [addHoldingError, setAddHoldingError] = useState("")

  // Add Transaction form
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

      // Enrich with live market prices
      const withQty = data.filter(h => h.quantity > 0 || h.transactions.length > 0)
      if (withQty.length > 0) {
        const symbols = [...new Set(withQty.map(h => h.symbol))].join(",")
        try {
          const mRes = await fetch(`/api/market?symbols=${symbols}`)
          const quotes = await mRes.json()

          setHoldings(data.map(h => {
            const q = quotes[h.symbol]
            if (q && h.quantity > 0) {
              const currentValue = h.quantity * q.currentPrice
              const unrealizedPnl = currentValue - h.totalCost
              const unrealizedPnlPct = h.totalCost > 0 ? (unrealizedPnl / h.totalCost) * 100 : 0
              return {
                ...h,
                currentPrice: q.currentPrice,
                currentValue,
                unrealizedPnl,
                unrealizedPnlPct,
                priceHistory: q.history ?? []
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
  const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0)
  const totalValue = holdings.reduce((s, h) => s + (h.currentValue ?? 0), 0)
  const totalPnl = totalValue > 0 ? totalValue - totalCost : 0
  const totalPnlPct = totalCost > 0 && totalValue > 0 ? (totalPnl / totalCost) * 100 : 0
  const hasMarketData = holdings.some(h => h.currentPrice != null)

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
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase().trim(),
          name: newName.trim(),
          type: newType,
          portfolio
        })
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
    } catch (e) {
      console.error(e)
    }
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
          holdingId,
          type: txType,
          quantity: parseFloat(txQty),
          price: parseFloat(txPrice),
          fees: parseFloat(txFees) || 0,
          date: txDate,
          notes: txNotes || null
        })
      })
      if (!res.ok) return
      setTxQty(""); setTxPrice(""); setTxFees("0"); setTxNotes(""); setTxHoldingId(null)
      await fetchHoldings()
    } catch (e) {
      console.error(e)
    } finally {
      setAddingTx(false)
    }
  }

  const handleDeleteTransaction = async (txId: string) => {
    try {
      await fetch(`/api/transactions/${txId}`, { method: "DELETE" })
      await fetchHoldings()
    } catch (e) {
      console.error(e)
    }
  }

  const openTxForm = (holdingId: string) => {
    setTxHoldingId(holdingId)
    setTxType("BUY")
    setTxQty(""); setTxPrice(""); setTxFees("0"); setTxNotes("")
    setTxDate(new Date().toISOString().slice(0, 10))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Header Summary Banner ── */}
      <div className="bg-gradient-to-br from-gray-900 to-slate-800 border border-slate-700/50 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-semibold mb-1.5">
              {cfg.emoji} {cfg.label}
            </p>
            <p className="text-xs text-gray-400 mb-5 max-w-md">{cfg.description}</p>
            <div className="flex gap-6 flex-wrap">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">Total Invested</p>
                <p className="text-2xl font-extrabold font-mono">{fmt(totalCost)}</p>
                {displayCurrency === "THB" && totalCost > 0 && (
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">~{fmtUSD(totalCost)}</p>
                )}
              </div>
              {hasMarketData && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">Market Value</p>
                  <p className={`text-2xl font-extrabold font-mono ${totalValue > totalCost ? "text-emerald-400" : "text-rose-400"}`}>
                    {fmt(totalValue)}
                  </p>
                  {displayCurrency === "THB" && totalValue > 0 && (
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">~{fmtUSD(totalValue)}</p>
                  )}
                </div>
              )}
              {hasMarketData && totalCost > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-0.5">Unrealized P&L</p>
                  <p className={`text-2xl font-extrabold font-mono ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)}
                  </p>
                  <p className={`text-[10px] font-bold font-mono mt-0.5 ${totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {totalPnl >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}% ROI
                  </p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => { setShowAddHolding(!showAddHolding); setAddHoldingError("") }}
            className="flex-shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            + Add Holding
          </button>
        </div>
      </div>

      {/* ── Add Holding Form ── */}
      {showAddHolding && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-fadeIn">
          <h4 className="text-sm font-bold text-gray-900 mb-4">New Holding</h4>
          <form onSubmit={handleAddHolding} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold block mb-1.5">Symbol</label>
              <input
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value)}
                placeholder={cfg.symbolHint}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono w-36 focus:outline-none focus:border-gray-400"
                required
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold block mb-1.5">Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Apple Inc."
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-52 focus:outline-none focus:border-gray-400"
                required
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold block mb-1.5">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingHolding}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50"
              >
                {addingHolding ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddHolding(false); setNewSymbol(""); setNewName(""); setAddHoldingError("") }}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
          {addHoldingError && (
            <p className="text-xs text-rose-500 mt-3 font-semibold">{addHoldingError}</p>
          )}
        </div>
      )}

      {/* ── Holdings Table ── */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 shadow-sm text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-xs">Loading holdings…</p>
        </div>
      ) : holdings.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 shadow-sm text-center">
          <p className="text-3xl mb-4">{cfg.emoji}</p>
          <p className="text-gray-500 text-sm font-semibold mb-1">{cfg.label}</p>
          <p className="text-gray-400 text-xs mb-6">No holdings yet. Add your first position to start tracking.</p>
          <button
            onClick={() => setShowAddHolding(true)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 cursor-pointer transition-all"
          >
            + Add First Holding
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-3 flex justify-between items-center border-b border-gray-50">
            <h4 className="text-sm font-bold text-gray-900">Holdings</h4>
            <span className="text-[10px] text-gray-400 font-semibold">
              {holdings.length} position{holdings.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Symbol / Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Avg Cost</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Cost</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Live Price</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Market Value</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">P&L</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <>
                    {/* ── Main Row ── */}
                    <tr
                      key={h.id}
                      className={`border-b border-gray-50 hover:bg-indigo-50/20 transition-colors cursor-pointer ${
                        expandedId === h.id ? "bg-indigo-50/30 border-indigo-100/50" : ""
                      }`}
                      onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[8px] w-4 text-center font-extrabold ${
                            expandedId === h.id ? "text-indigo-500" : "text-gray-400"
                          }`}>
                            {expandedId === h.id ? "▲" : "▼"}
                          </span>
                          <div>
                            <span className="text-sm font-extrabold text-gray-900 font-mono">{h.symbol}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {h.name} · <span className="capitalize">{h.type}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700 text-right">
                        {fmtQty(h.quantity)}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 text-right">
                        {h.avgCost > 0 ? fmtUSD(h.avgCost) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700 text-right">
                        {h.totalCost > 0 ? fmt(h.totalCost) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-right">
                        {h.currentPrice != null ? (
                          <span className="text-blue-600 font-semibold">{fmtUSD(h.currentPrice)}</span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-800 text-right">
                        {h.currentValue != null ? fmt(h.currentValue) : <span className="text-gray-300 text-[10px]">—</span>}
                      </td>
                      <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${
                        h.unrealizedPnl != null
                          ? h.unrealizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"
                          : "text-gray-300"
                      }`}>
                        {h.unrealizedPnl != null ? (
                          <div>
                            <span>{h.unrealizedPnl >= 0 ? "+" : ""}{fmt(h.unrealizedPnl)}</span>
                            <span className="text-[9px] block font-semibold mt-0.5">
                              {h.unrealizedPnlPct != null && `${h.unrealizedPnlPct >= 0 ? "+" : ""}${h.unrealizedPnlPct.toFixed(2)}%`}
                            </span>
                          </div>
                        ) : <span className="text-[10px]">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteHolding(h.id, h.symbol)}
                          className="text-[10px] text-rose-400 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {/* ── Expanded Detail Row ── */}
                    {expandedId === h.id && (
                      <tr key={`${h.id}-expanded`}>
                        <td colSpan={8} className="bg-gray-50/40 border-b border-gray-100 px-6 py-6">
                          <div className="space-y-6">

                            {/* Price Chart */}
                            {h.priceHistory && h.priceHistory.length > 1 && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                                  30-Day Price History · {h.symbol}
                                </p>
                                <div className="h-36">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                      data={h.priceHistory.slice(-30)}
                                      margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
                                    >
                                      <defs>
                                        <linearGradient id={`grad-${h.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                                      <Tooltip
                                        contentStyle={{
                                          background: "#1e293b", border: "none",
                                          borderRadius: "8px", fontSize: "11px", color: "#f1f5f9"
                                        }}
                                        formatter={(v) => [`$${Number(v).toFixed(2)}`, "Price"]}
                                      />
                                      <Area
                                        type="monotone" dataKey="price"
                                        stroke="#6366f1" strokeWidth={2}
                                        fillOpacity={1} fill={`url(#grad-${h.id})`} dot={false}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* Add Transaction */}
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                                Add Transaction
                              </p>
                              {txHoldingId === h.id ? (
                                <form
                                  onSubmit={e => handleAddTransaction(e, h.id)}
                                  className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-2xl p-4"
                                >
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Type</label>
                                    <select
                                      value={txType}
                                      onChange={e => setTxType(e.target.value as "BUY" | "SELL")}
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none"
                                    >
                                      <option value="BUY">BUY</option>
                                      <option value="SELL">SELL</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Quantity</label>
                                    <input
                                      value={txQty} onChange={e => setTxQty(e.target.value)}
                                      placeholder="0.00" type="number" step="any" min="0"
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-24 font-mono focus:outline-none"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Price (USD)</label>
                                    <input
                                      value={txPrice} onChange={e => setTxPrice(e.target.value)}
                                      placeholder="0.00" type="number" step="any" min="0"
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-28 font-mono focus:outline-none"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Fees</label>
                                    <input
                                      value={txFees} onChange={e => setTxFees(e.target.value)}
                                      placeholder="0.00" type="number" step="any" min="0"
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-20 font-mono focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Date</label>
                                    <input
                                      value={txDate} onChange={e => setTxDate(e.target.value)}
                                      type="date"
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">Notes</label>
                                    <input
                                      value={txNotes} onChange={e => setTxNotes(e.target.value)}
                                      placeholder="optional"
                                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-36 focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="submit" disabled={addingTx}
                                      className="bg-gray-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 hover:bg-gray-800 transition-all"
                                    >
                                      {addingTx ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                      type="button" onClick={() => setTxHoldingId(null)}
                                      className="bg-gray-100 text-gray-600 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-200 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  onClick={() => openTxForm(h.id)}
                                  className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold hover:border-gray-400 hover:text-gray-900 transition-all cursor-pointer"
                                >
                                  + Add Transaction
                                </button>
                              )}
                            </div>

                            {/* Transaction History */}
                            {h.transactions.length > 0 && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                                  Transaction History ({h.transactions.length})
                                </p>
                                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                  <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Qty</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Price</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Fees</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Total</th>
                                        <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Notes</th>
                                        <th className="px-4 py-3"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                      {[...h.transactions]
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(tx => (
                                          <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">{tx.date}</td>
                                            <td className="px-4 py-3">
                                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                                tx.type === "BUY"
                                                  ? "bg-emerald-50 text-emerald-600"
                                                  : "bg-rose-50 text-rose-600"
                                              }`}>
                                                {tx.type}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono text-gray-700 text-right">{fmtQty(tx.quantity)}</td>
                                            <td className="px-4 py-3 text-xs font-mono text-gray-700 text-right">{fmtUSD(tx.price)}</td>
                                            <td className="px-4 py-3 text-xs font-mono text-gray-500 text-right">
                                              {tx.fees > 0 ? fmtUSD(tx.fees) : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-800 text-right">
                                              {fmtUSD(tx.quantity * tx.price + tx.fees)}
                                            </td>
                                            <td className="px-4 py-3 text-[10px] text-gray-400">{tx.notes || "—"}</td>
                                            <td className="px-4 py-3 text-right">
                                              <button
                                                onClick={() => handleDeleteTransaction(tx.id)}
                                                className="text-[9px] text-rose-300 hover:text-rose-500 font-bold cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-50 transition-all"
                                              >
                                                ✕
                                              </button>
                                            </td>
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
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
