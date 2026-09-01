import { NextRequest, NextResponse } from "next/server"
import { historicalUsdThb } from "@/lib/fx"
export const dynamic = "force-dynamic"
export async function GET(req: NextRequest) {
  const date = new URL(req.url).searchParams.get("date")
  if (date) { const rate = await historicalUsdThb(date); return NextResponse.json({ base: "USD", quote: "THB", date, rate, status: rate == null ? "incomplete" : "complete" }) }
  try { const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } }); if (!res.ok) throw new Error("fx fetch failed"); const json = await res.json(); return NextResponse.json({ rates: json.rates }) }
  catch { return NextResponse.json({ rates: { THB: 35.5, JPY: 150 }, stale: true }) }
}