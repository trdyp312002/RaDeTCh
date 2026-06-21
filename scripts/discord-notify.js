/**
 * discord-notify.js — Daily Discord briefing from WhyMan AI Secretary
 *
 * Usage:
 *   node scripts/discord-notify.js                   (morning briefing)
 *   node scripts/discord-notify.js --evening          (evening reminder)
 *   node scripts/discord-notify.js --weekend          (weekend plan)
 *
 * Schedule via Windows Task Scheduler:
 *   Morning:  06:20 daily    → node scripts/discord-notify.js
 *   Evening:  20:00 weekdays → node scripts/discord-notify.js --evening
 *   Weekend:  08:00 sat/sun  → node scripts/discord-notify.js --weekend
 */

const fs   = require("fs")
const path = require("path")

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1")
  }
}

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
const GOOGLE_KEY  = process.env.GOOGLE_AI_API_KEY
const MODE        = process.argv.includes("--evening") ? "evening"
                  : process.argv.includes("--weekend") ? "weekend"
                  : "morning"

const TODAY      = new Date()
const DAY_TH     = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"][TODAY.getDay()]
const DAY_JP     = ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"][TODAY.getDay()]
const IS_WEEKEND = TODAY.getDay() === 0 || TODAY.getDay() === 6
const DATE_STR   = TODAY.toLocaleDateString("th-TH", { year:"numeric", month:"long", day:"numeric" })

// ─────────────────────────────────────────────────────────────────────────────
// Stock Market Watchlist
// ─────────────────────────────────────────────────────────────────────────────

