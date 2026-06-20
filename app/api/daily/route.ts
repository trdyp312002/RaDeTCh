import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const DIR = path.resolve(process.cwd(), "..", "..", "DATA", "diary")

export const dynamic = "force-dynamic"

function toMd(date: string, morning: string, afternoon: string, evening: string) {
  return `# ${date}\n\n## Morning\n${morning}\n\n## Afternoon\n${afternoon}\n\n## Evening\n${evening}\n`
}

function parseMd(date: string, content: string) {
  const section = (header: string) => {
    const re = new RegExp(`## ${header}\\n([\\s\\S]*?)(?=\\n## |$)`)
    return (content.match(re)?.[1] ?? "").trim()
  }
  return {
    id: date,
    date,
    morning:   section("Morning"),
    afternoon: section("Afternoon"),
    evening:   section("Evening"),
  }
}

export async function GET() {
  try {
    await fs.mkdir(DIR, { recursive: true })
    const files = (await fs.readdir(DIR))
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse()

    const entries = await Promise.all(
      files.map(async (f) => {
        const date = f.replace(".md", "")
        const content = await fs.readFile(path.join(DIR, f), "utf8")
        return parseMd(date, content)
      })
    )

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("daily GET error:", error)
    return NextResponse.json({ entries: [] })
  }
}

export async function POST(req: Request) {
  try {
    await fs.mkdir(DIR, { recursive: true })
    const body = await req.json()
    const date: string = body.date ?? new Date().toLocaleDateString("en-CA")
    const morning:   string = body.morning   ?? ""
    const afternoon: string = body.afternoon ?? ""
    const evening:   string = body.evening   ?? ""

    const filePath = path.join(DIR, `${date}.md`)
    await fs.writeFile(filePath, toMd(date, morning, afternoon, evening), "utf8")

    return NextResponse.json({ success: true, date })
  } catch (error) {
    console.error("daily POST error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
