import type { FxDataStatus } from "@/lib/fx"
export type Transaction = { id: string; holding_id: string; type: "BUY" | "SELL"; quantity: number; price: number; fees: number; purchase_fx_rate?: number | null; original_cost_thb?: number | null; fx_fee_thb?: number | null; fx_data_status?: FxDataStatus | null; date: string; notes: string | null; created_at: string }
export type Holding = { id: string; symbol: string; name: string; type: string; created_at: string; updated_at: string }
export type HoldingWithCalc = Holding & { quantity: number; avgCost: number; totalCost: number; totalCostThb: number | null; fxDataStatus: FxDataStatus; transactions: Transaction[] }
export type FinanceItem = { id: string; category: "cash" | "other_asset" | "liability"; label: string; amount: number; currency: string; created_at: string; updated_at: string }

// Average-cost method: a SELL reduces USD and THB cost bases by the same proportion.
export function calcPosition(transactions: Transaction[]) {
  let quantity = 0, totalCost = 0, totalCostThb = 0, applicable = false, complete = true
  for (const tx of [...transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    if (tx.type === "BUY") {
      totalCost += Number(tx.quantity) * Number(tx.price) + Number(tx.fees ?? 0); quantity += Number(tx.quantity)
      if (tx.fx_data_status === "complete" && tx.original_cost_thb != null) { applicable = true; totalCostThb += Number(tx.original_cost_thb) }
      else if (tx.fx_data_status !== "not_applicable") complete = false
    } else if (quantity > 0) { const sold = Math.min(Number(tx.quantity), quantity), ratio = sold / quantity; totalCost -= totalCost * ratio; totalCostThb -= totalCostThb * ratio; quantity -= sold }
  }
  return { quantity, avgCost: quantity > 0 ? totalCost / quantity : 0, totalCost, totalCostThb: applicable && complete ? totalCostThb : null, fxDataStatus: applicable ? (complete ? "complete" as const : "incomplete" as const) : "not_applicable" as const }
}