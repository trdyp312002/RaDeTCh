import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
function authorized(req: NextRequest) { const secret = process.env.CRON_SECRET?.trim(); return Boolean(secret) && req.headers.get("x-cron-secret") === secret }
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const origin = new URL(req.url).origin; const headers = { "x-cron-secret": process.env.CRON_SECRET ?? "" }
  try {
    const [holdingsRes, fxRes, financeRes] = await Promise.all([fetch(`${origin}/api/holdings`, { headers, cache: "no-store" }), fetch(`${origin}/api/fx`, { cache: "no-store" }), fetch(`${origin}/api/finance`, { headers, cache: "no-store" })])
    if (!holdingsRes.ok || !fxRes.ok || !financeRes.ok) throw new Error("Unable to load portfolio data")
    const holdings = await holdingsRes.json(); const fx = await fxRes.json(); const finance = await financeRes.json(); const rate = Number(fx?.rates?.THB)
    if (!Array.isArray(holdings) || !Number.isFinite(rate) || rate <= 0) throw new Error("Live FX rate unavailable")
    const symbols = [...new Set(holdings.map((h: any) => { const s = String(h.symbol).toUpperCase(); return h.type === "crypto" && !s.includes("-USD") ? `${s}-USD` : s }))]
    const marketRes = symbols.length ? await fetch(`${origin}/api/market?symbols=${encodeURIComponent(symbols.join(","))}&range=1d&live=1`, { headers, cache: "no-store" }) : null
    const market = marketRes?.ok ? await marketRes.json() : {}
    const valueUsd = holdings.reduce((sum: number, h: any) => { const s = String(h.symbol).toUpperCase(); const y = h.type === "crypto" && !s.includes("-USD") ? `${s}-USD` : s; const price = Number(market?.[y]?.currentPrice ?? market?.[s]?.currentPrice ?? h.totalValue ?? h.totalCost ?? 0); return sum + (Number(h.quantity) > 0 ? price * Number(h.quantity) : 0) }, 0)
    const date = new Date().toISOString().slice(0, 10)
    const toUsd = (amount: number, currency: string) => { const code = String(currency).toUpperCase(); if (code === "USD") return amount; const fxRate = Number(fx?.rates?.[code]); return fxRate > 0 ? amount / fxRate : amount }
    const financeItems = Array.isArray(finance) ? finance : []
    const cashUsd = financeItems.filter((item: any) => item.category === "cash").reduce((sum: number, item: any) => sum + toUsd(Number(item.amount) || 0, item.currency), 0)
    const otherAssetsUsd = financeItems.filter((item: any) => item.category === "other_asset").reduce((sum: number, item: any) => sum + toUsd(Number(item.amount) || 0, item.currency), 0)
    const liabilitiesUsd = financeItems.filter((item: any) => item.category === "liability").reduce((sum: number, item: any) => sum + toUsd(Number(item.amount) || 0, item.currency), 0)
    const totalAssetsUsd = valueUsd + cashUsd + otherAssetsUsd
    const netWorthUsd = totalAssetsUsd - liabilitiesUsd
    await fetch(`${origin}/api/networth`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ date, net_worth: netWorthUsd, total_assets: totalAssetsUsd, total_liabilities: liabilitiesUsd }), cache: "no-store" })
    const saveRes = await fetch(`${origin}/api/portfolio-snapshots`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ portfolio: "all", date, value_usd: valueUsd, value_thb: valueUsd * rate, fx_rate: rate }), cache: "no-store" })
    if (!saveRes.ok) throw new Error("Unable to save portfolio snapshot")
    return NextResponse.json({ ok: true, date, value_usd: valueUsd, value_thb: valueUsd * rate, fx_rate: rate })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Snapshot failed" }, { status: 500 }) }
}