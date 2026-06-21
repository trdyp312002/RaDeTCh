import { NextRequest, NextResponse } from "next/server"
import { getGarminClient } from "@/lib/garminClient"
import db from "@/lib/db"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Protect with CRON_SECRET so only Railway can trigger it
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret configured → open (set CRON_SECRET on Railway!)
  const auth = req.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

async function upsertHealth(date: string, fields: Record<string, any>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS health_logs (
      date TEXT PRIMARY KEY, weight REAL, bmi REAL, body_fat REAL,
      sleep_hours REAL, sleep_score INTEGER, steps INTEGER,
      resting_heart_rate INTEGER, calories_in INTEGER, calories_out INTEGER,
      notes TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  await db.execute({
    sql: `INSERT INTO health_logs (date, sleep_hours, sleep_score, steps, resting_heart_rate, notes, updated_at)
          VALUES (?, ?, ?, ?, ?, 'Garmin Auto-Sync', datetime('now'))
          ON CONFLICT(date) DO UPDATE SET
            sleep_hours        = COALESCE(excluded.sleep_hours,        sleep_hours),
            sleep_score        = COALESCE(excluded.sleep_score,        sleep_score),
            steps              = COALESCE(excluded.steps,              steps),
            resting_heart_rate = COALESCE(excluded.resting_heart_rate, resting_heart_rate),
            updated_at         = datetime('now')`,
    args: [
      date,
      fields.sleep_hours ?? null,
      fields.sleep_score ?? null,
      fields.steps ?? null,
      fields.resting_heart_rate ?? null,
    ],
  })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString("en-CA") // YYYY-MM-DD
  const log: string[] = []

  try {
    log.push("[Garmin] Connecting…")
    const client = await getGarminClient()

    const [sleepData, stepsData, hrData] = await Promise.all([
      client.getSleepData(today).catch(() => null),
      client.getSteps(today).catch(() => null),
      client.getHeartRate(today).catch(() => null),
    ])

    const sleepSeconds = sleepData?.dailySleepDTO?.sleepTimeSeconds || 0
    const sleep_hours  = sleepSeconds ? parseFloat((sleepSeconds / 3600).toFixed(2)) : null
    const sleep_score  = sleepData?.dailySleepDTO?.sleepScores?.overall?.value ?? null
    const steps        = Array.isArray(stepsData) && stepsData.length
      ? stepsData.reduce((acc: number, s: any) => acc + (s.steps || 0), 0)
      : null
    const resting_heart_rate = hrData?.restingHeartRate ?? null

    await upsertHealth(dateStr, { sleep_hours, sleep_score, steps, resting_heart_rate })
    log.push(`[Garmin] OK — sleep: ${sleep_hours}h, steps: ${steps}, RHR: ${resting_heart_rate}`)
  } catch (e: any) {
    log.push(`[Garmin] Error: ${e.message}`)
    return NextResponse.json({ success: false, date: dateStr, log }, { status: 500 })
  }

  return NextResponse.json({ success: true, date: dateStr, log })
}