const STOCKS = [
  { ticker: "ARM",  name: "Arm Holdings"    },
  { ticker: "NVDA", name: "NVIDIA"          },
  { ticker: "OKLO", name: "Oklo"            },
  { ticker: "CRWD", name: "CrowdStrike"     },
  { ticker: "GOOGL",name: "Google/Alphabet" },
  { ticker: "MSFT", name: "Microsoft"       },
  { ticker: "PLTR", name: "Palantir"        },
  { ticker: "RKLB", name: "Rocket Lab"      },  // user listed "rglb" → closest public ticker is RKLB
  { ticker: "TSLA", name: "Tesla"           },
]
// SpaceX is a private company — fetch news by keyword only
const SPACEX_QUERY = "SpaceX"

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept":     "application/json, text/plain, */*",
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/** Fetch latest news headlines for a search query via Yahoo Finance */
async function fetchNews(query, count = 3) {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=${count}&quotesCount=0&lang=en-US`
    const res  = await fetch(url, { headers: YF_HEADERS })
    if (!res.ok) return []
    const json = await res.json()
    return (json?.news ?? []).slice(0, count).map(n => ({
      title:     n.title,
      publisher: n.publisher ?? "",
    })).filter(n => n.title)
  } catch {
    return []
  }
}

/** Build the News Digest Discord message block (no prices — long-term hold) */
async function buildStockSection() {
  console.log("📰 Fetching stock news from Yahoo Finance…")

  const sections = []

  const all = [...STOCKS, { ticker: SPACEX_QUERY, name: "SpaceX (private)" }]

  for (const s of all) {
    const news = await fetchNews(s.ticker ?? s.name, 3)
    await sleep(400)

    if (news.length === 0) {
      sections.push(`**${s.name ?? s.ticker}** — ไม่พบข่าวล่าสุด`)
    } else {
      const label = s.name ? `${s.ticker ? `${s.ticker} · ` : ""}${s.name}` : s.ticker
      const lines = news.map(n => `> • ${n.title}${n.publisher ? `  *(${n.publisher})*` : ""}`)
      sections.push(`**📌 ${label}**\n${lines.join("\n")}`)
    }
  }

  let msg = `## 📰 Long-Term Portfolio News — ${DATE_STR}\n`
  msg += `> *ถือยาว 10 ปี — ติดตามข่าวรายวัน ไม่สนราคา*\n\n`
  msg += sections.join("\n\n")
  msg += `\n\n*Source: Yahoo Finance*`
  return msg
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule-based fallback message (no API key)
// ─────────────────────────────────────────────────────────────────────────────

function buildFallbackMessage() {
  if (MODE === "morning") {
    if (IS_WEEKEND) {
      return `## 🌅 おはようございます！ วันหยุดสุดสัปดาห์ — ${DAY_TH} ${DATE_STR}

> *「継続は力なり」— ความสม่ำเสมอคือพลัง*

---

### 📅 แผนวันนี้ — วันหยุด มีเวลาเยอะมาก!

**🌸 06:00–06:30** → 🏃 ออกกำลังกาย
**🍳 06:30–07:10** → อาหารเช้า เตรียมตัว

**⭐ 07:10–12:00** → Deep Focus Session (4.5 ชั่วโมง)
\`\`\`
🇯🇵 07:10–08:00  N3/N2 Grammar (50m)
🇯🇵 08:00–08:20  Anki Vocab (20m)
🇯🇵 08:20–08:40  Shadowing (20m)
☕ 08:40–09:00  พัก (20m)
🇯🇵 09:00–10:00  多読 / Extensive Reading (60m)
🇬🇧 10:00–11:00  English Writing Practice (60m)
💰 11:00–12:00  Investment Research / Finance (60m)
\`\`\`

**🍱 12:00–13:00** → พักกลางวัน

**⭐ 13:00–17:00** → Skills & Projects (4 ชั่วโมง)
\`\`\`
🇬🇧 13:00–14:00  English Speaking / TED (60m)
🇬🇧 14:00–14:30  English Podcast (30m)
💰 14:30–15:30  Budget Review / Net Worth (60m)
📚 15:30–17:00  อ่านหนังสือ / Project (90m)
\`\`\`

**🎮 17:00–18:30** → พักผ่อน อิสระ
**⭐ 18:30–20:00** → ทบทวนสัปดาห์ + วางแผน
**⭐ 20:00–21:30** → ยามค่ำ เสริม + ผ่อนคลาย
**🌙 21:30** → เตรียมนอน · **22:00** → 💤 (8h → ตื่น 06:00)

---
**🎯 Priority วันนี้:** N2 Grammar ✦ English Writing ✦ Budget Review
**💬 一日一歩、必ず目標に近づける！** (ก้าวละก้าว ต้องถึงเป้าหมายแน่นอน)`
    } else {
      return `## 🌤️ おはようございます！ ${DAY_TH}曜日 — ${DATE_STR}

> *「努力は必ず報われる」— ความพยายามจะได้รับผลตอบแทนเสมอ*

---

### 📅 ตารางวันทำงานวันนี้

**🏃 06:00–06:30** → ออกกำลังกาย
**🎒 06:30–07:00** → เตรียมตัว ออกจากบ้าน 07:00
**💼 08:00–19:00** → ทำงาน

---

### ⭐ Evening Routine — 20:00–21:30 (1.5 ชั่วโมง)

\`\`\`
🍚 19:30–20:00  อาหารเย็น + พักสั้น (30m)
🇯🇵 20:00–20:20  Anki Vocab (20m)
🇯🇵 20:20–21:00  N3/N2 Grammar (40m)
🇬🇧 21:00–21:15  English Vocab (15m)
💰 21:15–21:25  บันทึกค่าใช้จ่าย (10m)
🌙 21:25–21:30  ทบทวนวัน (5m)
\`\`\`

**🌙 21:30** → เตรียมนอน · **22:00** → 💤 **(8 ชั่วโมง → ตื่น 06:00)**

---
**🎯 Focus วันนี้:** Anki → Grammar → Shadowing → English Writing
**💰 ออมเงิน:** บันทึกทุกค่าใช้จ่ายวันนี้ก่อนนอน!
**頑張ってください！** 💪`
    }
  }

  if (MODE === "evening") {
    return `## 🌆 Evening Check-in — ${DAY_TH} ${DATE_STR}

> こんばんは！ ถึงเวลา Self-Development แล้ว 🌟

---

### ⭐ แผน 1.5 ชั่วโมงที่เหลือ

\`\`\`
🇯🇵 NOW–+40m     N3/N2 Grammar ← เริ่มก่อน สมองยังสด
🇯🇵 +40m–+60m   Anki Vocab (20m)
🇬🇧 +60m–+75m   English Vocab (15m)
💰 +75m–+85m    บันทึกค่าใช้จ่าย (10m)
🌙 21:30         เตรียมนอน → นอน 22:00
\`\`\`

---
**💡 Tip วันนี้:** หลังจาก Grammar ให้ลอง output ทันที — เขียนประโยคใหม่ 5 ประโยค
**しっかり頑張れ！** あと少し！`
  }

  return `## 🏖️ Weekend Reminder — ${DAY_TH} ${DATE_STR}

> 週末も成長のチャンス！ (วันหยุดก็คือโอกาสเติบโต!)

มีเวลาว่างทั้งวัน ใช้ให้คุ้มค่า!
ดูแผนละเอียดได้ที่ Daily Schedule tab 📅`
}

// ─────────────────────────────────────────────────────────────────────────────
// AI-powered message generator
// ─────────────────────────────────────────────────────────────────────────────

async function buildAIMessage() {
  const prompt = MODE === "morning"
    ? `Generate a motivating Discord daily briefing for ${DAY_TH} (${DAY_JP}), ${DATE_STR}. ${IS_WEEKEND ? "It is a WEEKEND — lots of free time. Include a full-day schedule." : "It is a WEEKDAY — work 8AM-7PM. Focus on the 1.5-hour evening routine (8PM-9:30PM)."} Include specific time blocks for: 1) Japanese study (N3/N2), 2) English practice, 3) Savings/finance tasks. Use emojis and Discord markdown. End with one motivational Japanese quote with Thai translation.`
    : MODE === "evening"
    ? `Generate a short Discord evening reminder for ${DAY_TH}. Work just ended. Remind to start the 1.5-hour self-development session tonight (Japanese, English, expenses). Use emojis, Discord markdown code blocks for the schedule. Keep it energetic and short.`
    : `Generate a weekend morning Discord briefing for ${DAY_TH}. Full free day. Include morning deep focus (Japanese), afternoon skills (English + finance), evening review. Use emojis and Discord markdown.`

  const systemPrompt = `You are WhyMan, personal life secretary AI. Always write Discord messages with: sections, emojis, time blocks in code fences, motivational Japanese quotes with Thai translation. Mix Thai and Japanese naturally.`

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 900 },
  })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body }
  )

  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? buildFallbackMessage()
}

