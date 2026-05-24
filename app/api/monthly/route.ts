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
    const countRow = db.prepare("SELECT COUNT(*) as cnt FROM monthly_items").get() as { cnt: number }
    
    if (countRow.cnt === 0) {
      console.log("[*] Seeding default monthly items into SQLite...")
      const stmt = db.prepare(
        "INSERT INTO monthly_items (id, type, label, amount, currency) VALUES (?, ?, ?, ?, ?)"
      )
      
      const transaction = db.transaction((seeds) => {
        for (const s of seeds) {
          const id = crypto.randomUUID()
          stmt.run(id, s.type, s.label, s.amount, s.currency)
        }
      })
      transaction(DEFAULT_SEEDS)
    }

    const items = db.prepare("SELECT * FROM monthly_items ORDER BY created_at ASC").all()
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, label, amount, currency } = await req.json()
    if (!type || !label || amount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    const id = crypto.randomUUID()
    db.prepare(
      "INSERT INTO monthly_items (id, type, label, amount, currency) VALUES (?, ?, ?, ?, ?)"
    ).run(id, type, label, amount, currency ?? "THB")

    const item = db.prepare("SELECT * FROM monthly_items WHERE id = ?").get(id)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
