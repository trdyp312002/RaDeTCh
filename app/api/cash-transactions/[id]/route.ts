import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { balanceStatements, ensureFinanceItemsTable, type CashFlowKind } from "@/lib/cash-flow-balance"

type Params = { params: Promise<{ id: string }> }
type StoredTransaction = { type: CashFlowKind; amount: number; account: string; currency: string; settlement_amount: number | null; settlement_currency: string | null }
const effect = (item: StoredTransaction) => ({ ...item, settlementAmount: item.settlement_amount ?? item.amount, settlementCurrency: item.settlement_currency ?? item.currency })

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params; const body = await req.json(); const type = body.type === "income" ? "income" : body.type === "expense" ? "expense" : null
    const amount = Number(body.amount); const category = String(body.category || "").trim(); const account = String(body.account || "").trim(); const date = String(body.date || ""); const currency = String(body.currency || "THB").trim().toUpperCase(); const settlementCurrency = String(body.settlementCurrency || currency).trim().toUpperCase(); const settlementAmount = Number(body.settlementAmount ?? amount); const note = String(body.note || "").trim() || null
    if (!type || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(settlementAmount) || settlementAmount <= 0 || !category || !account || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ" }, { status: 400 })
    await db.execute(ensureFinanceItemsTable)
    const oldResult = await db.execute({ sql: "SELECT type, amount, account, currency, settlement_amount, settlement_currency FROM cash_transactions WHERE id = ?", args: [id] }); const old = oldResult.rows[0] as unknown as StoredTransaction | undefined
    if (!old) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 })
    await db.batch([...balanceStatements(effect(old), -1), { sql: "UPDATE cash_transactions SET type = ?, amount = ?, category = ?, account = ?, date = ?, note = ?, currency = ?, settlement_amount = ?, settlement_currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", args: [type, amount, category, account, date, note, currency, settlementAmount, settlementCurrency, id] }, ...balanceStatements({ type, amount, account, currency, settlementAmount, settlementCurrency })], "write")
    const result = await db.execute({ sql: "SELECT * FROM cash_transactions WHERE id = ?", args: [id] }); return NextResponse.json(result.rows[0])
  } catch (error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 }) }
}
export async function DELETE(_req: NextRequest, { params }: Params) {
  try { const { id } = await params; await db.execute(ensureFinanceItemsTable); const result = await db.execute({ sql: "SELECT type, amount, account, currency, settlement_amount, settlement_currency FROM cash_transactions WHERE id = ?", args: [id] }); const old = result.rows[0] as unknown as StoredTransaction | undefined; if (!old) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 }); await db.batch([...balanceStatements(effect(old), -1), { sql: "DELETE FROM cash_transactions WHERE id = ?", args: [id] }], "write"); return NextResponse.json({ ok: true }) } catch (error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 }) }
}