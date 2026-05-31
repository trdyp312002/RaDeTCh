import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const dataPath = path.join(process.cwd(), "data", "music-playlist.json");
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ total: 0, languages: [] });
  }
}