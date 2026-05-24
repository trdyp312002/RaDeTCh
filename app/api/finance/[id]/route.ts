import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { label, amount, currency } = await req.json()
  db.prepare(
    "UPDATE finance_items SET label = COALESCE(?, label), amount = COALESCE(?, amount), currency = COALESCE(?, currency), updated_at = datetime('now') WHERE id = ?"
  ).run(label ?? null, amount ?? null, currency ?? null, id)

  const item = db.prepare("SELECT * FROM finance_items WHERE id = ?").get(id)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db.prepare("DELETE FROM finance_items WHERE id = ?").run(id)
  return NextResponse.json({ ok: true })
}
