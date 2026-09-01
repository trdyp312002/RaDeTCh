"use client"

type Holding = { id: string; symbol: string; type: string; quantity: number; totalCost: number; totalCostThb?: number | null; fxDataStatus?: "complete" | "incomplete" | "not_applicable"; currentValue?: number }
type LivePrice = { currentPrice: number }
type Props = { holdings: Holding[]; livePrices: Record<string, LivePrice>; currentFx: number }
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value)
export default function WealthCurrencyImpact({ holdings, livePrices, currentFx }: Props) {
  const eligible = holdings.filter(h => h.type === "stock" || h.type === "etf")
  const complete = eligible.flatMap(h => { const price = livePrices[h.symbol]?.currentPrice; const value = price ? price * h.quantity : h.currentValue; if (h.fxDataStatus !== "complete" || h.totalCostThb == null || !value || h.totalCost <= 0) return []; const purchaseFx = h.totalCostThb / h.totalCost; return [{ symbol: h.symbol, fx: value * (currentFx - purchaseFx) }] })
  const incomplete = eligible.filter(h => h.fxDataStatus === "incomplete")
  if (!eligible.length) return null
  const fx = complete.reduce((sum, position) => sum + position.fx, 0), headwind = fx < 0
  return <div className={`pf-fx-compact ${headwind ? "is-headwind" : "is-tailwind"}`}><div className="pf-fx-compact-main"><span className="pf-fx-dot"/><strong>{headwind ? "FX Headwind" : "FX Tailwind"}</strong><span className="pf-fx-compact-value">{fx >= 0 ? "+" : ""}{money(fx)}</span><span className="pf-fx-compact-copy">จาก USD/THB {currentFx.toFixed(2)}</span></div><div className="pf-fx-compact-meta">{complete.length > 0 ? complete.map(p => <span key={p.symbol}>{p.symbol}</span>) : <span>กำลังรอข้อมูล FX</span>}{incomplete.length > 0 && <span className="pf-fx-incomplete">FX history missing: {incomplete.map(h => h.symbol).join(", ")}</span>}</div></div>
}