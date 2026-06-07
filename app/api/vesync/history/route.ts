import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"

export const dynamic = "force-dynamic"

const execAsync = promisify(exec)
const PYTHON = "C:\\Users\\trdyp\\AppData\\Local\\Programs\\Python\\Python312\\python.exe"
const dataFilePath = path.join(process.cwd(), "data", "health.json")

export async function POST() {
  const email    = process.env.VESYNC_EMAIL
  const password = process.env.VESYNC_PASSWORD
  if (!email || !password) {
    return NextResponse.json({ error: "Missing VeSync credentials" }, { status: 400 })
  }

  try {
    const script = path.join(process.cwd(), "scripts", "vesync_history.py")
    const { stdout, stderr } = await execAsync(`"${PYTHON}" "${script}"`, {
      env: { ...process.env, VESYNC_EMAIL: email, VESYNC_PASSWORD: password },
      timeout: 60_000,
    })
    if (stderr) console.warn("[vesync-history]", stderr.trim())

    const result = JSON.parse(stdout.trim())
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    const records: { date: string; weight: number; bmi?: number; body_fat?: number }[] =
      result.records || []

    if (records.length === 0) {
      return NextResponse.json({ synced: 0, message: "No historical records found from VeSync" })
    }

    // Merge into health.json
    const fileContents = await fs.readFile(dataFilePath, "utf8")
    const data = JSON.parse(fileContents)

    let synced = 0
    for (const rec of records) {
      const existingIdx = (data.logs as any[]).findIndex(
        (l: any) => String(l.date).substring(0, 10) === rec.date
      )
      if (existingIdx !== -1) {
        if (rec.weight != null) data.logs[existingIdx].weight = rec.weight
        if (rec.bmi    != null) data.logs[existingIdx].bmi    = rec.bmi
      } else {
        data.logs.push({
          id:                 `vesync_${rec.date}`,
          date:               rec.date,
          weight:             rec.weight,
          bmi:                rec.bmi ?? null,
          body_fat:           rec.body_fat ?? null,
          sleep_hours:        null,
          sleep_score:        null,
          steps:              null,
          resting_heart_rate: null,
          calories_in:        null,
          calories_out:       null,
          notes:              "VeSync History",
        })
      }
      synced++
    }

    data.logs.sort((a: any, b: any) =>
      String(a.date).substring(0, 10).localeCompare(String(b.date).substring(0, 10))
    )
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8")

    return NextResponse.json({ synced, device: result.device })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
