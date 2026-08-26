import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

const PORTFOLIOS = new Set(["retirement", "long_term", "short_term"])

async function ensureTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS portfolio_value_snapshots (id TEXT PRIMARY KEY, portfolio TEXT NOT NULL, date TEXT NOT NULL, value_usd REAL NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(portfolio, date))`)
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const portfolio = new URL(req.url).searchParams.get("portfolio")
    if (portfolio && !PORTFOLIOS.has(portfolio)) return NextResponse.json({ error: "Unknown portfolio" }, { status: 400 })
    const result = portfolio
      ? await db.execute({ sql: "SELECT portfolio, date, value_usd, updated_at FROM portfolio_value_snapshots WHERE portfolio = ? ORDER BY date ASC", args: [portfolio] })
      : await db.execute("SELECT portfolio, date, value_usd, updated_at FROM portfolio_value_snapshots ORDER BY date ASC, portfolio ASC")
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load portfolio history" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { portfolio, date, value_usd } = await req.json()
    if (!PORTFOLIOS.has(portfolio) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value_usd) || value_usd < 0) return NextResponse.json({ error: "portfolio, date, and a non-negative value_usd are required" }, { status: 400 })
    await db.execute({ sql: `INSERT INTO portfolio_value_snapshots (id, portfolio, date, value_usd) VALUES (?, ?, ?, ?) ON CONFLICT(portfolio, date) DO UPDATE SET value_usd = excluded.value_usd, updated_at = datetime('now')`, args: [crypto.randomUUID(), portfolio, date, value_usd] })
    const result = await db.execute({ sql: "SELECT portfolio, date, value_usd, updated_at FROM portfolio_value_snapshots WHERE portfolio = ? AND date = ?", args: [portfolio, date] })
    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save portfolio snapshot" }, { status: 500 })
  }
}
