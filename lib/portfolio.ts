export type Transaction = {
  id: string
  holding_id: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  fees: number
  date: string
  notes: string | null
  created_at: string
}

export type Holding = {
  id: string
  symbol: string
  name: string
  type: string
  created_at: string
  updated_at: string
}

export type HoldingWithCalc = Holding & {
  quantity: number
  avgCost: number
  totalCost: number
  transactions: Transaction[]
}

export type FinanceItem = {
  id: string
  category: "cash" | "other_asset" | "liability"
  label: string
  amount: number
  currency: string
  created_at: string
  updated_at: string
}

// Calculate current position from transaction history (average cost method)
export function calcPosition(transactions: Transaction[]): {
  quantity: number
  avgCost: number
  totalCost: number
} {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let quantity = 0
  let totalCost = 0

  for (const tx of sorted) {
    if (tx.type === "BUY") {
      totalCost += tx.quantity * tx.price + tx.fees
      quantity += tx.quantity
    } else {
      // SELL: reduce proportionally
      if (quantity > 0) {
        const sellRatio = Math.min(tx.quantity, quantity) / quantity
        totalCost -= totalCost * sellRatio
        quantity -= Math.min(tx.quantity, quantity)
      }
    }
  }

  const avgCost = quantity > 0 ? totalCost / quantity : 0
  return { quantity, avgCost, totalCost }
}
