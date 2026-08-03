import type { InStatement } from "@libsql/client"

export type CashFlowKind = "income" | "expense"
export type BalanceEffect = { type: CashFlowKind; amount: number; account: string; currency: string; settlementAmount?: number; settlementCurrency?: string }

function isLiabilityAccount(account: string) {
  const normalized = account.trim().toLowerCase()
  return normalized.includes("บัตรเครดิต") || normalized.includes("credit card") || normalized.includes("loan") || normalized.includes("สินเชื่อ")
}

function signedDelta(effect: BalanceEffect, multiplier = 1) {
  const liability = isLiabilityAccount(effect.account)
  const direction = liability
    ? effect.type === "expense" ? 1 : -1
    : effect.type === "income" ? 1 : -1
  return direction * Math.abs(effect.settlementAmount ?? effect.amount) * multiplier
}

export function balanceStatements(effect: BalanceEffect, multiplier = 1): InStatement[] {
  const account = effect.account.trim()
  const currency = (effect.settlementCurrency ?? effect.currency).trim().toUpperCase()
  const category = isLiabilityAccount(account) ? "liability" : "cash"
  const delta = signedDelta(effect, multiplier)
  return [
    {
      sql: `INSERT INTO finance_items (id, category, label, amount, currency)
            SELECT ?, ?, ?, 0, ?
            WHERE NOT EXISTS (SELECT 1 FROM finance_items WHERE category = ? AND lower(label) = lower(?) AND currency = ?)`,
      args: [crypto.randomUUID(), category, account, currency, category, account, currency],
    },
    {
      sql: `UPDATE finance_items SET amount = amount + ?, updated_at = datetime('now')
            WHERE id = (SELECT id FROM finance_items WHERE category = ? AND lower(label) = lower(?) AND currency = ? ORDER BY created_at ASC LIMIT 1)`,
      args: [delta, category, account, currency],
    },
  ]
}

export const ensureFinanceItemsTable = `CREATE TABLE IF NOT EXISTS finance_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('cash','other_asset','liability')),
  label TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`
