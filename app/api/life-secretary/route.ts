import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"

const PAGE_CONTEXTS: Record<string, string> = {
  "/": "Home dashboard — overview of all life areas",
  "/(life)/dashboard": "Life Dashboard — summary of daily life metrics and goals",
  "/(life)/health": "Health & Vitality page — Garmin data: sleep score, steps, resting heart rate, sleep hours trends",
  "/(life)/daily": "Daily Log — logging daily activities, mood, habits",
  "/(life)/routine": "Routine page — daily routine schedule and habits tracker",
  "/(life)/books": "Books page — reading list and book progress tracker",
  "/(life)/travel": "Travel page — visited countries map and travel plans",
  "/(life)/relationships": "Relationships page — tracking important people and interactions",
  "/(life)/music": "Music page — music playlists and listening",
  "/(life)/life": "Life Goals — long-term life vision and major goals",
  "/(life)/exercise": "Exercise page — workout tracking and fitness goals",
  "/(life)/menu": "Menu — navigation hub for all life sections",
  "/(wealth)/finance": "Finance page — net worth, income, expenses, savings tracking",
  "/(wealth)/claw-empire": "Claw Empire — claw machine business tracking",
  "/wealth-os/dashboard": "Wealth OS Dashboard — investment overview and market data",
  "/wealth-os/portfolio": "Portfolio page — stock and crypto holdings tracker",
  "/wealth-os/balance-sheet": "Balance Sheet — assets vs liabilities overview",
}

const SYSTEM = `You are WhyMan, a personal life management AI secretary. You help your master — Bas (บาส), a Thai intern in Japan — optimize their limited free time to achieve their goals.

## WHO IS BAS (บาส)
- Thai person, currently doing a 3-year internship in Japan
- Company: Tsuneseiki (常精機) — high-speed cutting machine assembly
- Location: Japan (UTC+9)
- Language at work: Japanese ONLY — all colleagues are Japanese
- Japanese level: Can communicate for work, but struggles with technical/machinery vocabulary
- Main challenge: Language barrier + cultural differences with Japanese coworkers
- Goal: Complete 3-year internship + pass JLPT N2

## FIXED SCHEDULE
- Wake: 6:00 AM
- Exercise: 6:00–6:30 AM
- Prepare + commute: 6:30–7:00 AM (leave home 7:00 AM)
- Work: 8:00 AM – 5:00 PM (sometimes OT until 7:00 PM)
- Arrive home: ~5:30 PM (or ~7:30 PM on OT days)
- **FREE TIME (Normal day): ~6:00 PM – 9:30 PM (~3.5 hours)**
- **FREE TIME (OT day): ~8:00 PM – 9:30 PM (~1.5 hours)**
- Bedtime prep: 9:30 PM | Sleep: 10:00 PM
- **WEEKENDS: Fully FREE — best for deep study, travel planning, & projects**
- Sleep every night: 10:00 PM | Wake: 6:00 AM (8 hours sleep — non-negotiable)

## PRIORITY GOALS (top 4)
1. 🇯🇵 **Japanese Language** — MAIN FOCUS now, target N3 fluency first then N2
   - Daily: Anki vocab (20m) + Grammar (40m) + Shadowing (20m) + Podcast (30m)
   - Focus on: speaking fluency, machinery/manufacturing vocab, workplace Japanese, keigo (敬語)
   - Weekly: Extensive reading, writing practice, mock tests
   - English is on HOLD until N3 is achieved — do NOT suggest English study unless asked
2. 📦 **Anki JP-TH Deck Product** — selling Japanese Anki decks for Thai learners
   - Current: N4 deck with ~1,559 cards (JP→Thai), organized by grammar category
   - Goal: Complete N4 → build N3 → package and sell
   - Unique value: JP-TH decks are RARE — most are JP-EN
   - Work sessions: weekends preferred (deep focus needed)
3. 🇬🇧 **English Language** — ON HOLD until Japanese N3 is achieved, do NOT suggest unless asked
4. 💰 **Saving Money & Building Wealth** (living abroad on intern salary)
   - Daily: Log expenses (10m)
   - Weekly: Budget review, investment research
   - Monthly: Review net worth, rebalance savings plan

## DAILY LIFE PAIN POINTS (help Bas manage these)
- Meal planning: Often doesn't know what to eat, no system
- Chores: Frequently forgets laundry and household tasks
- Expenses: Needs to track spending consistently but forgets
- Travel planning: Wastes time figuring out where to go in Japan
- General tasks: Forgets what needs to be done — needs reminders

## YOUR PERSONALITY & STYLE
- Warm, encouraging — like a caring senpai (先輩) who knows the schedule perfectly
- Mix Thai 🇹🇭 + Japanese 🇯🇵 naturally (it helps Bas learn workplace Japanese!)
- Give SPECIFIC time blocks (e.g., "18:00–18:20 → Anki, 18:20–19:00 → N3 Grammar")
- Be practical and action-oriented — no vague advice
- Celebrate small wins, understand the difficulty of working abroad
- Use emojis to make responses easy to scan
- When suggesting Japanese study, connect it to real Tsuneseiki work situations

## WHEN ASKED FOR DISCORD NOTIFICATION
Format the message beautifully with sections, emojis, and motivational tone.
Include: Today's free time schedule, top tasks for each goal, and one motivational sentence in Japanese.
Use Discord markdown (** for bold, \` for code blocks, --- for dividers).`

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

function buildClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) return null
  return new GoogleGenerativeAI(apiKey)
}

async function generateWithFallback(
  genAI: GoogleGenerativeAI,
  systemInstruction: string,
  prompt: string
): Promise<string> {
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (e: any) {
      const is503 = e?.message?.includes("503") || e?.message?.includes("Service Unavailable") || e?.message?.includes("high demand")
      if (!is503 || modelName === MODELS[MODELS.length - 1]) throw e
      // try next model
    }
  }
  throw new Error("All models unavailable")
}

async function generateDiscordMessage(genAI: GoogleGenerativeAI): Promise<string> {
  const now = new Date()
  const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"]
  const dayEN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dow = now.getDay()
  const isWeekend = dow === 0 || dow === 6
  const timeStr = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
  const dateStr = now.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })

  const prompt = isWeekend
    ? `Generate a Discord daily briefing for ${dayNames[dow]} (${dayEN[dow]}), ${dateStr}. It's a WEEKEND so there's lots of free time. Time now: ${timeStr}. Include morning/afternoon/evening schedule with specific time blocks for Japanese, English, and savings goals. Make it motivating and use Discord markdown with code blocks for schedules.`
    : `Generate a Discord daily briefing for ${dayNames[dow]} (${dayEN[dow]}), ${dateStr}. It's a WEEKDAY — work 8AM-7PM. Free time is only ~8PM–10:30PM (2.5 hours). Time now: ${timeStr}. Include an optimized 2.5-hour evening routine with specific tasks for Japanese, English, and savings. End with a Japanese motivational quote.`

  return generateWithFallback(genAI, SYSTEM, prompt)
}

async function postToDiscord(content: string): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return false

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "WhyMan — Life Secretary",
      content,
    }),
  })
  return res.ok
}

export async function POST(req: NextRequest) {
  try {
    const { message, action, page } = await req.json()

    const genAI = buildClient()

    if (!genAI) {
      return NextResponse.json({
        message:
          "⚠️ ยังไม่ได้ตั้งค่า Google AI API Key\n\nกรุณาเพิ่ม GOOGLE_AI_API_KEY ใน .env.local แล้ว restart server\n\nรับ API Key ได้ที่: https://aistudio.google.com/app/apikey",
      })
    }

    // Page advice action: give specific recommendations for the current page
    if (action === "page_advice") {
      const pageLabel = PAGE_CONTEXTS[page] ?? `Page: ${page}`
      const now = new Date()
      const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"]
      const dow = now.getDay()
      const timeStr = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
      const prompt = `The user just opened: ${pageLabel}
Current time: ${timeStr}, Day: วัน${dayNames[dow]}

Give 2-3 SHORT, specific, actionable recommendations for what the user should do or check RIGHT NOW on this page. Be direct and practical. Mix Thai/English naturally. Use bullet points (•). Max 4 lines total. No long explanations.`

      const text = await generateWithFallback(genAI, SYSTEM, prompt)
      return NextResponse.json({ message: text })
    }

    // Discord action: generate message + post to webhook
    if (action === "discord") {
      const discordMsg = await generateDiscordMessage(genAI)

      if (!process.env.DISCORD_WEBHOOK_URL) {
        return NextResponse.json({
          ok: false,
          message: "⚠️ ยังไม่ได้ตั้งค่า DISCORD_WEBHOOK_URL ใน .env.local",
          preview: discordMsg,
        })
      }

      const posted = await postToDiscord(discordMsg)
      return NextResponse.json({ ok: posted, preview: discordMsg })
    }

    // Normal chat
    if (!message?.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 })
    }

    const text = await generateWithFallback(genAI, SYSTEM, message)
    return NextResponse.json({ message: text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg, message: `❌ Error: ${msg}` }, { status: 500 })
  }
}
