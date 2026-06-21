import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

const DIARY_DIR = path.join(process.cwd(), "data", "diary")

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS diary_entries (
      date      TEXT PRIMARY KEY,
      morning   TEXT NOT NULL DEFAULT '',
      afternoon TEXT NOT NULL DEFAULT '',
      evening   TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

function toMd(date: string, morning: string, afternoon: string, evening: string) {
  return `# ${date}\n\n## Morning\n${morning}\n\n## Afternoon\n${afternoon}\n\n## Evening\n${evening}\n`
}

async function writeMarkdownFile(date: string, morning: string, afternoon: string, evening: string) {
  try {
    await fs.mkdir(DIARY_DIR, { recursive: true })
    await fs.writeFile(path.join(DIARY_DIR, `${date}.md`), toMd(date, morning, afternoon, evening), "utf8")
  } catch {
    // Silently ignore on Railway (ephemeral filesystem)
  }
}

export async function GET() {
  try {
    await ensureTable()
    const result = await db.execute(
      "SELECT date, morning, afternoon, evening FROM diary_entries ORDER BY date DESC"
    )
    const entries = result.rows.map((r) => ({
      id:        r.date as string,
      date:      r.date as string,
      morning:   r.morning   as string,
      afternoon: r.afternoon as string,
      evening:   r.evening   as string,
    }))
    return NextResponse.json({ entries })
  } catch (error) {
    console.error("daily GET error:", error)
    return NextResponse.json({ entries: [] })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable()
    const body = await req.json()
    const date:      string = body.date      ?? new Date().toLocaleDateString("en-CA")
    const morning:   string = body.morning   ?? ""
    const afternoon: string = body.afternoon ?? ""
    const evening:   string = body.evening   ?? ""

    // Merge with existing entry (don't overwrite empty sections)
    const existing = await db.execute({
      sql:  "SELECT morning, afternoon, evening FROM diary_entries WHERE date = ?",
      args: [date],
    })

    let newMorning   = morning
    let newAfternoon = afternoon
    let newEvening   = evening

    if (existing.rows.length > 0) {
      const prev = existing.rows[0]
      if (!morning   && prev.morning)   newMorning   = prev.morning   as string
      if (!afternoon && prev.afternoon) newAfternoon = prev.afternoon as string
      if (!evening   && prev.evening)   newEvening   = prev.evening   as string
    }

    await db.execute({
      sql: `
        INSERT INTO diary_entries (date, morning, afternoon, evening, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(date) DO UPDATE SET
          morning   = excluded.morning,
          afternoon = excluded.afternoon,
          evening   = excluded.evening,
          updated_at = datetime('now')
      `,
      args: [date, newMorning, newAfternoon, newEvening],
    })

    // Also write .md file locally (silently ignored on Railway)
    await writeMarkdownFile(date, newMorning, newAfternoon, newEvening)

    return NextResponse.json({ success: true, date })
  } catch (error) {
    console.error("daily POST error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
