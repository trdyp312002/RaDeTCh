import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "travel-spots.json")

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")))
}
