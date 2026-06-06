import { NextResponse } from 'next/server'

const BOT = process.env.BOT_URL ?? 'http://localhost:8001'

export async function GET() {
  try {
    const [posRes, pnlRes, logRes] = await Promise.all([
      fetch(`${BOT}/positions`, { cache: 'no-store' }),
      fetch(`${BOT}/pnl`, { cache: 'no-store' }),
      fetch(`${BOT}/log`, { cache: 'no-store' }),
    ])
    return NextResponse.json({
      ...(await posRes.json()),
      ...(await pnlRes.json()),
      log: (await logRes.json()).log,
    })
  } catch {
    return NextResponse.json({ position: null, error: 'Bot unreachable' }, { status: 503 })
  }
}
