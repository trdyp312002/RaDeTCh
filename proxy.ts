import { NextRequest, NextResponse } from "next/server"

// Public callbacks still enforce their own authentication (LINE uses HMAC signatures).
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/line/webhook"]

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

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const password = process.env.APP_PASSWORD?.trim()
  if (!password) {
    return NextResponse.next()
  }

  const expected = await sha256(password)

  // Allow bot/API clients using x-app-password header (plain password)
  const headerPassword = req.headers.get("x-app-password")
  if (headerPassword === password) {
    return NextResponse.next()
  }

  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) {
    return NextResponse.next()
  }

  // Allow browser sessions using cookie (hashed password)
  const session = req.cookies.get("radetch_session")?.value
  if (session !== expected) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
