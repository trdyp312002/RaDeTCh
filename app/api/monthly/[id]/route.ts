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

    db.prepare(
      `UPDATE monthly_items 
       SET type = ?, label = ?, amount = ?, currency = ?, updated_at = datetime('now') 
       WHERE id = ?`
    ).run(type, label, amount, currency ?? "THB", id)

    const item = db.prepare("SELECT * FROM monthly_items WHERE id = ?").get(id)
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 444 })
    }
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    
    const exists = db.prepare("SELECT * FROM monthly_items WHERE id = ?").get(id)
    if (!exists) {
      return NextResponse.json({ error: "Item not found" }, { status: 444 })
    }

    db.prepare("DELETE FROM monthly_items WHERE id = ?").run(id)
    return NextResponse.json({ success: true, message: "Deleted successfully" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
