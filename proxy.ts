import { NextRequest, NextResponse } from "next/server"

// Paths reachable without a session (the login page + the auth endpoint itself).
const PUBLIC_PATHS = ["/login", "/api/auth"]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

// SHA-256 hex digest using Web Crypto (available in the Edge runtime).
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const password = process.env.APP_PASSWORD
  // Gate disabled until APP_PASSWORD is configured (fail open) so a fresh
  // deploy is reachable. Set APP_PASSWORD (locally + on Railway) to enable it.
  if (!password) return NextResponse.next()

  const expected = await sha256(password)
  const token = req.cookies.get("radetch_session")?.value

  if (token === expected) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.search = ""
  return NextResponse.redirect(url)
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
