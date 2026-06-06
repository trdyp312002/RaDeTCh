import { NextResponse } from 'next/server'

const BOT = process.env.BOT_URL ?? 'http://localhost:8001'

const KEY_ASSETS = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'FDUSD']

export async function GET() {
  try {
    const res = await fetch(`${BOT}/balance`, { cache: 'no-store' })
    const data = await res.json()
    const key = (data.assets as { asset: string; total: number; free: number }[])
      .filter((a) => KEY_ASSETS.includes(a.asset))
      .sort((a, b) => KEY_ASSETS.indexOf(a.asset) - KEY_ASSETS.indexOf(b.asset))
    return NextResponse.json({ assets: key, all: data.assets })
  } catch {
    return NextResponse.json({ assets: [], error: 'Bot unreachable' }, { status: 503 })
  }
}
