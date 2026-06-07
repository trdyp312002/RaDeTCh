import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS networth_snapshots (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      net_worth REAL NOT NULL,
      total_assets REAL NOT NULL,
      total_liabilities REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const rows = await db.execute(
      "SELECT * FROM networth_snapshots ORDER BY date ASC"
    )
    return NextResponse.json(rows.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { date, net_worth, total_assets, total_liabilities } = await req.json()
    if (!date || net_worth == null || total_assets == null || total_liabilities == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Upsert: if today's snapshot exists, update it
    const existing = await db.execute({
      sql: "SELECT id FROM networth_snapshots WHERE date = ?",
      args: [date],
    })

    if (existing.rows.length > 0) {
      await db.execute({
        sql: "UPDATE networth_snapshots SET net_worth = ?, total_assets = ?, total_liabilities = ? WHERE date = ?",
        args: [net_worth, total_assets, total_liabilities, date],
      })
    } else {
      await db.execute({
        sql: "INSERT INTO networth_snapshots (id, date, net_worth, total_assets, total_liabilities) VALUES (?, ?, ?, ?, ?)",
        args: [crypto.randomUUID(), date, net_worth, total_assets, total_liabilities],
      })
    }

    const row = await db.execute({
      sql: "SELECT * FROM networth_snapshots WHERE date = ?",
      args: [date],
    })
    return NextResponse.json(row.rows[0], { status: 200 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
