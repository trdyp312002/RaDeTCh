import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Login: exchange the password for an httpOnly session cookie.
export async function POST(req: NextRequest) {
  const password = process.env.APP_PASSWORD?.trim()
  if (!password) {
    return NextResponse.json(
      { error: "APP_PASSWORD is not configured on the server" },
      { status: 500 }
    )
  }

  const body = await req.json().catch(() => ({}))
  if (!body.password || body.password !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set("radetch_session", await sha256(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}

// Logout: clear the session cookie.
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("radetch_session", "", { path: "/", maxAge: 0 })
  return res
}
