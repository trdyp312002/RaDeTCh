import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "visited-countries.json")

export const dynamic = "force-dynamic";

export async function GET() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]")
  }
  return NextResponse.json(JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")))
}

export async function POST(req: Request) {
  const body = await req.json()
  fs.writeFileSync(DATA_FILE, JSON.stringify(body))
  return NextResponse.json({ success: true })
}
