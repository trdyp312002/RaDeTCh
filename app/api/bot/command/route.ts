import { NextRequest, NextResponse } from 'next/server'

const BOT = process.env.BOT_URL ?? 'http://localhost:8001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BOT}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Bot unreachable' }, { status: 503 })
  }
}
