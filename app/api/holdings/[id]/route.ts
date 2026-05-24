import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, type } = await req.json()

  db.prepare(
    "UPDATE holdings SET name = COALESCE(?, name), type = COALESCE(?, type), updated_at = datetime('now') WHERE id = ?"
  ).run(name ?? null, type ?? null, id)

  const holding = db.prepare("SELECT * FROM holdings WHERE id = ?").get(id)
  if (!holding) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(holding)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  db.prepare("DELETE FROM holdings WHERE id = ?").run(id)
  return NextResponse.json({ ok: true })
}
