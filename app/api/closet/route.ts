import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS closet_creations (
    id TEXT PRIMARY KEY,
    image_data TEXT NOT NULL,
    style TEXT NOT NULL,
    source_name TEXT DEFAULT '',
    created_at TEXT NOT NULL
  )`);
}

export async function GET() {
  try {
    await ensureTable();
    const result = await db.execute("SELECT id, image_data, style, source_name, created_at FROM closet_creations ORDER BY created_at DESC LIMIT 50");
    return NextResponse.json({ creations: result.rows.map(row => ({
      id: String(row.id),
      image: String(row.image_data),
      style: String(row.style),
      sourceName: String(row.source_name || ""),
      createdAt: String(row.created_at),
    })) });
  } catch (error) {
    console.error("Closet archive read:", error);
    return NextResponse.json({ error: "โหลดคลังภาพไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = String(body.image || "");
    if (!/^data:image\/(?:jpeg|png|webp);base64,/.test(image)) return NextResponse.json({ error: "รูปภาพไม่ถูกต้อง" }, { status: 400 });
    await ensureTable();
    await db.execute({
      sql: "INSERT OR IGNORE INTO closet_creations (id, image_data, style, source_name, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [String(body.id), image, String(body.style || "3D Look").slice(0, 80), String(body.sourceName || "").slice(0, 180), String(body.createdAt || new Date().toISOString())],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Closet archive migration:", error);
    return NextResponse.json({ error: "บันทึกรูปไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    await ensureTable();
    await db.execute({ sql: "DELETE FROM closet_creations WHERE id = ?", args: [String(body.id || "")] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Closet archive delete:", error);
    return NextResponse.json({ error: "ลบรูปไม่สำเร็จ" }, { status: 500 });
  }
}
