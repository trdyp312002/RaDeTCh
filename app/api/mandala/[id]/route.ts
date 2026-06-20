import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { main_goal } = await req.json()
    await db.execute({
      sql: "UPDATE mandala_charts SET main_goal = ?, updated_at = datetime('now') WHERE id = ?",
      args: [main_goal ?? "", id],
    })
    const res = await db.execute({
      sql: "SELECT * FROM mandala_charts WHERE id = ?",
      args: [id],
    })
    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
