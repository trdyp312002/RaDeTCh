import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

const PORTFOLIOS = new Set(["retirement", "long_term", "short_term", "all"])

async function ensureTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS portfolio_value_snapshots (id TEXT PRIMARY KEY, portfolio TEXT NOT NULL, date TEXT NOT NULL, value_usd REAL NOT NULL, value_thb REAL, fx_rate REAL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(portfolio, date))`)
  const columns = await db.execute("PRAGMA table_info(portfolio_value_snapshots)")
  const names = new Set(columns.rows.map((row: any) => String(row.name)))
  if (!names.has("value_thb")) await db.execute("ALTER TABLE portfolio_value_snapshots ADD COLUMN value_thb REAL")
  if (!names.has("fx_rate")) await db.execute("ALTER TABLE portfolio_value_snapshots ADD COLUMN fx_rate REAL")
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const portfolio = new URL(req.url).searchParams.get("portfolio")
    if (portfolio && !PORTFOLIOS.has(portfolio)) return NextResponse.json({ error: "Unknown portfolio" }, { status: 400 })
    const result = portfolio
      ? await db.execute({ sql: "SELECT portfolio, date, value_usd, value_thb, fx_rate, updated_at FROM portfolio_value_snapshots WHERE portfolio = ? ORDER BY date ASC", args: [portfolio] })
      : await db.execute("SELECT portfolio, date, value_usd, value_thb, fx_rate, updated_at FROM portfolio_value_snapshots ORDER BY date ASC, portfolio ASC")
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load portfolio history" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const { portfolio, date, value_usd, value_thb, fx_rate } = await req.json()
    const hasThb = value_thb == null || (Number.isFinite(value_thb) && value_thb >= 0)
    const hasFx = fx_rate == null || (Number.isFinite(fx_rate) && fx_rate > 0)
    if (!PORTFOLIOS.has(portfolio) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value_usd) || value_usd < 0 || !hasThb || !hasFx) return NextResponse.json({ error: "portfolio, date, and valid snapshot values are required" }, { status: 400 })
    await db.execute({ sql: `INSERT INTO portfolio_value_snapshots (id, portfolio, date, value_usd, value_thb, fx_rate) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(portfolio, date) DO UPDATE SET value_usd = excluded.value_usd, value_thb = COALESCE(excluded.value_thb, portfolio_value_snapshots.value_thb), fx_rate = COALESCE(excluded.fx_rate, portfolio_value_snapshots.fx_rate), updated_at = datetime('now')`, args: [crypto.randomUUID(), portfolio, date, value_usd, value_thb ?? null, fx_rate ?? null] })
    const result = await db.execute({ sql: "SELECT portfolio, date, value_usd, value_thb, fx_rate, updated_at FROM portfolio_value_snapshots WHERE portfolio = ? AND date = ?", args: [portfolio, date] })
    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save portfolio snapshot" }, { status: 500 })
  }
}