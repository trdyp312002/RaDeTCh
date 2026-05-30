import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

type Quote = {
  symbol: string
  currentPrice: number
  previousClose: number
  changePercent: number
  currency: string
  history: { date: string; price: number }[]
  stale?: boolean
}

const YAHOO_HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
]

async function ensureCacheTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS price_cache (
      symbol TEXT PRIMARY KEY,
      data   TEXT NOT NULL,
      cached_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

async function fetchYahoo(symbol: string): Promise<Quote | null> {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo&includePrePost=false`
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
  }

  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers,
        next: { revalidate: 300 },
      })
      if (!res.ok) continue

      const json = await res.json()
      const result = json.chart?.result?.[0]
      if (!result) continue

      const { meta, timestamp, indicators } = result
      const closes: (number | null)[] = indicators?.quote?.[0]?.close ?? []
      if (!timestamp?.length) continue

      const history = (timestamp as number[])
        .map((ts: number, i: number) => ({
          date: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          price: closes[i],
        }))
        .filter((p): p is { date: string; price: number } => p.price != null)

      const currentPrice = meta.regularMarketPrice ?? history.at(-1)?.price ?? 0
      const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? history.at(-2)?.price ?? currentPrice
      const changePercent = meta.regularMarketChangePercent ??
        (previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0)

      return { symbol, currentPrice, previousClose, changePercent, currency: meta.currency ?? "USD", history }
    } catch {
      // try next host
    }
  }
  return null
}

async function readCache(symbol: string): Promise<Quote | null> {
  try {
    const row = await db.execute({ sql: "SELECT data FROM price_cache WHERE symbol = ?", args: [symbol] })
    const raw = row.rows[0]?.data as string | undefined
    if (!raw) return null
    const q = JSON.parse(raw) as Quote
    q.stale = true
    return q
  } catch {
    return null
  }
}

async function writeCache(quote: Quote) {
  try {
    await db.execute({
      sql: `INSERT INTO price_cache (symbol, data, cached_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(symbol) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at`,
      args: [quote.symbol, JSON.stringify(quote)],
    })
  } catch {
    // best-effort cache write
  }
}

export async function GET(req: NextRequest) {
  const symbols = new URL(req.url).searchParams.get("symbols")?.split(",").filter(Boolean) ?? []
  if (symbols.length === 0) return NextResponse.json({})

  await ensureCacheTable()

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const live = await fetchYahoo(symbol)
      if (live) {
        await writeCache(live)
        return [symbol, live] as const
      }
      const cached = await readCache(symbol)
      return [symbol, cached] as const
    })
  )

  const quotes = Object.fromEntries(results)
  return NextResponse.json(quotes, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  })
}
