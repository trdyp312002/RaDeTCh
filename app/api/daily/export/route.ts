import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

const DIARY_DIR = path.join(process.cwd(), "data", "diary")

function toMd(date: string, morning: string, afternoon: string, evening: string) {
  return `# ${date}\n\n## Morning\n${morning}\n\n## Afternoon\n${afternoon}\n\n## Evening\n${evening}\n`
}

// GET /api/daily/export — export all diary entries from DB to data/diary/*.md
export async function GET() {
  try {
    await fs.mkdir(DIARY_DIR, { recursive: true })

    const result = await db.execute(
      "SELECT date, morning, afternoon, evening FROM diary_entries ORDER BY date DESC"
    )

    let count = 0
    for (const row of result.rows) {
      const date      = row.date      as string
      const morning   = row.morning   as string
      const afternoon = row.afternoon as string
      const evening   = row.evening   as string

      await fs.writeFile(
        path.join(DIARY_DIR, `${date}.md`),
        toMd(date, morning, afternoon, evening),
        "utf8"
      )
      count++
    }

    return NextResponse.json({
      success: true,
      exported: count,
      path: DIARY_DIR,
      message: `Exported ${count} diary entries to data/diary/`,
    })
  } catch (error) {
    console.error("export error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
