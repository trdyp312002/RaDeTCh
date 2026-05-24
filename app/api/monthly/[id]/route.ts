import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

type Props = {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const { type, label, amount, currency } = await req.json()
    
    if (!type || !label || amount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await db.execute({
      sql: `UPDATE monthly_items 
       SET type = ?, label = ?, amount = ?, currency = ?, updated_at = datetime('now') 
       WHERE id = ?`,
      args: [type, label, amount, currency ?? "THB", id]
    })

    const itemRes = await db.execute({
      sql: "SELECT * FROM monthly_items WHERE id = ?",
      args: [id]
    })
    const item = itemRes.rows[0]
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 444 })
    }
    return NextResponse.json(item)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    
    const existsRes = await db.execute({
      sql: "SELECT * FROM monthly_items WHERE id = ?",
      args: [id]
    })
    const exists = existsRes.rows[0]
    if (!exists) {
      return NextResponse.json({ error: "Item not found" }, { status: 444 })
    }

    await db.execute({
      sql: "DELETE FROM monthly_items WHERE id = ?",
      args: [id]
    })
    return NextResponse.json({ success: true, message: "Deleted successfully" })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
