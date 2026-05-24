import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

const DEFAULT_SEEDS = [
  // Income Fixed
  { type: "income_fixed", label: "เงินเดือน", amount: 22668.82, currency: "THB" },
  
  // Income Variable
  { type: "income_variable", label: "part-time", amount: 0.00, currency: "THB" },
  { type: "income_variable", label: "หุ้น", amount: 0.00, currency: "THB" },
  { type: "income_variable", label: "บิทคอย", amount: 0.00, currency: "THB" },
  { type: "income_variable", label: "ทอง", amount: 0.00, currency: "THB" },
  
  // Fixed Expenses
  { type: "expense_fixed", label: "NETFLIX", amount: 183.41, currency: "THB" },
  { type: "expense_fixed", label: "ยูทูป", amount: 206.08, currency: "THB" },
  { type: "expense_fixed", label: "LR", amount: 206.08, currency: "THB" },
  { type: "expense_fixed", label: "VPN", amount: 230.81, currency: "THB" },
  { type: "expense_fixed", label: "TradingView", amount: 540.14, currency: "THB" },
  { type: "expense_fixed", label: "เน็ตส่วนตัว", amount: 659.46, currency: "THB" },
  { type: "expense_fixed", label: "Gemini", amount: 803.71, currency: "THB" },
  
  // Variable Expenses
  { type: "expense_variable", label: "เที่ยว", amount: 4121.60, currency: "THB" },
  { type: "expense_variable", label: "กลางวัน(เสาร์/อาทิตย์)/ข้าวเย็น", amount: 5152.01, currency: "THB" },
  { type: "expense_variable", label: "น้ำ", amount: 206.08, currency: "THB" },
  { type: "expense_variable", label: "ฉุกเฉิน6เดือน", amount: 2060.80, currency: "THB" },
  { type: "expense_variable", label: "เงินเกษียณ", amount: 4121.60, currency: "THB" },
  { type: "expense_variable", label: "เงินลงทุน", amount: 4121.60, currency: "THB" }
]

export async function GET() {
  try {
    // Check if table has items
    const countRes = await db.execute("SELECT COUNT(*) as cnt FROM monthly_items")
    const count = Number(countRes.rows[0]?.cnt ?? 0)
    
    if (count === 0) {
      console.log("[*] Seeding default monthly items into SQLite...")
      const statements = DEFAULT_SEEDS.map((s) => ({
        sql: "INSERT INTO monthly_items (id, type, label, amount, currency) VALUES (?, ?, ?, ?, ?)",
        args: [crypto.randomUUID(), s.type, s.label, s.amount, s.currency]
      }))
      await db.batch(statements)
    }

    const itemsRes = await db.execute("SELECT * FROM monthly_items ORDER BY created_at ASC")
    return NextResponse.json(itemsRes.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, label, amount, currency } = await req.json()
    if (!type || !label || amount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const id = crypto.randomUUID()
    await db.execute({
      sql: "INSERT INTO monthly_items (id, type, label, amount, currency) VALUES (?, ?, ?, ?, ?)",
      args: [id, type, label, amount, currency ?? "THB"]
    })

    const itemRes = await db.execute({
      sql: "SELECT * FROM monthly_items WHERE id = ?",
      args: [id]
    })
    return NextResponse.json(itemRes.rows[0], { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
