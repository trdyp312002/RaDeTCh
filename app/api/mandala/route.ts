import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

async function ensureTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mandala_charts (
      id TEXT PRIMARY KEY,
      main_goal TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mandala_subgoals (
      id TEXT PRIMARY KEY,
      chart_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#818cf8',
      FOREIGN KEY (chart_id) REFERENCES mandala_charts(id) ON DELETE CASCADE
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mandala_actions (
      id TEXT PRIMARY KEY,
      subgoal_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (subgoal_id) REFERENCES mandala_subgoals(id) ON DELETE CASCADE
    )
  `)
}

const SUB_COLORS = [
  "#818cf8", "#34d399", "#fb923c", "#f472b6",
  "#38bdf8", "#a78bfa", "#fbbf24", "#4ade80",
]

async function seedEmptyChart(chartId: string) {
  const sgStatements = []
  const actStatements = []
  for (let pos = 0; pos < 8; pos++) {
    const sgId = crypto.randomUUID()
    sgStatements.push({
      sql: "INSERT INTO mandala_subgoals (id, chart_id, position, title, color) VALUES (?, ?, ?, '', ?)",
      args: [sgId, chartId, pos, SUB_COLORS[pos]],
    })
    for (let apos = 0; apos < 8; apos++) {
      actStatements.push({
        sql: "INSERT INTO mandala_actions (id, subgoal_id, position, text, completed) VALUES (?, ?, ?, '', 0)",
        args: [crypto.randomUUID(), sgId, apos],
      })
    }
  }
  await db.batch(sgStatements)
  await db.batch(actStatements)
}

export async function GET() {
  try {
    await ensureTables()
    const chartsRes = await db.execute(
      "SELECT * FROM mandala_charts ORDER BY updated_at DESC LIMIT 1"
    )
    let chart = chartsRes.rows[0] ?? null

    if (!chart) {
      const id = crypto.randomUUID()
      await db.execute({
        sql: "INSERT INTO mandala_charts (id, main_goal) VALUES (?, '')",
        args: [id],
      })
      await seedEmptyChart(id)
      const newChart = await db.execute({
        sql: "SELECT * FROM mandala_charts WHERE id = ?",
        args: [id],
      })
      chart = newChart.rows[0]
    }

    const subgoalsRes = await db.execute({
      sql: "SELECT * FROM mandala_subgoals WHERE chart_id = ? ORDER BY position ASC",
      args: [chart.id as string],
    })
    const subgoals = subgoalsRes.rows

    const actionsRes = await db.execute({
      sql: `SELECT a.* FROM mandala_actions a
            JOIN mandala_subgoals s ON a.subgoal_id = s.id
            WHERE s.chart_id = ?
            ORDER BY a.subgoal_id, a.position ASC`,
      args: [chart.id as string],
    })
    const actions = actionsRes.rows

    return NextResponse.json({ chart, subgoals, actions })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables()
    const { main_goal } = await req.json()
    const id = crypto.randomUUID()
    await db.execute({
      sql: "INSERT INTO mandala_charts (id, main_goal) VALUES (?, ?)",
      args: [id, main_goal ?? ""],
    })
    await seedEmptyChart(id)
    const chart = await db.execute({
      sql: "SELECT * FROM mandala_charts WHERE id = ?",
      args: [id],
    })
    return NextResponse.json(chart.rows[0], { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
