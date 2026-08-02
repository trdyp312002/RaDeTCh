/**
 * One-off: merge diary from 06-Diary/*.md + Railway API → Turso DB
 */
import * as dotenv from "dotenv"
import fs from "fs/promises"
import path from "path"
import { createClient } from "@libsql/client"

dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

const DIARY_DIR = path.join(__dirname, "..", "..", "..", "06-Diary")
const APP_URL = (process.env.WHYMAN_APP_URL ?? "https://radetch-production.up.railway.app").replace(/\/$/, "")
const PASSWORD = process.env.APP_PASSWORD ?? ""

type Entry = { date: string; morning: string; afternoon: string; evening: string }

function parseMd(content: string, fallbackDate: string): Entry {
  const dateMatch = content.match(/^#\s+(\d{4}-\d{2}-\d{2})/m)
  const date = dateMatch?.[1] ?? fallbackDate

  const sections = content.split(/^##\s+/m).slice(1)
  const pick = (label: string) => {
    const block = sections.find(s => s.startsWith(label))
    if (!block) return ""
    return block.replace(new RegExp(`^${label}\\s*\\n?`), "").trim()
  }

  return {
    date,
    morning: pick("☀️ Morning"),
    afternoon: pick("☁️ Afternoon"),
    evening: pick("🌙 Evening"),
  }
}

function merge(a: Entry, b: Entry): Entry {
  const pick = (x: string, y: string) => {
    if (!x && y) return y
    if (!y) return x
    return y.length >= x.length ? y : x
  }
  return {
    date: a.date,
    morning: pick(a.morning, b.morning),
    afternoon: pick(a.afternoon, b.afternoon),
    evening: pick(a.evening, b.evening),
  }
}

async function loadFromFiles(): Promise<Map<string, Entry>> {
  const map = new Map<string, Entry>()
  let files: string[]
  try {
    files = (await fs.readdir(DIARY_DIR)).filter(f => f.endsWith(".md"))
  } catch {
    return map
  }
  for (const file of files) {
    const date = file.replace(".md", "")
    const content = await fs.readFile(path.join(DIARY_DIR, file), "utf8")
    map.set(date, parseMd(content, date))
  }
  return map
}

async function loadFromRailway(): Promise<Map<string, Entry>> {
  const map = new Map<string, Entry>()
  const res = await fetch(`${APP_URL}/api/daily`, {
    headers: PASSWORD ? { "x-app-password": PASSWORD } : {},
  })
  if (!res.ok) throw new Error(`Railway API ${res.status}`)
  const { entries } = (await res.json()) as { entries: Entry[] }
  for (const e of entries) map.set(e.date, e)
  return map
}

async function loadFromTurso(db: ReturnType<typeof createClient>): Promise<Map<string, Entry>> {
  const map = new Map<string, Entry>()
  const result = await db.execute(
    "SELECT date, morning, afternoon, evening FROM diary_entries"
  )
  for (const r of result.rows) {
    map.set(r.date as string, {
      date: r.date as string,
      morning: (r.morning as string) ?? "",
      afternoon: (r.afternoon as string) ?? "",
      evening: (r.evening as string) ?? "",
    })
  }
  return map
}

async function main() {
  const dbUrl = process.env.TURSO_DATABASE_URL
  const dbToken = process.env.TURSO_AUTH_TOKEN
  if (!dbUrl) throw new Error("TURSO_DATABASE_URL missing")

  const db = createClient({ url: dbUrl, authToken: dbToken })

  await db.execute(`
    CREATE TABLE IF NOT EXISTS diary_entries (
      date       TEXT PRIMARY KEY,
      morning    TEXT NOT NULL DEFAULT '',
      afternoon  TEXT NOT NULL DEFAULT '',
      evening    TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  const merged = new Map<string, Entry>()
  for (const src of [await loadFromTurso(db), await loadFromFiles(), await loadFromRailway()]) {
    for (const [date, entry] of src) {
      merged.set(date, merged.has(date) ? merge(merged.get(date)!, entry) : entry)
    }
  }

  let upserted = 0
  for (const entry of merged.values()) {
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
      args: [entry.date, entry.morning, entry.afternoon, entry.evening],
    })
    upserted++
    console.log(`  ✓ ${entry.date}`)
  }

  console.log(`\n[import] รวม ${upserted} entries เข้า Turso`)
  db.close()
}

main().catch(err => {
  console.error("[import] ✗", err)
  process.exit(1)
})
