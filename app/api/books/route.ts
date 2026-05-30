import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

// ฟังก์ชันสร้างตารางหากไม่มี
async function ensureTableExists() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'ทั่วไป',
      status TEXT DEFAULT 'wishlist' CHECK(status IN ('wishlist', 'bought', 'reading', 'completed')),
      cover_image TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  try {
    // เพิ่มคอลัมน์ในตารางกรณีที่มีการสร้างตารางไว้ก่อนหน้าแล้ว
    await db.execute(`ALTER TABLE books ADD COLUMN cover_image TEXT`)
  } catch (e) {
    // คอลัมน์อาจจะมีอยู่แล้ว ให้ข้ามข้อผิดพลาดนี้ไป
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTableExists()
    const category = new URL(req.url).searchParams.get("category")
    const status = new URL(req.url).searchParams.get("status")
    
    let query = "SELECT * FROM books"
    const args: string[] = []
    const conditions: string[] = []
    
    if (category) {
      conditions.push("category = ?")
      args.push(category)
    }
    if (status) {
      conditions.push("status = ?")
      args.push(status)
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ")
    }
    
    query += " ORDER BY created_at DESC"
    
    const rowsRes = await db.execute({ sql: query, args })
    return NextResponse.json(rowsRes.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTableExists()
    const { title, author, description, category, status, cover_image } = await req.json()

    if (!title || !author) {
      return NextResponse.json({ error: "Title and Author are required" }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await db.execute({
      sql: "INSERT INTO books (id, title, author, description, category, status, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        id, 
        title, 
        author, 
        description ?? null, 
        category ?? "ทั่วไป", 
        status ?? "wishlist",
        cover_image ?? null
      ]
    })

    const bookRes = await db.execute({
      sql: "SELECT * FROM books WHERE id = ?",
      args: [id]
    })
    return NextResponse.json(bookRes.rows[0], { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
