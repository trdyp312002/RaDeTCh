import { NextRequest, NextResponse } from 'next/server'

const BOT = process.env.BOT_URL ?? 'http://localhost:8001'

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') ?? 'BTC/USDT'
  try {
    const res = await fetch(`${BOT}/trades?symbol=${encodeURIComponent(symbol)}&limit=20`, {
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ trades: [], error: 'Bot unreachable' }, { status: 503 })
  }
}
