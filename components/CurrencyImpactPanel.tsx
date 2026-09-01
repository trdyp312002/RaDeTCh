"use client"

type Holding = { id: string; symbol: string; name: string; type: string; quantity: number; totalCost: number; totalCostThb?: number | null; fxDataStatus?: "complete" | "incomplete" | "not_applicable"; currentValue?: number }

type Props = { holdings: Holding[]; currentFx: number }
const usd = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const thb = (value: number) => `฿${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const color = (value: number) => value >= 0 ? "text-emerald-600" : "text-rose-500"

export default function CurrencyImpactPanel({ holdings, currentFx }: Props) {
  const eligible = holdings.filter(h => h.type === "stock" || h.type === "etf")
  const complete = eligible.filter(h => h.fxDataStatus === "complete" && h.totalCostThb != null && h.totalCost > 0 && h.currentValue != null)
  const incomplete = eligible.filter(h => h.fxDataStatus === "incomplete")
  if (eligible.length === 0) return null
  const metrics = complete.map(h => {
    const originalCostThb = h.totalCostThb as number
    const valueUsd = h.currentValue as number
    const purchaseFx = originalCostThb / h.totalCost
    const stockPnlUsd = valueUsd - h.totalCost
    const stockEffectThb = stockPnlUsd * purchaseFx
    const fxEffectThb = valueUsd * (currentFx - purchaseFx)
    const totalPnlThb = valueUsd * currentFx - originalCostThb
    return { h, originalCostThb, valueUsd, purchaseFx, stockPnlUsd, stockEffectThb, fxEffectThb, totalPnlThb, totalReturn: (totalPnlThb / originalCostThb) * 100 }
  })
  const stockEffect = metrics.reduce((sum, m) => sum + m.stockEffectThb, 0)
  const fxEffect = metrics.reduce((sum, m) => sum + m.fxEffectThb, 0)
  const total = metrics.reduce((sum, m) => sum + m.totalPnlThb, 0)
  const original = metrics.reduce((sum, m) => sum + m.originalCostThb, 0)
  return <section className="mt-5 pt-5 border-t border-gray-200/60">
    <div className="flex items-baseline justify-between gap-3 mb-3"><div><p className="text-[10px] uppercase tracking-[0.25em] font-bold text-stone-500">Currency Impact</p><p className="text-[10px] text-stone-400 mt-1">USD investments measured in THB · 1 USD = {currentFx.toFixed(2)} THB</p></div>{incomplete.length > 0 && <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">{incomplete.length} position{incomplete.length > 1 ? "s" : ""} missing historical FX</span>}</div>
    {metrics.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <Metric label="Stock Gain/Loss" value={stockEffect} className={color(stockEffect)} />
      <Metric label={fxEffect < 0 ? "FX Headwind" : "FX Gain/Loss"} value={fxEffect} className={color(fxEffect)} />
      <Metric label="Combined / Portfolio Return" value={total} detail={`${original > 0 ? (total / original * 100).toFixed(2) : "0.00"}%`} className={color(total)} />
    </div>}
    <div className="space-y-2">{metrics.map(m => <article key={m.h.id} className="rounded-xl border border-stone-200 bg-white p-3"><div className="flex justify-between gap-3"><div><p className="font-mono font-bold text-sm text-stone-800">{m.h.symbol}</p><p className="text-[10px] text-stone-400">{m.h.name}</p></div><div className={`text-right font-mono text-sm font-bold ${color(m.totalPnlThb)}`}>{m.totalPnlThb >= 0 ? "+" : ""}{thb(m.totalPnlThb)}<p className="text-[10px] font-medium">{m.totalReturn >= 0 ? "+" : ""}{m.totalReturn.toFixed(2)}%</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-3 text-[10px] font-mono text-stone-500"><Line label="Cost Basis" value={usd(m.h.totalCost)} /><Line label="Current Value" value={usd(m.valueUsd)} /><Line label="Stock P/L" value={`${m.stockPnlUsd >= 0 ? "+" : ""}${usd(m.stockPnlUsd)}`} className={color(m.stockPnlUsd)} /><Line label="Stock Effect" value={`${m.stockEffectThb >= 0 ? "+" : ""}${thb(m.stockEffectThb)}`} className={color(m.stockEffectThb)} /><Line label="Purchase FX" value={m.purchaseFx.toFixed(4)} /><Line label="Current USD/THB" value={currentFx.toFixed(4)} /><Line label="FX Gain/Loss" value={`${m.fxEffectThb >= 0 ? "+" : ""}${thb(m.fxEffectThb)}`} className={color(m.fxEffectThb)} /><Line label="Original Cost" value={thb(m.originalCostThb)} /><Line label="Current Value THB" value={thb(m.valueUsd * currentFx)} /><Line label="Total P/L THB" value={`${m.totalPnlThb >= 0 ? "+" : ""}${thb(m.totalPnlThb)}`} className={color(m.totalPnlThb)} /><Line label="Total Return" value={`${m.totalReturn >= 0 ? "+" : ""}${m.totalReturn.toFixed(2)}%`} className={color(m.totalReturn)} /></div></article>)}</div>
    {incomplete.length > 0 && <p className="text-[10px] text-amber-700 mt-3">Historical USD/THB was unavailable for: {incomplete.map(h => h.symbol).join(", ")}. Currency Impact is withheld rather than using today’s exchange rate.</p>}
  </section>
}
function Metric({ label, value, detail, className }: { label: string; value: number; detail?: string; className: string }) { return <div className="rounded-xl bg-stone-50 border border-stone-100 p-3"><p className="text-[9px] uppercase tracking-wider text-stone-400">{label}</p><p className={`font-mono font-bold text-sm mt-1 ${className}`}>{value >= 0 ? "+" : ""}{thb(value)}</p>{detail && <p className={`font-mono text-[10px] mt-0.5 ${className}`}>{detail}</p>}</div> }
function Line({ label, value, className = "text-stone-600" }: { label: string; value: string; className?: string }) { return <div><p className="text-stone-400">{label}</p><p className={className}>{value}</p></div> }