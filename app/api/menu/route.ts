import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "menu.json")

export const dynamic = "force-dynamic";

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
}

function writeData(data: unknown) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function GET() {
  return NextResponse.json(readData())
}

export async function POST(req: NextRequest) {
  const item = await req.json()
  if (!item.name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  const data = readData()
  item.id = Date.now().toString()
  data.items.push(item)
  writeData(data)
  return NextResponse.json(item, { status: 201 })
}
