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
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null

    const json = await res.json()
    const result = json.chart?.result?.[0]
    if (!result) return null

    const { meta, timestamp, indicators } = result
    const closes: (number | null)[] = indicators.quote[0].close

    const history = (timestamp as number[])
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        price: closes[i],
      }))
      .filter((p): p is { date: string; price: number } => p.price != null)

    return {
      symbol,
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      changePercent: meta.regularMarketChangePercent,
      currency: meta.currency,
      history,
    }
  } catch {
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
