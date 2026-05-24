import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET(req: NextRequest) {
  const holdingId = new URL(req.url).searchParams.get("holdingId")
  const rows = holdingId
    ? db.prepare("SELECT * FROM transactions WHERE holding_id = ? ORDER BY date DESC").all(holdingId)
    : db.prepare("SELECT * FROM transactions ORDER BY date DESC").all()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { holdingId, type, quantity, price, fees, date, notes } = await req.json()

  if (!holdingId || !type || !quantity || price == null || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const holding = db.prepare("SELECT id FROM holdings WHERE id = ?").get(holdingId)
  if (!holding) return NextResponse.json({ error: "Holding not found" }, { status: 404 })

  const id = crypto.randomUUID()
  db.prepare(
    "INSERT INTO transactions (id, holding_id, type, quantity, price, fees, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, holdingId, type, quantity, price, fees ?? 0, date, notes ?? null)

  // Update holding's updated_at
  db.prepare("UPDATE holdings SET updated_at = datetime('now') WHERE id = ?").run(holdingId)

  const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  return NextResponse.json(tx, { status: 201 })
}
