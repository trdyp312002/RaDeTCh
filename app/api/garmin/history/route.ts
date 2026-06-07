import { NextRequest, NextResponse } from "next/server"
import { GarminConnect } from "garmin-connect"
import fs from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"
// Long timeout for bulk backfill
export const maxDuration = 300

const dataFilePath = path.join(process.cwd(), "data", "health.json")

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(req: NextRequest) {
  const email    = process.env.GARMIN_EMAIL
  const password = process.env.GARMIN_PASSWORD
  if (!email || !password) {
    return NextResponse.json({ error: "Missing Garmin credentials" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const days = Math.min(Number(body.days) || 90, 365)

  try {
    const client = new GarminConnect({ username: email, password: password })
    await client.login()

    const fileContents = await fs.readFile(dataFilePath, "utf8")
    const data = JSON.parse(fileContents)
    const existingDates = new Set(
      (data.logs as any[]).map((l: any) => String(l.date).substring(0, 10))
    )

    const results: { date: string; status: string }[] = []

    for (let i = days; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString("en-CA") // YYYY-MM-DD

      // Skip dates that already have Garmin fields populated
      if (existingDates.has(dateStr)) {
        const existing = (data.logs as any[]).find(
          (l: any) => String(l.date).substring(0, 10) === dateStr
        )
        if (existing?.sleep_hours != null || existing?.steps != null) {
          results.push({ date: dateStr, status: "skipped" })
          continue
        }
      }

      try {
        const [sleepData, stepsData, hrData] = await Promise.all([
          client.getSleepData(d).catch(() => null),
          client.getSteps(d).catch(() => null),
          client.getHeartRate(d).catch(() => null),
        ])

        const sleepSeconds = sleepData?.dailySleepDTO?.sleepTimeSeconds || 0
        const sleep_hours  = sleepSeconds ? parseFloat((sleepSeconds / 3600).toFixed(2)) : null
        const sleep_score  = sleepData?.dailySleepDTO?.sleepScores?.overall?.value ?? null
        const steps        = Array.isArray(stepsData) && stepsData.length
          ? stepsData.reduce((acc, s) => acc + (s.steps || 0), 0)
          : null
        const resting_heart_rate = hrData?.restingHeartRate ?? null

        if (sleep_hours == null && steps == null && resting_heart_rate == null) {
          results.push({ date: dateStr, status: "no_data" })
        } else {
          const existingIdx = (data.logs as any[]).findIndex(
            (l: any) => String(l.date).substring(0, 10) === dateStr
          )
          const entry: any = {
            id:                 existingIdx !== -1 ? data.logs[existingIdx].id : `garmin_${dateStr}`,
            date:               dateStr,
            weight:             existingIdx !== -1 ? data.logs[existingIdx].weight : null,
            sleep_hours,
            sleep_score,
            steps,
            resting_heart_rate,
            calories_in:        existingIdx !== -1 ? data.logs[existingIdx].calories_in : null,
            calories_out:       existingIdx !== -1 ? data.logs[existingIdx].calories_out : null,
            notes:              "Garmin Backfill",
          }
          if (existingIdx !== -1) {
            data.logs[existingIdx] = entry
          } else {
            data.logs.push(entry)
            existingDates.add(dateStr)
          }
          results.push({ date: dateStr, status: "synced" })
        }

        await sleep(400) // avoid rate limiting
      } catch (e: any) {
        results.push({ date: dateStr, status: `error: ${e.message}` })
        await sleep(400)
      }
    }

    // Sort logs by date
    data.logs.sort((a: any, b: any) =>
      String(a.date).substring(0, 10).localeCompare(String(b.date).substring(0, 10))
    )

    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8")

    const synced  = results.filter((r) => r.status === "synced").length
    const skipped = results.filter((r) => r.status === "skipped").length
    const noData  = results.filter((r) => r.status === "no_data").length
    return NextResponse.json({ synced, skipped, no_data: noData, days, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
