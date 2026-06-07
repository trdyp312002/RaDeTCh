import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

export const dynamic = "force-dynamic"

const execAsync = promisify(exec)

const PYTHON = "C:\\Users\\trdyp\\AppData\\Local\\Programs\\Python\\Python312\\python.exe"

export async function GET() {
  const email = process.env.VESYNC_EMAIL
  const password = process.env.VESYNC_PASSWORD

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing VESYNC_EMAIL or VESYNC_PASSWORD in .env.local" },
      { status: 400 }
    )
  }

  try {
    const script = path.join(process.cwd(), "scripts", "vesync_weight.py")
    const { stdout, stderr } = await execAsync(`"${PYTHON}" "${script}"`, {
      env: { ...process.env, VESYNC_EMAIL: email, VESYNC_PASSWORD: password },
      timeout: 30_000,
    })

    if (stderr) console.warn("[vesync]", stderr.trim())

    const data = JSON.parse(stdout.trim())
    if (data.error) {
      return NextResponse.json({ error: data.error, detail: data }, { status: 502 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to run vesync script" },
      { status: 500 }
    )
  }
}
