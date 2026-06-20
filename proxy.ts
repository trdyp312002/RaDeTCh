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
  return NextResponse.next()
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
