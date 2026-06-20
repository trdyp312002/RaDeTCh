import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const holdingId = new URL(req.url).searchParams.get("holdingId")
    const rowsRes = holdingId
      ? await db.execute({
          sql: "SELECT t.*, h.symbol, h.name FROM transactions t LEFT JOIN holdings h ON t.holding_id = h.id WHERE t.holding_id = ? ORDER BY t.date DESC",
          args: [holdingId]
        })
      : await db.execute("SELECT t.*, h.symbol, h.name FROM transactions t LEFT JOIN holdings h ON t.holding_id = h.id ORDER BY t.date DESC")
    return NextResponse.json(rowsRes.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { holdingId, type, quantity, price, fees, date, notes } = await req.json()

    if (!holdingId || !type || !quantity || price == null || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const holdingRes = await db.execute({
      sql: "SELECT id FROM holdings WHERE id = ?",
      args: [holdingId]
    })
    const holding = holdingRes.rows[0]
    if (!holding) return NextResponse.json({ error: "Holding not found" }, { status: 404 })

    const id = crypto.randomUUID()
    await db.batch([
      {
        sql: "INSERT INTO transactions (id, holding_id, type, quantity, price, fees, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id, holdingId, type, quantity, price, fees ?? 0, date, notes ?? null]
      },
      {
        sql: "UPDATE holdings SET updated_at = datetime('now') WHERE id = ?",
        args: [holdingId]
      }
    ])

    const txRes = await db.execute({
      sql: "SELECT * FROM transactions WHERE id = ?",
      args: [id]
    })
    return NextResponse.json(txRes.rows[0], { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
