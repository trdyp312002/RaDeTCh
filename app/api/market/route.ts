import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

type HistoryPoint = {
  date: string
  isoDate: string
  price: number
}

type Quote = {
  symbol: string
  currentPrice: number
  previousClose: number
  changePercent: number
  currency: string
  history: HistoryPoint[]
  stale?: boolean
}

const YAHOO_HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
]

const RANGE_INTERVAL: Record<string, string> = {
  "1d":  "5m",
  "5d":  "15m",
  "1mo": "1d",
  "3mo": "1d",
  "6mo": "1wk",
  "1y":  "1wk",
  "2y":  "1wk",
  "5y":  "1mo",
  "max": "3mo",
}

async function ensureCacheTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS price_cache (
      symbol TEXT PRIMARY KEY,
      data   TEXT NOT NULL,
      cached_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

async function fetchYahoo(symbol: string, range: string, noCache = false): Promise<Quote | null> {
  const interval = RANGE_INTERVAL[range] ?? "1d"
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
  }

  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers,
        ...(noCache ? { cache: "no-store" } : { next: { revalidate: 300 } }),
      })
      if (!res.ok) continue

      const json = await res.json()
      const result = json.chart?.result?.[0]
      if (!result) continue

      const { meta, timestamp, indicators } = result
      const closes: (number | null)[] = indicators?.quote?.[0]?.close ?? []
      if (!timestamp?.length) continue

      const intraday = range === "1d" || range === "5d"

      const history: HistoryPoint[] = (timestamp as number[])
        .map((ts: number, i: number) => {
          const d = new Date(ts * 1000)
          return {
            date: intraday
              ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            isoDate: d.toISOString().split("T")[0],
            price: closes[i],
          }
        })
        .filter((p): p is HistoryPoint => p.price != null)

      const currentPrice = meta.regularMarketPrice ?? history.at(-1)?.price ?? 0
      const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? history.at(-2)?.price ?? currentPrice
      const dailyChangePercent = meta.regularMarketChangePercent ??
        (previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0)

      // For non-1d ranges, show range-relative % (from first history point)
      const rangeBase = history[0]?.price
      const changePercent = range === "1d" || !rangeBase || rangeBase === 0
        ? dailyChangePercent
        : ((currentPrice - rangeBase) / rangeBase) * 100

      return { symbol, currentPrice, previousClose, changePercent, currency: meta.currency ?? "USD", history }
    } catch {
      // try next host
    }
  }
  return null
}

async function readCache(key: string): Promise<Quote | null> {
  try {
    const row = await db.execute({ sql: "SELECT data FROM price_cache WHERE symbol = ?", args: [key] })
    const raw = row.rows[0]?.data as string | undefined
    if (!raw) return null
    const q = JSON.parse(raw) as Quote
    q.stale = true
    return q
  } catch {
    return null
  }
}

async function writeCache(key: string, quote: Quote) {
  try {
    await db.execute({
      sql: `INSERT INTO price_cache (symbol, data, cached_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(symbol) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at`,
      args: [key, JSON.stringify(quote)],
    })
  } catch {
    // best-effort
  }
}

export async function GET(req: NextRequest) {
  const url     = new URL(req.url)
  const symbols = url.searchParams.get("symbols")?.split(",").filter(Boolean) ?? []
  const range   = url.searchParams.get("range") ?? "1mo"
  const isLive  = url.searchParams.get("live") === "1"
  if (symbols.length === 0) return NextResponse.json({})

  await ensureCacheTable()

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const cacheKey = range === "1mo" ? symbol : `${symbol}__${range}`
      const fresh = await fetchYahoo(symbol, range, isLive)
      if (fresh) {
        if (!isLive) await writeCache(cacheKey, fresh)
        return [symbol, fresh] as const
      }
      if (isLive) return [symbol, null] as const
      const cached = await readCache(cacheKey)
      return [symbol, cached] as const
    })
  )

  return NextResponse.json(Object.fromEntries(results), {
    headers: {
      "Cache-Control": isLive
        ? "no-store"
        : "s-maxage=300, stale-while-revalidate=60",
    },
  })
}
