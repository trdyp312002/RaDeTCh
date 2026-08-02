import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { balanceStatements, ensureFinanceItemsTable } from "@/lib/cash-flow-balance"

export const dynamic = "force-dynamic"

async function ensureTables() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS cash_transactions (
      id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0), category TEXT NOT NULL, account TEXT NOT NULL,
      date TEXT NOT NULL, note TEXT, currency TEXT NOT NULL DEFAULT 'THB',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    ensureFinanceItemsTable,
    "CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date DESC)",
  ])
}

export async function GET(req: NextRequest) {
  try {
    await ensureTables()
    const url = new URL(req.url); const month = url.searchParams.get("month"); const type = url.searchParams.get("type")
    const args: string[] = []; const clauses: string[] = []
    if (month && /^\d{4}-\d{2}$/.test(month)) { clauses.push("substr(date, 1, 7) = ?"); args.push(month) }
    if (type === "income" || type === "expense") { clauses.push("type = ?"); args.push(type) }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : ""
    const result = await db.execute({ sql: `SELECT * FROM cash_transactions${where} ORDER BY date DESC, created_at DESC`, args })
    return NextResponse.json(result.rows)
  } catch (error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables()
    const body = await req.json()
    const type = body.type === "income" ? "income" : body.type === "expense" ? "expense" : null
    const amount = Number(body.amount); const category = String(body.category || "").trim(); const account = String(body.account || "").trim()
    const date = String(body.date || ""); const currency = String(body.currency || "THB").trim().toUpperCase(); const note = String(body.note || "").trim() || null
    if (!type || !Number.isFinite(amount) || amount <= 0 || !category || !account || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ" }, { status: 400 })
    const id = crypto.randomUUID()
    await db.batch([
      { sql: "INSERT INTO cash_transactions (id, type, amount, category, account, date, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: [id, type, amount, category, account, date, note, currency] },
      ...balanceStatements({ type, amount, account, currency }),
    ], "write")
    const result = await db.execute({ sql: "SELECT * FROM cash_transactions WHERE id = ?", args: [id] })
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 }) }
}
