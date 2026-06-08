import { NextResponse } from 'next/server'

const BOT = process.env.BOT_URL ?? 'http://localhost:8001'

export async function GET() {
  try {
    const res = await fetch(`${BOT}/agents/status`, { cache: 'no-store' })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Bot unreachable' }, { status: 503 })
  }
}

export async function POST() {
  try {
    const res = await fetch(`${BOT}/agents/force_run`, { method: 'POST' })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Bot unreachable' }, { status: 503 })
  }
}
