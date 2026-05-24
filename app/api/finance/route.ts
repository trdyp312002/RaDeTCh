import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

const DEFAULT_FINANCE_SEEDS = [
  // cash (Liquid Assets)
  { category: "cash", label: "EMERGENCY FUND", amount: 2060.80, currency: "THB" },
  { category: "cash", label: "US Treasury bills", amount: 0.00, currency: "THB" },
  { category: "cash", label: "Fiat", amount: 0.00, currency: "THB" },
  { category: "cash", label: "Cash", amount: 0.00, currency: "THB" },
  
  // other_asset (Investment & Personal Assets)
  { category: "other_asset", label: "BTC", amount: 771.14, currency: "THB" },
  { category: "other_asset", label: "US STOCK", amount: 1832.76, currency: "THB" },
  { category: "other_asset", label: "GOLD", amount: 0.00, currency: "THB" },
  { category: "other_asset", label: "Vehicles", amount: 0.00, currency: "THB" },
  { category: "other_asset", label: "Land", amount: 0.00, currency: "THB" },
  
  // liability (Leverage / Debts)
  { category: "liability", label: "Bank", amount: 0.00, currency: "THB" },
  { category: "liability", label: "SPaylator", amount: 17322.00, currency: "THB" },
  { category: "liability", label: "SEasyCash", amount: 13200.00, currency: "THB" }
]

export async function GET() {
  try {
    const countRow = db.prepare("SELECT COUNT(*) as cnt FROM finance_items").get() as { cnt: number }
    if (countRow.cnt === 0) {
      console.log("[*] Seeding default balance sheet items into SQLite...")
      const stmt = db.prepare(
        "INSERT INTO finance_items (id, category, label, amount, currency) VALUES (?, ?, ?, ?, ?)"
      )
      
      const transaction = db.transaction((seeds) => {
        for (const s of seeds) {
          const id = crypto.randomUUID()
          stmt.run(id, s.category, s.label, s.amount, s.currency)
        }
      })
      transaction(DEFAULT_FINANCE_SEEDS)
    }

    const items = db.prepare("SELECT * FROM finance_items ORDER BY category, created_at ASC").all()
    return NextResponse.json(items)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { category, label, amount, currency } = await req.json()
    if (!category || !label || amount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const id = crypto.randomUUID()
    db.prepare(
      "INSERT INTO finance_items (id, category, label, amount, currency) VALUES (?, ?, ?, ?, ?)"
    ).run(id, category, label, amount, currency ?? "THB")

    const item = db.prepare("SELECT * FROM finance_items WHERE id = ?").get(id)
    return NextResponse.json(item, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
