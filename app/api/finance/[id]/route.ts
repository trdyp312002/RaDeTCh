import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { label, amount, currency } = await req.json()

    await db.execute({
      sql: "UPDATE finance_items SET label = COALESCE(?, label), amount = COALESCE(?, amount), currency = COALESCE(?, currency), updated_at = datetime('now') WHERE id = ?",
      args: [label ?? null, amount ?? null, currency ?? null, id]
    })

    const itemRes = await db.execute({
      sql: "SELECT * FROM finance_items WHERE id = ?",
      args: [id]
    })
    const item = itemRes.rows[0]
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.execute({
      sql: "DELETE FROM finance_items WHERE id = ?",
      args: [id]
    })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

