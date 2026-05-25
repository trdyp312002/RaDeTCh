import { NextRequest, NextResponse } from "next/server"

type Quote = {
  symbol: string
  currentPrice: number
  previousClose: number
  changePercent: number
  currency: string
  history: { date: string; price: number }[]
}

async function fetchYahoo(symbol: string): Promise<Quote | null> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/` +
      `${encodeURIComponent(symbol)}?interval=1d&range=1mo&includePrePost=false`

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      },
      next: { revalidate: 60 },
    })
    if (!res.ok) {
      console.error(`[Yahoo Fetch Error] ${symbol} returned status ${res.status}`);
      return null
    }

    const json = await res.json()
    const result = json.chart?.result?.[0]
    if (!result) {
      console.error(`[Yahoo Fetch Error] ${symbol} returned no result in chart json`);
      return null
    }

    const { meta, timestamp, indicators } = result
    const closes: (number | null)[] = indicators?.quote?.[0]?.close ?? []

    if (!timestamp || timestamp.length === 0) {
      console.error(`[Yahoo Fetch Error] ${symbol} has no timestamp history`);
      return null
    }

    const history = (timestamp as number[])
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        price: closes[i],
      }))
      .filter((p): p is { date: string; price: number } => p.price != null)

    const currentPrice = meta.regularMarketPrice ?? (history.length > 0 ? history[history.length - 1].price : 0)
    const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? (history.length > 1 ? history[history.length - 2].price : currentPrice)
    const changePercent = meta.regularMarketChangePercent ?? 
      (previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0)

    return {
      symbol,
      currentPrice,
      previousClose,
      changePercent,
      currency: meta.currency ?? "USD",
      history,
    }
  } catch (err: any) {
    console.error(`[Yahoo Fetch Exception] Failed for ${symbol}:`, err.message || err);
    return null
  }
}

export async function GET(req: NextRequest) {
  const symbols = new URL(req.url).searchParams.get("symbols")?.split(",").filter(Boolean) ?? []
  if (symbols.length === 0) return NextResponse.json({})

  const results = await Promise.all(symbols.map(fetchYahoo))
  const quotes = Object.fromEntries(symbols.map((s, i) => [s, results[i]]))

  return NextResponse.json(quotes, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  })
}
