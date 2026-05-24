import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { name, type, portfolio } = await req.json()

    await db.execute({
      sql: "UPDATE holdings SET name = COALESCE(?, name), type = COALESCE(?, type), portfolio = COALESCE(?, portfolio), updated_at = datetime('now') WHERE id = ?",
      args: [name ?? null, type ?? null, portfolio ?? null, id]
    })

    const holdingRes = await db.execute({
      sql: "SELECT * FROM holdings WHERE id = ?",
      args: [id]
    })
    const holding = holdingRes.rows[0]
    if (!holding) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(holding)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.execute({
      sql: "DELETE FROM holdings WHERE id = ?",
      args: [id]
    })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
