import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await req.json()
    
    // ค้นหาก่อนว่ามีอยู่จริงหรือไม่
    const existing = await db.execute({
      sql: "SELECT * FROM books WHERE id = ?",
      args: [id]
    })
    
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const { title, author, description, category, status } = updates
    
    // หากมีการส่งสถานะมา ให้ตรวจสอบความถูกต้อง
    if (status && !['wishlist', 'bought', 'reading', 'completed'].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }
    
    await db.execute({
      sql: `UPDATE books SET 
              title = COALESCE(?, title),
              author = COALESCE(?, author),
              description = COALESCE(?, description),
              category = COALESCE(?, category),
              status = COALESCE(?, status),
              updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        title ?? null, 
        author ?? null, 
        description ?? null, 
        category ?? null, 
        status ?? null, 
        id
      ]
    })

    const updated = await db.execute({
      sql: "SELECT * FROM books WHERE id = ?",
      args: [id]
    })
    
    return NextResponse.json(updated.rows[0])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const result = await db.execute({
      sql: "DELETE FROM books WHERE id = ?",
      args: [id]
    })
    
    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
