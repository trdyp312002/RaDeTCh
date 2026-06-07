"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, Bot, RefreshCw } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type PortfolioKey = "retirement" | "long_term" | "short_term"

type HoldingRow = {
  id: string
  symbol: string
  name: string
  type: string
  portfolio: string
  quantity: number
  avgCost: number
  totalCost: number
}

type BotPosition = {
  symbol?: string
  side?: string
  size?: number
  entryPrice?: number
  unrealizedPnl?: number
  [key: string]: unknown
}

const PORTFOLIO_CONFIG: Record<PortfolioKey, {
  label: string
  color: string
  accent: string
  defaultSymbol?: string
  defaultName?: string
  assetType: string
  symbolHint: string
  presets?: string[]
}> = {
  retirement: {
    label: "Retirement",
    color: "text-indigo-400",
    accent: "border-indigo-500/40",
    defaultSymbol: "BTC-USD",
    defaultName: "Bitcoin",
    assetType: "crypto",
    symbolHint: "BTC-USD",
  },
  long_term: {
    label: "Long-term",
    color: "text-teal-400",
    accent: "border-teal-500/40",
    assetType: "stock",
    symbolHint: "AAPL, TSLA, NVDA…",
    presets: ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "SPY", "QQQ", "BRK-B"],
  },
  short_term: {
    label: "Short-term",
    color: "text-amber-400",
    accent: "border-amber-500/40",
    assetType: "crypto",
    symbolHint: "BTC-USD, ETH-USD…",
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrice(quotes: Record<string, any>, symbol: string): number {
  const q = quotes[symbol] ?? quotes[symbol.replace("-USD", "")]
  return q?.currentPrice ?? q?.price ?? q?.regularMarketPrice ?? 0
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PortfolioPanel({
  portfolioKey,
  displayCurrency,
  convertAmount,
}: {
  portfolioKey: PortfolioKey
  displayCurrency: "THB" | "USD"
  convertAmount: (a: number, from: string, to: string) => number
}) {
  const cfg = PORTFOLIO_CONFIG[portfolioKey]
  const prefix = displayCurrency === "THB" ? "฿" : "$"

  const [holdings, setHoldings] = useState<HoldingRow[]>([])
  const [quotes, setQuotes] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Bot state (short_term only)
  const [botPositions, setBotPositions] = useState<BotPosition[]>([])
  const [botPnl, setBotPnl] = useState<number | null>(null)
  const [botLoading, setBotLoading] = useState(false)
  const [botError, setBotError] = useState("")

  // Add form
  const [symbol, setSymbol] = useState(cfg.defaultSymbol ?? "")
  const [name, setName] = useState(cfg.defaultName ?? "")
  const [qty, setQty] = useState("")
  const [price, setPrice] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [fees, setFees] = useState("0")

  // ─── Fetch holdings ─────────────────────────────────────────────────────────

  const fetchHoldings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/holdings?portfolio=${portfolioKey}`)
      if (!res.ok) throw new Error()
      const data: HoldingRow[] = await res.json()
      setHoldings(data)

      const symbols = [...new Set(data.map(h => h.symbol))].filter(Boolean).join(",")
      if (symbols) {
        const qRes = await fetch(`/api/market?symbols=${symbols}`)
        if (qRes.ok) setQuotes(await qRes.json())
      }
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [portfolioKey])

  useEffect(() => { fetchHoldings() }, [fetchHoldings])

  // ─── Fetch bot positions (short_term only) ──────────────────────────────────

  const fetchBot = useCallback(async () => {
    if (portfolioKey !== "short_term") return
    setBotLoading(true)
    setBotError("")
    try {
      const res = await fetch("/api/bot/positions")
      if (!res.ok) throw new Error("Bot offline")
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const positions = Array.isArray(data.positions)
        ? data.positions
        : data.position
        ? [data.position]
        : []
      setBotPositions(positions)
      setBotPnl(data.totalPnl ?? data.pnl ?? null)
    } catch (e: any) {
      setBotError(e.message ?? "Bot unreachable")
    } finally { setBotLoading(false) }
  }, [portfolioKey])

  useEffect(() => { fetchBot() }, [fetchBot])

  // ─── Add holding ─────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symbol || !qty || !price) { setError("Symbol, quantity, and price are required"); return }
    setError("")
    setSubmitting(true)

    try {
      const upperSymbol = symbol.toUpperCase()

      // 1. Create or find holding
      let holdingId: string
      const existing = holdings.find(h => h.symbol === upperSymbol)

      if (existing) {
        holdingId = existing.id
      } else {
        const hRes = await fetch("/api/holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: upperSymbol,
            name: name || upperSymbol,
            type: cfg.assetType,
            portfolio: portfolioKey,
          }),
        })
        if (!hRes.ok) {
          const err = await hRes.json()
          throw new Error(err.error ?? "Failed to create holding")
        }
        const newHolding = await hRes.json()
        holdingId = newHolding.id
      }

      // 2. Add BUY transaction
      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdingId,
          type: "BUY",
          quantity: parseFloat(qty),
          price: parseFloat(price),
          fees: parseFloat(fees) || 0,
          date,
          notes: null,
        }),
      })
      if (!txRes.ok) throw new Error("Failed to add transaction")

      // Reset form
      setQty(""); setFees("0")
      if (!cfg.defaultSymbol) { setSymbol(""); setName("") }
      setShowAdd(false)
      await fetchHoldings()
    } catch (e: any) {
      setError(e.message ?? "Error adding position")
    } finally { setSubmitting(false) }
  }

  // ─── Delete holding ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/holdings/${id}`, { method: "DELETE" })
      setHoldings(prev => prev.filter(h => h.id !== id))
    } catch { /* silently fail */ }
  }

  // ─── Calculated totals ───────────────────────────────────────────────────────

  let totalValue = 0
  let totalCost = 0
  for (const h of holdings) {
    const p = getPrice(quotes, h.symbol)
    // Holdings are USD-priced
    totalValue += convertAmount(h.quantity * p, "USD", displayCurrency)
    totalCost += convertAmount(h.totalCost, "USD", displayCurrency)
  }
  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const fmt = (n: number) =>
    prefix + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`bg-white/[0.03] border ${cfg.accent} rounded-xl overflow-hidden`}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</p>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">{holdings.length} holdings</p>
          )}
        </div>
        {!loading && holdings.length > 0 && (
          <div className="text-right">
            <p className="text-sm font-mono font-semibold text-white">{fmt(totalValue)}</p>
            <p className={`text-xs font-mono ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)
            </p>
          </div>
        )}
        {loading && <Loader2 size={14} className="animate-spin text-gray-600" />}
      </div>

      {/* Holdings Table */}
      {!loading && holdings.length > 0 && (
        <div className="px-5 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-600 border-b border-white/5">
                  <th className="text-left pb-2 font-medium">Symbol</th>
                  <th className="text-right pb-2 font-medium">Qty</th>
                  <th className="text-right pb-2 font-medium">Avg Cost</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">Value</th>
                  <th className="text-right pb-2 font-medium">P&L</th>
                  <th className="w-8 pb-2" />
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const currentPrice = getPrice(quotes, h.symbol)
                  const value = convertAmount(h.quantity * currentPrice, "USD", displayCurrency)
                  const cost = convertAmount(h.totalCost, "USD", displayCurrency)
                  const pnl = value - cost
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
                  const avgCostDisp = convertAmount(h.avgCost, "USD", displayCurrency)
                  const priceDisp = convertAmount(currentPrice, "USD", displayCurrency)

                  return (
                    <tr key={h.id} className="border-b border-white/[0.03] group">
                      <td className="py-2 pr-3">
                        <p className="font-mono font-semibold text-white">{h.symbol}</p>
                        <p className="text-gray-600 truncate max-w-[100px]">{h.name}</p>
                      </td>
                      <td className="text-right py-2 font-mono text-gray-200">
                        {h.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })}
                      </td>
                      <td className="text-right py-2 font-mono text-gray-400">
                        {prefix}{avgCostDisp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-right py-2 font-mono text-gray-200">
                        {currentPrice > 0
                          ? prefix + priceDisp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="text-right py-2 font-mono text-white">
                        {currentPrice > 0 ? fmt(value) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="text-right py-2">
                        {currentPrice > 0 ? (
                          <div>
                            <p className={`font-mono font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                            </p>
                            <p className={`text-[10px] ${pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                            </p>
                          </div>
                        ) : <span className="text-gray-600 font-mono">—</span>}
                      </td>
                      <td className="text-right py-2">
                        <button onClick={() => handleDelete(h.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-rose-400 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bot positions (short_term) */}
      {portfolioKey === "short_term" && (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-400/70">
              <Bot size={12} />
              <span>AI Bot Positions</span>
            </div>
            <button onClick={fetchBot} disabled={botLoading}
              className="text-gray-600 hover:text-gray-400 transition-colors">
              <RefreshCw size={11} className={botLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {botError ? (
            <p className="text-xs text-gray-600">{botError}</p>
          ) : botPositions.length === 0 ? (
            <p className="text-xs text-gray-600">No open positions</p>
          ) : (
            <div className="space-y-1">
              {botPositions.map((pos, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${pos.side === "long" || pos.side === "buy" ? "bg-emerald-400" : "bg-rose-400"}`} />
                    <span className="font-mono font-semibold text-white">{pos.symbol ?? "?"}</span>
                    <span className="text-gray-600 uppercase">{pos.side}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-gray-400">
                      Size: {pos.size?.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                    </span>
                    {pos.unrealizedPnl != null && (
                      <span className={`font-mono font-semibold ${(pos.unrealizedPnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {(pos.unrealizedPnl ?? 0) >= 0 ? "+" : ""}${Number(pos.unrealizedPnl).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {botPnl != null && (
                <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-gray-500">Total Unrealized P&L</span>
                  <span className={`font-mono font-semibold ${botPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {botPnl >= 0 ? "+" : ""}${Number(botPnl).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/[0.04]" />

      {/* Add Button / Form */}
      <div className="px-5 py-3">
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)}
            className={`flex items-center gap-1.5 text-xs ${cfg.color} opacity-60 hover:opacity-100 transition-opacity`}>
            <Plus size={12} />
            {portfolioKey === "retirement" ? "Add DCA Entry" : portfolioKey === "long_term" ? "Add Stock" : "Add Position"}
          </button>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">

              {/* Symbol */}
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-1">Symbol</label>
                {cfg.defaultSymbol ? (
                  <input readOnly value={cfg.defaultSymbol}
                    className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono text-gray-500 outline-none cursor-not-allowed" />
                ) : (
                  <div>
                    <input
                      value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
                      placeholder={cfg.symbolHint}
                      className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-white/20 placeholder:text-gray-700"
                    />
                    {cfg.presets && symbol.length === 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cfg.presets.slice(0, 6).map(p => (
                          <button key={p} type="button" onClick={() => { setSymbol(p); setName(p) }}
                            className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-0.5 rounded transition-colors">
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Name */}
              {!cfg.defaultName && (
                <div>
                  <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-1">Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Company name"
                    className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-white/20 placeholder:text-gray-700" />
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-1">
                  {portfolioKey === "retirement" ? "BTC Amount" : "Shares / Qty"}
                </label>
                <input value={qty} onChange={e => setQty(e.target.value)} placeholder="0.00" type="number" step="any"
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-white/20 placeholder:text-gray-700" />
              </div>

              {/* Price */}
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-1">
                  Price (USD)
                </label>
                <input value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" type="number" step="any"
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-white/20 placeholder:text-gray-700" />
              </div>

              {/* Fees */}
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-1">Fees (USD)</label>
                <input value={fees} onChange={e => setFees(e.target.value)} placeholder="0" type="number" step="any"
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-white/20 placeholder:text-gray-700" />
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-1">Date</label>
                <input value={date} onChange={e => setDate(e.target.value)} type="date"
                  className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-white/20" />
              </div>
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <div className="flex items-center gap-2">
              <button type="submit" disabled={submitting}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${cfg.color.replace("text-", "bg-").replace("-400", "-600")} hover:opacity-90 text-white disabled:opacity-50 flex items-center gap-1.5`}>
                {submitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                {portfolioKey === "retirement" ? "Add DCA" : "Add"}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setError("") }}
                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
