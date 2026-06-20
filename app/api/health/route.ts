import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const dataFilePath = path.join(process.cwd(), "data", "health.json")

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, "utf8")
    const data = JSON.parse(fileContents)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ logs: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const fileContents = await fs.readFile(dataFilePath, "utf8")
    const data = JSON.parse(fileContents)

    // Use caller-supplied date or now
    const rawDate = body.date
      ? String(body.date).replace("T", " ").substring(0, 19)
      : new Date().toISOString().replace("T", " ").substring(0, 19)

    const datePrefix = rawDate.substring(0, 10) // YYYY-MM-DD

    // Merge into existing entry for same day rather than duplicate
    const existingIdx = (data.logs as any[]).findIndex(
      (l) => String(l.date).substring(0, 10) === datePrefix
    )

    const fields = {
      weight:             body.weight             != null ? Number(body.weight)             : undefined,
      bmi:                body.bmi                != null ? Number(body.bmi)                : undefined,
      body_fat:           body.body_fat           != null ? Number(body.body_fat)           : undefined,
      sleep_hours:        body.sleep_hours        != null ? Number(body.sleep_hours)        : undefined,
      sleep_score:        body.sleep_score        != null ? Number(body.sleep_score)        : undefined,
      steps:              body.steps              != null ? Number(body.steps)              : undefined,
      resting_heart_rate: body.resting_heart_rate != null ? Number(body.resting_heart_rate) : undefined,
      calories_in:        body.calories_in        != null ? Number(body.calories_in)        : undefined,
      calories_out:       body.calories_out       != null ? Number(body.calories_out)       : undefined,
    }

    // Remove undefined keys so we don't overwrite existing values with null
    const updates = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    )

    let log: any
    if (existingIdx !== -1) {
      data.logs[existingIdx] = { ...data.logs[existingIdx], ...updates }
      if (body.notes) data.logs[existingIdx].notes = body.notes
      log = data.logs[existingIdx]
    } else {
      log = {
        id:                 Date.now().toString(),
        date:               rawDate,
        weight:             fields.weight             ?? null,
        sleep_hours:        fields.sleep_hours        ?? null,
        sleep_score:        fields.sleep_score        ?? null,
        steps:              fields.steps              ?? null,
        resting_heart_rate: fields.resting_heart_rate ?? null,
        calories_in:        fields.calories_in        ?? null,
        calories_out:       fields.calories_out       ?? null,
        notes:              body.notes || "",
      }
      data.logs.push(log)
    }

    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8")
    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error("Error writing health data:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
