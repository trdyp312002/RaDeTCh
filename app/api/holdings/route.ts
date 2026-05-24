import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { calcPosition } from "@/lib/portfolio"
import type { Transaction } from "@/lib/portfolio"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const portfolio = new URL(req.url).searchParams.get("portfolio")

    const holdingsRes = portfolio
      ? await db.execute({
          sql: "SELECT * FROM holdings WHERE portfolio = ? ORDER BY created_at ASC",
          args: [portfolio]
        })
      : await db.execute("SELECT * FROM holdings ORDER BY created_at ASC")

    const holdings = holdingsRes.rows as unknown as { id: string; symbol: string; name: string; type: string; portfolio: string; created_at: string; updated_at: string }[]

    const result = await Promise.all(
      holdings.map(async (h) => {
        const transRes = await db.execute({
          sql: "SELECT * FROM transactions WHERE holding_id = ? ORDER BY date ASC",
          args: [h.id]
        })
        const transactions = transRes.rows as unknown as Transaction[]
        return { ...h, ...calcPosition(transactions), transactions }
      })
    )

    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { symbol, name, type, portfolio } = await req.json()
    if (!symbol || !name) {
      return NextResponse.json({ error: "symbol and name required" }, { status: 400 })
    }

    const portfolioVal = portfolio ?? "long_term"

    const id = crypto.randomUUID()
    await db.execute({
      sql: "INSERT INTO holdings (id, symbol, name, type, portfolio) VALUES (?, ?, ?, ?, ?)",
      args: [id, symbol.toUpperCase(), name, type ?? "stock", portfolioVal]
    })

    const holdingRes = await db.execute({
      sql: "SELECT * FROM holdings WHERE id = ?",
      args: [id]
    })
    return NextResponse.json(holdingRes.rows[0], { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error"
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "Symbol already exists in this portfolio" }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
