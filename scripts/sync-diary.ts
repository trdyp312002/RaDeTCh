/**
 * sync-diary.ts
 * ดึง diary entries จาก Turso DB โดยตรง แล้วเขียนลงไฟล์ BRAIN/06-Diary/*.md
 * รันตอน login ผ่าน Startup folder (sync-diary-run.bat)
 */

import * as dotenv from "dotenv"
import fs from "fs/promises"
import path from "path"
import { createClient } from "@libsql/client"

dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

// Save to BRAIN/06-Diary (Obsidian vault — scripts/ → radetch/ → 02-Projects/ → BRAIN/)
const DIARY_DIR = path.join(__dirname, "..", "..", "..", "06-Diary")
const INTERVAL_MS = 12 * 60 * 60 * 1000 // sync ทุก 12 ชั่วโมง

const dbUrl   = process.env.TURSO_DATABASE_URL
const dbToken = process.env.TURSO_AUTH_TOKEN

if (!dbUrl) {
  console.error("[sync-diary] ✗ TURSO_DATABASE_URL ไม่ได้ตั้งค่าใน .env.local")
  process.exit(1)
}

const db = createClient({ url: dbUrl, authToken: dbToken })

type Entry = { date: string; morning: string; afternoon: string; evening: string }

function toMd(e: Entry) {
  return `# ${e.date}\n\n## ☀️ Morning\n${e.morning || ""}\n\n## ☁️ Afternoon\n${e.afternoon || ""}\n\n## 🌙 Evening\n${e.evening || ""}\n`
}

async function sync() {
  try {
    const result = await db.execute(
      "SELECT date, morning, afternoon, evening FROM diary_entries ORDER BY date DESC"
    )

    const entries: Entry[] = result.rows.map(r => ({
      date:      r.date      as string,
      morning:   r.morning   as string ?? "",
      afternoon: r.afternoon as string ?? "",
      evening:   r.evening   as string ?? "",
    }))

    if (!entries.length) {
      console.log("[sync-diary] ℹ️ ไม่มี diary entries ใน DB")
      return
    }

    await fs.mkdir(DIARY_DIR, { recursive: true })

    let written = 0
    for (const entry of entries) {
      const filePath = path.join(DIARY_DIR, `${entry.date}.md`)
      const content  = toMd(entry)

      let existing = ""
      try { existing = await fs.readFile(filePath, "utf8") } catch { /* new file */ }

      if (existing !== content) {
        await fs.writeFile(filePath, content, "utf8")
        written++
      }
    }

    const ts = new Date().toLocaleTimeString("th-TH")
    if (written > 0) {
      console.log(`[sync-diary] ✓ ${ts} — เขียน ${written}/${entries.length} ไฟล์`)
    } else {
      console.log(`[sync-diary] ✓ ${ts} — ทุกไฟล์เป็นปัจจุบันแล้ว (${entries.length} entries)`)
    }
  } catch (err) {
    console.error(`[sync-diary] ✗ ${err instanceof Error ? err.message : err}`)
  }
}

// --once flag: sync ครั้งเดียวแล้วออก (ใช้กับ Startup folder)
const ONCE = process.argv.includes("--once")

if (ONCE) {
  console.log(`[sync-diary] sync ครั้งเดียว (--once) → ${DIARY_DIR}`)
  sync().then(() => { db.close(); process.exit(0) })
} else {
  console.log(`[sync-diary] เริ่ม sync ทุก ${INTERVAL_MS / 1000 / 3600}h → ${DIARY_DIR}`)
  sync()
  setInterval(sync, INTERVAL_MS)
}
