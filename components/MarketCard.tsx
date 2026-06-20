"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { useLivePrice } from "@/hooks/useLivePrice"
import { isBinanceSupported } from "@/hooks/useBinancePrice"

type Quote = {
  currentPrice: number
  previousClose: number
  changePercent: number
  currency: string
  history: { date: string; price: number }[]
}

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "5Y"] as const
type Range = typeof RANGES[number]

const RANGE_PARAM: Record<Range, string> = {
  "1D": "1d",
  "1W": "5d",
  "1M": "1mo",
  "3M": "3mo",
  "1Y": "1y",
  "5Y": "5y",
}

const ACCENT_COLORS = {
  indigo:  { line: "#6366f1", stop: "#6366f1" },
  teal:    { line: "#14b8a6", stop: "#14b8a6" },
  amber:   { line: "#f59e0b", stop: "#f59e0b" },
  emerald: { line: "#10b981", stop: "#10b981" },
  rose:    { line: "#f43f5e", stop: "#f43f5e" },
  sky:     { line: "#0ea5e9", stop: "#0ea5e9" },
  violet:  { line: "#8b5cf6", stop: "#8b5cf6" },
  orange:  { line: "#fb923c", stop: "#fb923c" },
}

type AccentKey = keyof typeof ACCENT_COLORS

function fmtPrice(p: number) {
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 })
  if (p >= 100)   return p.toLocaleString("en-US", { maximumFractionDigits: 2 })
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

// Memoized chart — only re-renders when history array reference changes (on range switch)
const SparkChart = memo(function SparkChart({
  history,
  colors,
  gradId,
}: {
  history: { date: string; price: number }[]
  colors: { line: string; stop: string }
  gradId: string
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      <AreaChart data={history} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={colors.stop} stopOpacity={0.35} />
            <stop offset="95%" stopColor={colors.stop} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-white/95 shadow-xl border border-stone-100 rounded px-2 py-1 text-[10px] pointer-events-none">
                <p className="text-stone-500 text-[9px]">{payload[0].payload.date}</p>
                <p className="font-mono text-stone-800">{fmtPrice(payload[0].value as number)}</p>
              </div>
            )
          }}
        />
        <Area
          type="monotone" dataKey="price"
          stroke={colors.line} strokeWidth={1.5}
          fill={`url(#${gradId})`} dot={false} isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})

// Live price header — isolated sub-component so only this re-renders on price ticks
function LivePriceHeader({
  symbol,
  quote,
  onRetry,
  loading,
}: {
  symbol: string
  quote: Quote | null
  onRetry: () => void
  loading: boolean
}) {
  const live = useLivePrice(
    symbol,
    quote ? { price: quote.currentPrice, changePercent: quote.changePercent } : undefined
  )

  // Price: live (WebSocket/poll) takes priority — most current
  // %: always from quote — reflects selected range (daily for 1D, weekly for 1W, etc.)
  const displayPrice = live?.price         ?? quote?.currentPrice ?? null
  const displayPct   = quote?.changePercent ?? live?.changePercent ?? 0
  const up           = displayPct >= 0

  return (
    <div className="text-right shrink-0">
      {displayPrice !== null ? (
        <>
          <p className={`text-sm font-mono font-black leading-tight tabular-nums ${
            live?.flash === "up"   ? "price-flash-up"   :
            live?.flash === "down" ? "price-flash-down" : "text-[var(--color-on-surface)]"
          }`}>
            {fmtPrice(displayPrice)}
          </p>
          <div className={`flex items-center gap-0.5 justify-end text-[10px] font-mono tabular-nums ${up ? "text-emerald-600" : "text-rose-500"}`}>
            {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {up ? "+" : ""}{displayPct.toFixed(2)}%
          </div>
          {live && (
            <span className={`text-[7px] font-bold tracking-widest animate-pulse ${isBinanceSupported(symbol) ? "text-emerald-500" : "text-sky-500"}`}>
              {isBinanceSupported(symbol) ? "LIVE" : "15S"}
            </span>
          )}
        </>
      ) : loading ? (
        <div className="w-3 h-3 rounded-full border border-stone-200 border-t-white/60 animate-spin mt-1" />
      ) : (
        <button onClick={onRetry} className="text-stone-400 hover:text-stone-500">
          <RefreshCw size={11} />
        </button>
      )}
    </div>
  )
}

export default function MarketCard({
  symbol,
  name,
  accent = "indigo",
  defaultRange = "1M",
}: {
  symbol: string
  name: string
  accent?: AccentKey
  defaultRange?: Range
}) {
  const [range, setRange] = useState<Range>(defaultRange)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const colors = ACCENT_COLORS[accent]
  const gradId = `mc-${symbol.replace(/[^a-zA-Z0-9]/g, "")}`

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/market?symbols=${encodeURIComponent(symbol)}&range=${RANGE_PARAM[range]}`)
      .then(r => r.json())
      .then(d => { setQuote(d[symbol] ?? null) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [symbol, range])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-[var(--color-surface)] border-4 border-[var(--color-outline)] p-4 flex flex-col gap-2 brutal-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group">

      {/* Header row — LivePriceHeader subscribes to live price independently */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-mono font-black uppercase text-[var(--color-on-surface)] truncate">{symbol.replace("-USD", "")}</p>
          <p className="text-[9px] font-bold text-[var(--color-on-surface-variant)] uppercase truncate">{name}</p>
        </div>
        <LivePriceHeader symbol={symbol} quote={quote} onRetry={load} loading={loading} />
      </div>

      {/* SparkChart is memoized — won't re-render on price updates */}
      <div className="h-14">
        {quote?.history && quote.history.length > 1 ? (
          <SparkChart history={quote.history} colors={colors} gradId={gradId} />
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border border-stone-200 border-t-white/60 animate-spin" />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[9px] text-gray-700">
            {error ? "unavailable" : "no data"}
          </div>
        )}
      </div>

      {/* Range buttons */}
      <div className="flex gap-0.5">
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 text-[9px] font-bold py-1 border-2 border-[var(--color-outline)] transition-all ${
              range === r
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                : "text-[var(--color-on-surface)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
