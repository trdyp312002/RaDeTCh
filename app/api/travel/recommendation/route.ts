import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "travel-spots.json")
const LOGS_DIR = path.join(process.cwd(), "data", "travel-logs")

type Spot = {
  id: string; name: string; nameJP: string; region: string; desc: string;
  tags: string[]; status: string; visitedDate: string | null; note: string
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getMostRecentFriday(now: Date): Date {
  const day = now.getDay()
  const diff = day >= 5 ? day - 5 : day + 2
  const friday = new Date(now)
  friday.setDate(now.getDate() - diff)
  return friday
}

export async function GET() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as { toyama: Spot[]; japan: Spot[]; world: Spot[] }

  const now = new Date()
  const friday = getMostRecentFriday(now)
  const fridayDay = friday.getDate()
  const category: "toyama" | "japan" = fridayDay > 27 ? "japan" : "toyama"
  const weekNum = getISOWeek(friday)
  const year = friday.getFullYear()
  const weekKey = `${year}-W${String(weekNum).padStart(2, "0")}`
  const fridayStr = friday.toISOString().split("T")[0]

  const pool = data[category]
  const available = pool.filter((s) => s.status !== "visited")
  const pickList = available.length > 0 ? available : pool
  const spot = pickList[weekNum % pickList.length]

  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true })
  const logFile = path.join(LOGS_DIR, `travel-${weekKey}.md`)
  if (!fs.existsSync(logFile)) {
    const categoryLabel = category === "toyama" ? "Toyama, Japan" : "Japan (National)"
    fs.writeFileSync(logFile, `---\nweek: ${weekKey}\nfriday: ${fridayStr}\ncategory: ${category}\nspot_id: ${spot.id}\n---\n\n# Week ${weekNum}, ${year} — ${categoryLabel}\n\n**Spot:** ${spot.name} (${spot.nameJP})\n**Region:** ${spot.region}\n\n${spot.desc}\n\n**Tags:** ${spot.tags.join(", ")}\n`, "utf-8")
  }

  return NextResponse.json({ spot, category, weekKey, fridayStr, fridayDay })
}
