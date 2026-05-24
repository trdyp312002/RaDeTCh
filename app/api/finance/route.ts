import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET() {
  const items = db.prepare("SELECT * FROM finance_items ORDER BY category, created_at ASC").all()
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const { category, label, amount, currency } = await req.json()
  if (!category || !label || amount == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const id = crypto.randomUUID()
  db.prepare(
    "INSERT INTO finance_items (id, category, label, amount, currency) VALUES (?, ?, ?, ?, ?)"
  ).run(id, category, label, amount, currency ?? "USD")

  const item = db.prepare("SELECT * FROM finance_items WHERE id = ?").get(id)
  return NextResponse.json(item, { status: 201 })
}
