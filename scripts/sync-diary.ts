/**
 * sync-diary.ts
 * ดึง diary entries จาก API แล้วเขียนลงไฟล์ data/diary/*.md อัตโนมัติ
 * รันพร้อม dev server ผ่าน npm run dev:all
 */

import * as dotenv from "dotenv"
import fs from "fs/promises"
import path from "path"

dotenv.config({ path: ".env.local" })

const APP_URL  = (process.env.WHYMAN_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")
const PASSWORD = process.env.APP_PASSWORD ?? ""
const DIARY_DIR = path.join(process.cwd(), "data", "diary")
const INTERVAL_MS = 60_000 // sync ทุก 1 นาที

type Entry = { date: string; morning: string; afternoon: string; evening: string }

function toMd(e: Entry) {
  return `# ${e.date}\n\n## ☀️ Morning\n${e.morning || ""}\n\n## ☁️ Afternoon\n${e.afternoon || ""}\n\n## 🌙 Evening\n${e.evening || ""}\n`
}

async function sync() {
  try {
    const res = await fetch(`${APP_URL}/api/daily`, {
      headers: PASSWORD ? { "x-app-password": PASSWORD } : {},
    })
    if (!res.ok) throw new Error(`GET /api/daily failed: ${res.status}`)

    const { entries } = await res.json() as { entries: Entry[] }
    if (!entries.length) return

    await fs.mkdir(DIARY_DIR, { recursive: true })

    let written = 0
    for (const entry of entries) {
      const filePath = path.join(DIARY_DIR, `${entry.date}.md`)
      const content = toMd(entry)

      // เขียนเฉพาะเมื่อเนื้อหาเปลี่ยน
      let existing = ""
      try { existing = await fs.readFile(filePath, "utf8") } catch { /* new file */ }
      if (existing !== content) {
        await fs.writeFile(filePath, content, "utf8")
        written++
      }
    }

    if (written > 0) {
      console.log(`[sync-diary] ✓ ${new Date().toLocaleTimeString("th-TH")} — เขียน ${written} ไฟล์`)
    }
  } catch (err) {
    console.error(`[sync-diary] ✗ ${err instanceof Error ? err.message : err}`)
  }
}

// --once flag: sync ครั้งเดียวแล้วออก (ใช้กับ Task Scheduler / startup)
const ONCE = process.argv.includes("--once")

if (ONCE) {
  console.log(`[sync-diary] sync ครั้งเดียว (--once) → ${DIARY_DIR}`)
  sync().then(() => process.exit(0))
} else {
  console.log(`[sync-diary] เริ่ม sync ทุก ${INTERVAL_MS / 1000}s → ${DIARY_DIR}`)
  sync() // sync ทันทีตอน start
  setInterval(sync, INTERVAL_MS)
}
