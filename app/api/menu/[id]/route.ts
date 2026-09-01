import { NextRequest, NextResponse } from "next/server"
import { deleteMenuItem, updateMenuItem } from "@/lib/menu-store"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await updateMenuItem(id, await req.json())
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error("Menu update:", error)
    return NextResponse.json({ error: "Unable to update menu" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!await deleteMenuItem(id)) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Menu delete:", error)
    return NextResponse.json({ error: "Unable to delete menu" }, { status: 500 })
  }
}