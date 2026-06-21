import { NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS health_logs (
      date               TEXT PRIMARY KEY,
      weight             REAL,
      bmi                REAL,
      body_fat           REAL,
      sleep_hours        REAL,
      sleep_score        INTEGER,
      steps              INTEGER,
      resting_heart_rate INTEGER,
      calories_in        INTEGER,
      calories_out       INTEGER,
      notes              TEXT DEFAULT '',
      created_at         TEXT DEFAULT (datetime('now')),
      updated_at         TEXT DEFAULT (datetime('now'))
    )
  `)
}

export async function GET() {
  try {
    await ensureTable()
    const result = await db.execute(
      "SELECT * FROM health_logs ORDER BY date ASC"
    )
    const logs = result.rows.map((r) => ({
      id:                 r.date,
      date:               r.date,
      weight:             r.weight,
      bmi:                r.bmi,
      body_fat:           r.body_fat,
      sleep_hours:        r.sleep_hours,
      sleep_score:        r.sleep_score,
      steps:              r.steps,
      resting_heart_rate: r.resting_heart_rate,
      calories_in:        r.calories_in,
      calories_out:       r.calories_out,
      notes:              r.notes,
    }))
    return NextResponse.json({ logs })
  } catch (e: any) {
    console.error("GET /api/health error:", e)
    return NextResponse.json({ logs: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable()
    const body = await req.json()

    const rawDate = body.date
      ? String(body.date).replace("T", " ").substring(0, 19)
      : new Date().toISOString().replace("T", " ").substring(0, 19)
    const dateKey = rawDate.substring(0, 10)

    const num = (v: any) => (v != null && v !== "" ? Number(v) : null)

    await db.execute({
      sql: `INSERT INTO health_logs
              (date, weight, bmi, body_fat, sleep_hours, sleep_score, steps, resting_heart_rate, calories_in, calories_out, notes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(date) DO UPDATE SET
              weight             = COALESCE(excluded.weight,             weight),
              bmi                = COALESCE(excluded.bmi,                bmi),
              body_fat           = COALESCE(excluded.body_fat,           body_fat),
              sleep_hours        = COALESCE(excluded.sleep_hours,        sleep_hours),
              sleep_score        = COALESCE(excluded.sleep_score,        sleep_score),
              steps              = COALESCE(excluded.steps,              steps),
              resting_heart_rate = COALESCE(excluded.resting_heart_rate, resting_heart_rate),
              calories_in        = COALESCE(excluded.calories_in,        calories_in),
              calories_out       = COALESCE(excluded.calories_out,       calories_out),
              notes              = CASE WHEN excluded.notes != '' THEN excluded.notes ELSE notes END,
              updated_at         = datetime('now')`,
      args: [
        dateKey,
        num(body.weight),
        num(body.bmi),
        num(body.body_fat),
        num(body.sleep_hours),
        num(body.sleep_score),
        num(body.steps),
        num(body.resting_heart_rate),
        num(body.calories_in),
        num(body.calories_out),
        body.notes ?? "",
      ],
    })

    const row = await db.execute({
      sql: "SELECT * FROM health_logs WHERE date = ?",
      args: [dateKey],
    })

    return NextResponse.json({ success: true, log: row.rows[0] })
  } catch (e: any) {
    console.error("POST /api/health error:", e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
