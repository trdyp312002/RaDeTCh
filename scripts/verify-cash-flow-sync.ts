import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()
import db from "../lib/db"
import { balanceStatements, ensureFinanceItemsTable } from "../lib/cash-flow-balance"

async function cashAmount() {
  const result = await db.execute({ sql: "SELECT amount FROM finance_items WHERE category = 'cash' AND lower(label) = lower(?) AND currency = 'THB' ORDER BY created_at ASC LIMIT 1", args: ["เงินสด"] })
  return Number(result.rows[0]?.amount ?? 0)
}

async function main() {
  await db.execute(ensureFinanceItemsTable)
  const effect = { type: "expense" as const, amount: 1, account: "เงินสด", currency: "THB" }
  const id = `verification:${crypto.randomUUID()}`
  const before = await cashAmount()
  try {
    await db.batch([{ sql: "INSERT INTO cash_transactions (id, type, amount, category, account, date, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: [id, effect.type, effect.amount, "System test", effect.account, "2026-08-02", "temporary verification", effect.currency] }, ...balanceStatements(effect)], "write")
    const afterCreate = await cashAmount()
    await db.batch([...balanceStatements(effect, -1), { sql: "DELETE FROM cash_transactions WHERE id = ?", args: [id] }], "write")
    const afterDelete = await cashAmount()
    console.log(JSON.stringify({ before, afterCreate, afterDelete, createDelta: afterCreate - before, deleteRestored: afterDelete === before }, null, 2))
  } finally {
    const exists = await db.execute({ sql: "SELECT id FROM cash_transactions WHERE id = ?", args: [id] })
    if (exists.rows[0]) await db.batch([...balanceStatements(effect, -1), { sql: "DELETE FROM cash_transactions WHERE id = ?", args: [id] }], "write")
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exit(1) })
