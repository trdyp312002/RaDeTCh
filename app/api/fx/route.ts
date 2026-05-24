import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error("fx fetch failed")
    const json = await res.json()
    return NextResponse.json({ rates: json.rates })
  } catch {
    return NextResponse.json({ rates: { THB: 35.5, JPY: 150 } })
  }
}
