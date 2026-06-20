import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { year, title, description, category, color } = await req.json()
    await db.execute({
      sql: "UPDATE life_milestones SET year = ?, title = ?, description = ?, category = ?, color = ? WHERE id = ?",
      args: [year, title, description ?? "", category ?? "life", color ?? "#818cf8", id],
    })
    const res = await db.execute({
      sql: "SELECT * FROM life_milestones WHERE id = ?",
      args: [id],
    })
    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.execute({
      sql: "DELETE FROM life_milestones WHERE id = ?",
      args: [id],
    })
    return NextResponse.json({ deleted: id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
