"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string
  holding_id: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  fees: number
  date: string
  notes: string | null
}

type Holding = {
  id: string
  symbol: string
  name: string
  type: string
  quantity: number
  avgCost: number
  totalCost: number
  transactions: Transaction[]
}

type Quote = {
  currentPrice: number
  previousClose: number
  changePercent: number
  currency: string
  history: { date: string; price: number }[]
}

type FinanceItem = {
  id: string
  category: "cash" | "other_asset" | "liability"
  label: string
  amount: number
  currency: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })

const usd = (n: number) => "$" + fmt(n, n >= 1 || n === 0 ? 2 : 6)
const pct = (n: number) => (n >= 0 ? "+" : "−") + fmt(Math.abs(n)) + "%"
const sign = (n: number) => (n >= 0 ? "+" : "−")

function toUSD(amount: number, currency: string, rates: Record<string, number>) {
  if (currency === "USD") return amount
  return amount / (rates[currency] ?? 1)
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Sparkline({ data, up }: { data: { date: string; price: number }[]; up: boolean }) {
  const color = up ? "#16a34a" : "#dc2626"
  return (
    <div className="h-10 w-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 1, right: 0, left: 0, bottom: 1 }}>
          <defs>
            <linearGradient id={`sg${up ? "g" : "r"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5}
            fill={`url(#sg${up ? "g" : "r"})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartTip({ active, payload }: { active?: boolean; payload?: { payload: { date: string }; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white px-2.5 py-1.5 rounded-lg text-xs shadow-xl">
      <div className="text-gray-400 text-[10px]">{payload[0].payload.date}</div>
      <div className="font-semibold">{usd(payload[0].value)}</div>
    </div>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Add Holding Form ──────────────────────────────────────────────────────────

function AddHoldingModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [symbol, setSymbol] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("stock")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), name, type }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      onSave()
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Add Asset" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Symbol</label>
          <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
            placeholder="AAPL, BTC-USD, SPY…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 font-mono"
            required />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Apple, Bitcoin…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            required />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
            <option value="stock">Stock</option>
            <option value="etf">ETF</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button disabled={loading}
          className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 mt-2">
          {loading ? "Adding…" : "Add Asset"}
        </button>
      </form>
    </Modal>
  )
}

// ─── Add Transaction Form ──────────────────────────────────────────────────────

function AddTransactionModal({ holding, onClose, onSave }: {
  holding: Holding
  onClose: () => void
  onSave: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [txType, setTxType] = useState<"BUY" | "SELL">("BUY")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [fees, setFees] = useState("0")
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdingId: holding.id,
          type: txType,
          quantity: parseFloat(quantity),
          price: parseFloat(price),
          fees: parseFloat(fees) || 0,
          date,
          notes: notes || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      onSave()
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal title={`Transaction — ${holding.symbol}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          {(["BUY", "SELL"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTxType(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                txType === t
                  ? t === "BUY" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>{t}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
            <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" step="any" min="0"
              placeholder="0.00" required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Price (USD)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="any" min="0"
              placeholder="0.00" required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fees (USD)</label>
            <input value={fees} onChange={e => setFees(e.target.value)} type="number" step="any" min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input value={date} onChange={e => setDate(e.target.value)} type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Dollar cost average"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button disabled={loading}
          className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
          {loading ? "Saving…" : "Save Transaction"}
        </button>
      </form>
    </Modal>
  )
}

// ─── Finance Item Form ─────────────────────────────────────────────────────────

function AddFinanceModal({ editItem, onClose, onSave }: {
  editItem?: FinanceItem | null
  onClose: () => void
  onSave: () => void
}) {
  const [category, setCategory] = useState<FinanceItem["category"]>(editItem?.category ?? "cash")
  const [label, setLabel] = useState(editItem?.label ?? "")
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : "")
  const [currency, setCurrency] = useState(editItem?.currency ?? "USD")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editItem ? `/api/finance/${editItem.id}` : "/api/finance"
      const method = editItem ? "PUT" : "POST"
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, label, amount: parseFloat(amount), currency }),
      })
      onSave()
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal title={editItem ? "Edit Item" : "Add Finance Item"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as FinanceItem["category"])}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
            <option value="cash">Cash & Equivalents</option>
            <option value="other_asset">Other Asset</option>
            <option value="liability">Liability / Debt</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Label</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Kasikorn Bank"
            required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="any" min="0"
              required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
              <option value="USD">USD</option>
              <option value="THB">THB</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>
        <button disabled={loading}
          className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
          {loading ? "Saving…" : editItem ? "Update" : "Add Item"}
        </button>
      </form>
    </Modal>
  )
}

// ─── Balance Sheet View ────────────────────────────────────────────────────────

function BalanceSheet({ holdings, quotes, financeItems, fxRates, onAddFinance, onEditFinance, onDeleteFinance }: {
  holdings: Holding[]
  quotes: Record<string, Quote>
  financeItems: FinanceItem[]
  fxRates: Record<string, number>
  onAddFinance: () => void
  onEditFinance: (item: FinanceItem) => void
  onDeleteFinance: (id: string) => void
}) {
  const cash = financeItems.filter(i => i.category === "cash")
  const other = financeItems.filter(i => i.category === "other_asset")
  const liabs = financeItems.filter(i => i.category === "liability")

  const cashTotal = cash.reduce((s, i) => s + toUSD(i.amount, i.currency, fxRates), 0)
  const investTotal = holdings.reduce((s, h) => s + h.quantity * (quotes[h.symbol]?.currentPrice ?? h.avgCost), 0)
  const otherTotal = other.reduce((s, i) => s + toUSD(i.amount, i.currency, fxRates), 0)
  const liabTotal = liabs.reduce((s, i) => s + toUSD(i.amount, i.currency, fxRates), 0)
  const totalAssets = cashTotal + investTotal + otherTotal
  const netWorth = totalAssets - liabTotal

  function BSRow({ item }: { item: FinanceItem }) {
    const usdVal = toUSD(item.amount, item.currency, fxRates)
    const origStr = item.currency !== "USD"
      ? `${item.currency} ${item.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : ""
    return (
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 group">
        <div>
          <p className="text-sm text-gray-700">{item.label}</p>
          {origStr && <p className="text-[10px] text-gray-400 font-mono">{origStr}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 tabular-nums">{usd(usdVal)}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEditFinance(item)} className="text-[10px] text-gray-400 hover:text-gray-700 px-1">edit</button>
            <button onClick={() => onDeleteFinance(item.id)} className="text-[10px] text-red-400 hover:text-red-600 px-1">×</button>
          </div>
        </div>
      </div>
    )
  }

  function Section({ title, rows, subtotal }: { title: string; rows: FinanceItem[]; subtotal: number }) {
    return (
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-2">{title}</p>
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          {rows.length === 0
            ? <p className="px-4 py-3 text-sm text-gray-300">None added yet</p>
            : rows.map(r => <BSRow key={r.id} item={r} />)}
          <div className="flex justify-between px-4 py-2.5 bg-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subtotal</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{usd(subtotal)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-1">Balance Sheet</p>
          <p className="text-xs text-gray-400">As of {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button onClick={onAddFinance}
          className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-all">
          + Add Item
        </button>
      </div>

      <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Assets</p>
      <Section title="Cash & Equivalents" rows={cash} subtotal={cashTotal} />

      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-2">Investments</p>
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          {holdings.length === 0
            ? <p className="px-4 py-3 text-sm text-gray-300">No holdings</p>
            : holdings.map(h => {
              const q = quotes[h.symbol]
              const val = h.quantity * (q?.currentPrice ?? h.avgCost)
              return (
                <div key={h.id} className="flex justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{h.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{h.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })} {h.symbol.replace("-USD", "")}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 tabular-nums">{usd(val)}</p>
                </div>
              )
            })}
          <div className="flex justify-between px-4 py-2.5 bg-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subtotal</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{usd(investTotal)}</p>
          </div>
        </div>
      </div>

      <Section title="Other Assets" rows={other} subtotal={otherTotal} />

      <div className="flex items-center justify-between px-4 py-4 bg-gray-900 rounded-2xl mb-6">
        <p className="text-xs font-bold text-white uppercase tracking-wider">Total Assets</p>
        <p className="text-lg font-bold text-white tabular-nums">{usd(totalAssets)}</p>
      </div>

      <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Liabilities</p>
      <Section title="Debts & Obligations" rows={liabs} subtotal={liabTotal} />

      <div className="flex items-center justify-between px-4 py-4 border border-red-100 bg-red-50 rounded-2xl mb-6">
        <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Total Liabilities</p>
        <p className="text-lg font-bold text-red-700 tabular-nums">{usd(liabTotal)}</p>
      </div>

      <div className={`flex items-center justify-between px-5 py-5 rounded-2xl border-2 ${
        netWorth >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${netWorth >= 0 ? "text-emerald-700" : "text-red-700"}`}>Net Worth</p>
          <p className="text-[10px] text-gray-400">Assets − Liabilities</p>
        </div>
        <p className={`text-2xl font-bold tabular-nums ${netWorth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
          {netWorth < 0 ? "−" : ""}{usd(netWorth)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-gray-300">
        {["THB", "JPY"].filter(k => fxRates[k]).map(k => (
          <span key={k} className="font-mono">1 USD = {fxRates[k].toFixed(2)} {k}</span>
        ))}
        <span>· amounts converted to USD</span>
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function InvestmentDashboard() {
  const [tab, setTab] = useState<"portfolio" | "balance">("portfolio")
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([])
  const [fxRates, setFxRates] = useState<Record<string, number>>({ THB: 35.5, JPY: 150 })
  const [selected, setSelected] = useState<string>("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Modals
  const [showAddHolding, setShowAddHolding] = useState(false)
  const [addTxFor, setAddTxFor] = useState<Holding | null>(null)
  const [editFinance, setEditFinance] = useState<FinanceItem | null | undefined>(undefined)

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadHoldings = useCallback(async () => {
    const res = await fetch("/api/holdings")
    const data: Holding[] = await res.json()
    setHoldings(data)
    if (data.length > 0 && !selected) setSelected(data[0].symbol)
    return data
  }, [selected])

  const loadQuotes = useCallback(async (holdingList: Holding[]) => {
    if (holdingList.length === 0) return
    const symbols = holdingList.map(h => h.symbol).join(",")
    const res = await fetch(`/api/market?symbols=${symbols}`)
    const data: Record<string, Quote> = await res.json()
    setQuotes(data)
    setLastRefresh(new Date())
  }, [])

  const loadFinance = useCallback(async () => {
    const res = await fetch("/api/finance")
    const data: FinanceItem[] = await res.json()
    setFinanceItems(data)
  }, [])

  const loadFX = useCallback(async () => {
    const res = await fetch("/api/fx")
    const { rates } = await res.json()
    setFxRates(rates)
  }, [])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const h = await loadHoldings()
      await Promise.all([loadQuotes(h), loadFinance(), loadFX()])
    } finally {
      setRefreshing(false)
    }
  }, [loadHoldings, loadQuotes, loadFinance, loadFX])

  const refreshPrices = useCallback(async () => {
    if (holdings.length === 0) return
    setRefreshing(true)
    try { await loadQuotes(holdings) }
    finally { setRefreshing(false) }
  }, [holdings, loadQuotes])

  useEffect(() => { refreshAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh prices every 5 minutes
  useEffect(() => {
    const id = setInterval(refreshPrices, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [refreshPrices])

  // ── Portfolio calculations ────────────────────────────────────────────────────

  const totals = useMemo(() => {
    let value = 0, cost = 0, todayPL = 0
    for (const h of holdings) {
      const q = quotes[h.symbol]
      const price = q?.currentPrice ?? h.avgCost
      value += h.quantity * price
      cost += h.totalCost
      if (q) todayPL += h.quantity * (q.currentPrice - q.previousClose)
    }
    return { value, cost, pl: value - cost, plPct: cost > 0 ? ((value - cost) / cost) * 100 : 0, todayPL }
  }, [holdings, quotes])

  const selectedHolding = holdings.find(h => h.symbol === selected)
  const selectedQuote = quotes[selected]
  const chartColor = selectedQuote?.changePercent >= 0 ? "#16a34a" : "#dc2626"

  // ── Delete helpers ────────────────────────────────────────────────────────────

  async function deleteHolding(id: string) {
    if (!confirm("Delete this holding and all its transactions?")) return
    await fetch(`/api/holdings/${id}`, { method: "DELETE" })
    refreshAll()
  }

  async function deleteTx(id: string) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    refreshAll()
  }

  async function deleteFinance(id: string) {
    if (!confirm("Delete this item?")) return
    await fetch(`/api/finance/${id}`, { method: "DELETE" })
    loadFinance()
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white px-6 pt-10 pb-24">
      <div className="max-w-4xl mx-auto">

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-100 mb-8 -mx-1">
          {(["portfolio", "balance"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-medium tracking-wide transition-all border-b-2 -mb-px ${
                tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
              {t === "portfolio" ? "Portfolio" : "Balance Sheet"}
            </button>
          ))}
        </div>

        {/* ── BALANCE SHEET ── */}
        {tab === "balance" && (
          <BalanceSheet
            holdings={holdings} quotes={quotes} financeItems={financeItems} fxRates={fxRates}
            onAddFinance={() => setEditFinance(null)}
            onEditFinance={item => setEditFinance(item)}
            onDeleteFinance={deleteFinance}
          />
        )}

        {/* ── PORTFOLIO ── */}
        {tab === "portfolio" && (<>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-3">Portfolio</p>
              <div className="text-4xl font-bold text-gray-900 tracking-tight mb-1">{usd(totals.value)}</div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={`text-sm font-medium ${totals.pl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {sign(totals.pl)}{usd(totals.pl)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  totals.pl >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}>{pct(totals.plPct)}</span>
                <span className="text-xs text-gray-400">total return</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs">
                <span className={totals.todayPL >= 0 ? "text-emerald-600" : "text-red-500"}>
                  {sign(totals.todayPL)}{usd(totals.todayPL)} today
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">Cost {usd(totals.cost)}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <button onClick={() => setShowAddHolding(true)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-all">
                  + Add
                </button>
                <button onClick={refreshPrices} disabled={refreshing}
                  className="text-xs text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-40 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" className={refreshing ? "animate-spin" : ""}>
                    <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  {refreshing ? "Updating…" : "Refresh"}
                </button>
              </div>
              {lastRefresh && (
                <span className="text-[10px] text-gray-300">
                  Updated {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <span className="text-[10px] text-gray-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Auto-refresh 5 min
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100 mb-8" />

          {/* Holdings grid */}
          {holdings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-300 text-sm mb-4">No assets yet</p>
              <button onClick={() => setShowAddHolding(true)}
                className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-all">
                + Add your first asset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {holdings.map(h => {
                const q = quotes[h.symbol]
                if (!q && h.quantity === 0) return null
                const price = q?.currentPrice ?? h.avgCost
                const value = h.quantity * price
                const pl = value - h.totalCost
                const plPct = h.totalCost > 0 ? (pl / h.totalCost) * 100 : 0
                const up = (q?.changePercent ?? 0) >= 0
                const isSelected = selected === h.symbol

                return (
                  <div key={h.id}
                    onClick={() => setSelected(h.symbol)}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-sm ${
                      isSelected ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"
                    }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-0.5">{h.type}</p>
                        <p className="text-sm font-bold text-gray-900">{h.symbol.replace("-USD", "")}</p>
                        <p className="text-xs text-gray-400">{h.name}</p>
                      </div>
                      {q && <Sparkline data={q.history.slice(-14)} up={up} />}
                    </div>

                    <div className="mb-3">
                      <div className="text-lg font-semibold text-gray-900">{usd(price)}</div>
                      {q && <div className={`text-xs font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
                        {pct(q.changePercent)} today
                      </div>}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{usd(value)}</p>
                        <p className="text-[10px] text-gray-400">{h.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })} units</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${pl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {sign(pl)}{usd(pl)}
                        </p>
                        <p className={`text-[10px] ${plPct >= 0 ? "text-emerald-500" : "text-red-400"}`}>{pct(plPct)}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setAddTxFor(h)}
                        className="text-[10px] text-gray-400 hover:text-emerald-600 transition-colors">+ Transaction</button>
                      <button onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                        className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors ml-auto">
                        {h.transactions.length} tx {expanded === h.id ? "▲" : "▼"}
                      </button>
                      <button onClick={() => deleteHolding(h.id)}
                        className="text-[10px] text-red-300 hover:text-red-500 transition-colors">delete</button>
                    </div>

                    {/* Transaction list */}
                    {expanded === h.id && (
                      <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                        {h.transactions.length === 0
                          ? <p className="text-[10px] text-gray-300">No transactions yet</p>
                          : [...h.transactions].sort((a, b) => b.date.localeCompare(a.date)).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between text-[10px] py-1 border-b border-gray-50 last:border-0 group">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${tx.type === "BUY" ? "text-emerald-600" : "text-red-500"}`}>{tx.type}</span>
                                <span className="text-gray-500">{tx.quantity} @ {usd(tx.price)}</span>
                                <span className="text-gray-300">{tx.date.slice(0, 10)}</span>
                              </div>
                              <button onClick={() => deleteTx(tx.id)}
                                className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">×</button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Chart */}
          {selectedHolding && selectedQuote && (
            <div className="border border-gray-100 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">
                    {selectedHolding.symbol.replace("-USD", "")} · 30-Day Price
                  </p>
                  <div className="text-2xl font-bold text-gray-900">{usd(selectedQuote.currentPrice)}</div>
                  <div className={`text-sm font-medium mt-0.5 ${selectedQuote.changePercent >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {pct(selectedQuote.changePercent)} today
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Holding</p>
                  <p className="text-sm font-semibold text-gray-900">{usd(selectedHolding.quantity * selectedQuote.currentPrice)}</p>
                  <p className="text-xs text-gray-400">Avg cost {usd(selectedHolding.avgCost)}</p>
                </div>
              </div>

              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedQuote.history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={50}
                      tickFormatter={(v: number) => "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v.toFixed(0))}
                      domain={["auto", "auto"]} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2} fill="url(#cg)"
                      dot={false} activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                <span>Avg cost {usd(selectedHolding.avgCost)}</span>
                <span>·</span>
                <span className={selectedHolding.quantity * selectedQuote.currentPrice - selectedHolding.totalCost >= 0 ? "text-emerald-600" : "text-red-500"}>
                  {sign(selectedHolding.quantity * selectedQuote.currentPrice - selectedHolding.totalCost)}
                  {usd(Math.abs(selectedHolding.quantity * selectedQuote.currentPrice - selectedHolding.totalCost))} unrealized
                </span>
                <button onClick={() => setAddTxFor(selectedHolding)}
                  className="ml-auto border border-gray-200 rounded-xl px-3 py-1 hover:border-gray-400 hover:text-gray-900 transition-all">
                  + Transaction
                </button>
              </div>
            </div>
          )}

        </>)}

        {/* ── MODALS ── */}
        {showAddHolding && (
          <AddHoldingModal onClose={() => setShowAddHolding(false)} onSave={refreshAll} />
        )}
        {addTxFor && (
          <AddTransactionModal holding={addTxFor} onClose={() => setAddTxFor(null)} onSave={refreshAll} />
        )}
        {editFinance !== undefined && (
          <AddFinanceModal editItem={editFinance} onClose={() => setEditFinance(undefined)} onSave={loadFinance} />
        )}

      </div>
    </div>
  )
}
