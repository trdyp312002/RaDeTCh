import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "menu.json")

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
}

function writeData(data: unknown) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updates = await req.json()
  const data = readData()
  const idx = data.items.findIndex((item: { id: string }) => item.id === id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
  data.items[idx] = { ...data.items[idx], ...updates }
  writeData(data)
  return NextResponse.json(data.items[idx])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = readData()
  const before = data.items.length
  data.items = data.items.filter((item: { id: string }) => item.id !== id)
  if (data.items.length === before) return NextResponse.json({ error: "Not found" }, { status: 404 })
  writeData(data)
  return NextResponse.json({ ok: true })
}
