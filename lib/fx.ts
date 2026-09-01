import db from "@/lib/db"

export const FX_BASE_CURRENCY = "THB" as const
export type FxDataStatus = "complete" | "incomplete" | "not_applicable"

export function isFxApplicable(type: string | null | undefined) { return type === "stock" || type === "etf" }

/** Historical USD/THB close only. Never substitutes a current rate. */
export async function historicalUsdThb(date: string): Promise<number | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const start = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000)
  for (const host of ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"]) {
    try {
      const response = await fetch(`${host}/v8/finance/chart/USDTHB=X?period1=${start}&period2=${start + 259200}&interval=1d`, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" }, next: { revalidate: 86400 } })
      if (!response.ok) continue
      const json = await response.json()
      const closes: unknown[] = json.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
      const rate = closes.find((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
      if (rate) return rate
    } catch { /* try the secondary source */ }
  }
  return null
}

export async function ensureFxSchemaAndBackfill() {
  const info = await db.execute("PRAGMA table_info(transactions)")
  const columns = new Set(info.rows.map(row => String(row.name)))
  const add = async (name: string, definition: string) => { if (!columns.has(name)) await db.execute(`ALTER TABLE transactions ADD COLUMN ${name} ${definition}`) }
  await add("purchase_fx_rate", "REAL")
  await add("original_cost_thb", "REAL")
  await add("fx_fee_thb", "REAL NOT NULL DEFAULT 0")
  await add("fx_data_status", "TEXT")
  const rows = await db.execute(`SELECT t.id, t.quantity, t.price, t.date, h.type holding_type FROM transactions t JOIN holdings h ON h.id = t.holding_id WHERE t.type = 'BUY' AND t.fx_data_status IS NULL`)
  for (const row of rows.rows) {
    if (!isFxApplicable(String(row.holding_type ?? ""))) { await db.execute({ sql: "UPDATE transactions SET fx_data_status = ? WHERE id = ?", args: ["not_applicable", String(row.id)] }); continue }
    const rate = await historicalUsdThb(String(row.date))
    if (rate == null) { await db.execute({ sql: "UPDATE transactions SET fx_data_status = ? WHERE id = ?", args: ["incomplete", String(row.id)] }); continue }
    await db.execute({ sql: "UPDATE transactions SET purchase_fx_rate = ?, original_cost_thb = ?, fx_fee_thb = COALESCE(fx_fee_thb, 0), fx_data_status = ? WHERE id = ?", args: [rate, Number(row.quantity) * Number(row.price) * rate, "complete", String(row.id)] })
  }
}