// ─────────────────────────────────────────────────────────────────────────────
// Post to Discord (handles 2000-char limit by splitting)
// ─────────────────────────────────────────────────────────────────────────────

async function postToDiscord(content, label = "") {
  if (!WEBHOOK_URL) {
    console.error("❌ DISCORD_WEBHOOK_URL not set in .env.local")
    if (label === "briefing") {
      console.log("\n--- Preview ---\n")
      console.log(content)
    }
    return false
  }

  // Split message if over 1950 chars (leave some buffer)
  const chunks = []
  while (content.length > 1950) {
    const splitAt = content.lastIndexOf("\n", 1950)
    chunks.push(content.slice(0, splitAt > 0 ? splitAt : 1950))
    content = content.slice(splitAt > 0 ? splitAt + 1 : 1950)
  }
  chunks.push(content)

  for (const chunk of chunks) {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "WhyMan — Life Secretary", content: chunk }),
    })
    if (!res.ok) {
      console.error(`❌ Discord error (${label}): ${res.status} ${await res.text()}`)
      return false
    }
    if (chunks.length > 1) await sleep(500)  // rate limit guard between chunks
  }

  console.log(`✅ Discord message sent (${MODE} / ${label})`)
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

;(async () => {
  console.log(`\n=== WhyMan Discord Notify — ${MODE} mode · ${DATE_STR} ===`)

  // 1. Build daily briefing
  let briefing
  if (GOOGLE_KEY) {
    console.log("🤖 Generating AI briefing via Gemini…")
    try {
      briefing = await buildAIMessage()
    } catch (e) {
      console.warn(`⚠️  AI failed (${e.message}), using fallback`)
      briefing = buildFallbackMessage()
    }
  } else {
    console.log("📝 Using rule-based briefing (no GOOGLE_AI_API_KEY)")
    briefing = buildFallbackMessage()
  }

  await postToDiscord(briefing, "briefing")

  // 2. Market update — only on morning mode
  if (MODE === "morning") {
    try {
      const stockMsg = await buildStockSection()
      await postToDiscord(stockMsg, "market-update")
    } catch (e) {
      console.warn(`⚠️  Stock data failed: ${e.message}`)
    }
  }

  console.log("=== Done ===\n")
})()
