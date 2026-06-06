import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_net_worth (
        date TEXT PRIMARY KEY,
        total_value REAL NOT NULL
      )
    `)
    const res = await db.execute("SELECT * FROM daily_net_worth ORDER BY date ASC")
    return NextResponse.json(res.rows)
  } catch (error) {
    console.error("GET Snapshot Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, value } = await req.json()
    if (!date || value === undefined) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_net_worth (
        date TEXT PRIMARY KEY,
        total_value REAL NOT NULL
      )
    `)

    // INSERT OR REPLACE to update the value if it's the same day
    await db.execute({
      sql: "INSERT OR REPLACE INTO daily_net_worth (date, total_value) VALUES (?, ?)",
      args: [date, value]
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST Snapshot Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
