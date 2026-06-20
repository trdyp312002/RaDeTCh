import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

// PATCH: toggle completed for a single action
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { completed } = await req.json()
    await db.execute({
      sql: "UPDATE mandala_actions SET completed = ? WHERE id = ?",
      args: [completed ? 1 : 0, id],
    })
    const res = await db.execute({
      sql: "SELECT * FROM mandala_actions WHERE id = ?",
      args: [id],
    })
    if (!res.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(res.rows[0])
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
