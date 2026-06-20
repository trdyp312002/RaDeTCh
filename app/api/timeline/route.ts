import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS life_milestones (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'life',
      color TEXT NOT NULL DEFAULT '#818cf8',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const res = await db.execute(
      "SELECT * FROM life_milestones ORDER BY year ASC, created_at ASC"
    )
    return NextResponse.json(res.rows)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { year, title, description, category, color } = await req.json()
    if (!year || !title) {
      return NextResponse.json({ error: "year and title are required" }, { status: 400 })
    }
    const id = crypto.randomUUID()
    await db.execute({
      sql: "INSERT INTO life_milestones (id, year, title, description, category, color) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id, year, title, description ?? "", category ?? "life", color ?? "#818cf8"],
    })
    const res = await db.execute({
      sql: "SELECT * FROM life_milestones WHERE id = ?",
      args: [id],
    })
    return NextResponse.json(res.rows[0], { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
