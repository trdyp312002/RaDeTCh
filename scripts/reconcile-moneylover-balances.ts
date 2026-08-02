import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()
import type { InStatement } from "@libsql/client"
import db from "../lib/db"
import { ensureFinanceItemsTable } from "../lib/cash-flow-balance"

function isLiability(account: string) {
  const value = account.toLowerCase()
  return value.includes("บัตรเครดิต") || value.includes("credit card") || value.includes("loan") || value.includes("สินเชื่อ")
}

async function main() {
  const sourcePrefix = process.argv[2]
  if (!sourcePrefix) throw new Error("Usage: npx tsx scripts/reconcile-moneylover-balances.ts <source-id-prefix>")
  await db.execute(ensureFinanceItemsTable)
  await db.execute("CREATE TABLE IF NOT EXISTS cash_flow_balance_syncs (source_key TEXT PRIMARY KEY, synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
  const already = await db.execute({ sql: "SELECT source_key FROM cash_flow_balance_syncs WHERE source_key = ?", args: [sourcePrefix] })
  if (already.rows[0]) { console.log(JSON.stringify({ sourcePrefix, applied: false, reason: "already reconciled" })); return }
  const grouped = await db.execute({
    sql: `SELECT account, currency, SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS cash_delta
          FROM cash_transactions WHERE id LIKE ? GROUP BY account, currency`,
    args: [`${sourcePrefix}%`],
  })
  if (!grouped.rows.length) throw new Error("No matching imported cash transactions found")
  const statements: InStatement[] = [{ sql: "INSERT INTO cash_flow_balance_syncs (source_key) VALUES (?)", args: [sourcePrefix] }]
  for (const row of grouped.rows) {
    const account = String(row.account); const currency = String(row.currency); const cashDelta = Number(row.cash_delta)
    const category = isLiability(account) ? "liability" : "cash"
    const delta = isLiability(account) ? -cashDelta : cashDelta
    statements.push(
      { sql: `INSERT INTO finance_items (id, category, label, amount, currency)
              SELECT ?, ?, ?, 0, ? WHERE NOT EXISTS (SELECT 1 FROM finance_items WHERE category = ? AND lower(label) = lower(?) AND currency = ?)`, args: [crypto.randomUUID(), category, account, currency, category, account, currency] },
      { sql: `UPDATE finance_items SET amount = amount + ?, updated_at = datetime('now')
              WHERE id = (SELECT id FROM finance_items WHERE category = ? AND lower(label) = lower(?) AND currency = ? ORDER BY created_at ASC LIMIT 1)`, args: [delta, category, account, currency] },
    )
  }
  await db.batch(statements, "write")
  console.log(JSON.stringify({ sourcePrefix, applied: true, accounts: grouped.rows.length, balances: grouped.rows }, null, 2))
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exit(1) })
