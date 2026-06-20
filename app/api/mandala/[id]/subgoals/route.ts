import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

// POST: batch upsert all 8 subgoals + 64 actions for a chart
// Body: { subgoals: [{ id, position, title, color, actions: [{ id, position, text, completed }] }] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chartId } = await params
    const { subgoals } = await req.json()

    if (!Array.isArray(subgoals)) {
      return NextResponse.json({ error: "subgoals must be an array" }, { status: 400 })
    }

    const sgStatements = subgoals.map((sg: any) => ({
      sql: "UPDATE mandala_subgoals SET title = ?, color = ? WHERE id = ? AND chart_id = ?",
      args: [sg.title ?? "", sg.color ?? "#818cf8", sg.id, chartId],
    }))

    const actStatements = subgoals.flatMap((sg: any) =>
      (sg.actions ?? []).map((a: any) => ({
        sql: "UPDATE mandala_actions SET text = ?, completed = ? WHERE id = ? AND subgoal_id = ?",
        args: [a.text ?? "", a.completed ? 1 : 0, a.id, sg.id],
      }))
    )

    await db.batch([...sgStatements, ...actStatements])

    await db.execute({
      sql: "UPDATE mandala_charts SET updated_at = datetime('now') WHERE id = ?",
      args: [chartId],
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
