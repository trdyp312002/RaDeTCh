import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "travel-spots.json")

type Status = "not-visited" | "planned" | "visited"
type Spot = { id: string; status: Status; visitedDate: string | null; note: string; [key: string]: unknown }
type SpotsData = { toyama: Spot[]; japan: Spot[]; world: Spot[] }

function readData(): SpotsData {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
}

function writeData(data: SpotsData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as { status?: Status; visitedDate?: string; note?: string }
  const data = readData()

  let found = false
  for (const category of ["toyama", "japan", "world"] as const) {
    const idx = data[category].findIndex((s) => s.id === id)
    if (idx !== -1) {
      if (body.status !== undefined) data[category][idx].status = body.status
      if (body.visitedDate !== undefined) data[category][idx].visitedDate = body.visitedDate
      if (body.note !== undefined) data[category][idx].note = body.note
      found = true
      break
    }
  }

  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 })
  writeData(data)
  return NextResponse.json({ ok: true })
}
