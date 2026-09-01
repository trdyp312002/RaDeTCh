import { NextRequest, NextResponse } from "next/server"
import { createMenuItem, listMenuItems } from "@/lib/menu-store"

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ items: await listMenuItems() })
  } catch (error) {
    console.error("Menu read:", error)
    return NextResponse.json({ error: "Unable to load menu" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const item = await req.json()
    if (!item.name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    return NextResponse.json(await createMenuItem(item), { status: 201 })
  } catch (error) {
    console.error("Menu create:", error)
    return NextResponse.json({ error: "Unable to save menu" }, { status: 500 })
  }
}