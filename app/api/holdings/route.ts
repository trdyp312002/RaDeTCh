import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { calcPosition } from "@/lib/portfolio"
import type { Transaction } from "@/lib/portfolio"

export async function GET(req: NextRequest) {
  const portfolio = new URL(req.url).searchParams.get("portfolio")

  const holdings = (portfolio
    ? db.prepare("SELECT * FROM holdings WHERE portfolio = ? ORDER BY created_at ASC").all(portfolio)
    : db.prepare("SELECT * FROM holdings ORDER BY created_at ASC").all()
  ) as { id: string; symbol: string; name: string; type: string; portfolio: string; created_at: string; updated_at: string }[]

  const result = holdings.map((h) => {
    const transactions = db
      .prepare("SELECT * FROM transactions WHERE holding_id = ? ORDER BY date ASC")
      .all(h.id) as Transaction[]
    return { ...h, ...calcPosition(transactions), transactions }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { symbol, name, type, portfolio } = await req.json()
  if (!symbol || !name) {
    return NextResponse.json({ error: "symbol and name required" }, { status: 400 })
  }

  const portfolioVal = portfolio ?? "long_term"

  try {
    const id = crypto.randomUUID()
    db.prepare(
      "INSERT INTO holdings (id, symbol, name, type, portfolio) VALUES (?, ?, ?, ?, ?)"
    ).run(id, symbol.toUpperCase(), name, type ?? "stock", portfolioVal)

    const holding = db.prepare("SELECT * FROM holdings WHERE id = ?").get(id)
    return NextResponse.json(holding, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error"
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "Symbol already exists in this portfolio" }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
