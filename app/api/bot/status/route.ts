import { NextResponse } from 'next/server'

const BOT = process.env.BOT_URL ?? 'http://localhost:8001'

export async function GET() {
  try {
    const res = await fetch(`${BOT}/status`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: 'OFFLINE', error: 'Bot unreachable' }, { status: 503 })
  }
}
