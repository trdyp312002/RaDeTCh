/**
 * discord-bot.js — WhyMan Discord Bot (Slash Commands)
 *
 * Usage:  node scripts/discord-bot.js
 *
 * Slash commands:
 *   /jp         → ภาษาญี่ปุ่นวันนี้
 *   /en         → ภาษาอังกฤษวันนี้
 *   /plan       → วางแผนสัปดาห์
 *   /money      → คำแนะนำการเงิน
 *   /schedule   → ตารางเวลาว่าง
 *   /motivate   → กำลังใจ
 *   /notify     → ส่ง daily briefing
 *   /ask        → ถามอะไรก็ได้
 */

const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js")
const fs   = require("fs")
const path = require("path")

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, "$1")
    if (key && val) process.env[key] = val
  }
}

const BOT_TOKEN   = process.env.DISCORD_BOT_TOKEN
const GOOGLE_KEY  = process.env.GOOGLE_AI_API_KEY
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

if (!BOT_TOKEN) { console.error("❌ DISCORD_BOT_TOKEN ไม่ได้ตั้งค่า"); process.exit(1) }
if (!GOOGLE_KEY) { console.error("❌ GOOGLE_AI_API_KEY ไม่ได้ตั้งค่า"); process.exit(1) }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_KEY}`

const SYSTEM = `You are WhyMan, a personal life management AI secretary for a Thai person with this fixed schedule:
- Work: Mon–Fri 8AM–7PM (cannot change)
- Wake: 6:00AM | Exercise: 6:00–6:30 | Prepare: 6:30–7:00
- FREE TIME (Weekday): 8PM–9:30PM (1.5 hours only)
- Bedtime prep: 9:30PM | Sleep: 10PM (8 hours)
- Weekends: mostly free (best for deep study)

PRIORITY GOALS: 1) Japanese N2/N3  2) English fluency  3) Saving money & investing

Style: Mix Thai + Japanese naturally. Give specific time blocks. Use emojis. Be encouraging and practical. Keep responses under 1800 characters when possible.`

// ── Gemini API ────────────────────────────────────────────────────────────────
async function askGemini(message) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: message }] }],
      systemInstruction: { parts: [{ text: SYSTEM }] },
      generationConfig: { maxOutputTokens: 900 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 150)}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "ไม่มีคำตอบ"
}

// ── Split long message ────────────────────────────────────────────────────────
function splitMessage(text, max = 1990) {
  if (text.length <= max) return [text]
  const parts = []
  while (text.length > 0) { parts.push(text.slice(0, max)); text = text.slice(max) }
  return parts
}

// ── Slash command definitions ─────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName("jp")
    .setDescription("🇯🇵 ภาษาญี่ปุ่นวันนี้ควรเรียนอะไร?"),

  new SlashCommandBuilder()
    .setName("en")
    .setDescription("🇬🇧 ภาษาอังกฤษวันนี้ควรฝึกอะไร?"),

  new SlashCommandBuilder()
    .setName("plan")
    .setDescription("📅 วางแผนสัปดาห์นี้"),

  new SlashCommandBuilder()
    .setName("money")
    .setDescription("💰 คำแนะนำการประหยัดเงินและลงทุน"),

  new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("⏰ ดูตารางเวลาว่างวันนี้"),

  new SlashCommandBuilder()
    .setName("motivate")
    .setDescription("💪 ขอกำลังใจ + คำคมภาษาญี่ปุ่น"),

  new SlashCommandBuilder()
    .setName("notify")
    .setDescription("📣 ส่ง daily briefing ไปยัง Discord channel"),

  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("💬 ถาม WhyMan อะไรก็ได้")
    .addStringOption((o) =>
      o.setName("คำถาม").setDescription("พิมพ์คำถามของคุณ").setRequired(true)
    ),
].map((c) => c.toJSON())

// ── Prompts per command ───────────────────────────────────────────────────────
const PROMPTS = {
  jp:       "ภาษาญี่ปุ่นวันนี้ควรเรียนอะไร? แนะนำ session ที่ทำได้ในเวลาว่างที่มี พร้อมระยะเวลาชัดเจน",
  en:       "ภาษาอังกฤษวันนี้ควรฝึกอะไร? แนะนำ 2-3 กิจกรรมพร้อมระยะเวลา",
  plan:     "ช่วยวางแผนสัปดาห์นี้ให้หน่อย บอกว่าแต่ละวันควรทำอะไรบ้างในเวลาว่าง",
  money:    "แนะนำเรื่องการประหยัดเงินและลงทุนสำหรับสัปดาห์นี้ พร้อม action ที่ทำได้ทันที",
  schedule: "สรุปตารางเวลาว่างวันนี้ บอกว่ามีเวลาเรียนกี่ชั่วโมงและควรทำอะไรตามลำดับ",
  motivate: "ให้กำลังใจหน่อย พร้อมคำคมภาษาญี่ปุ่นที่เกี่ยวกับการพัฒนาตัวเองพร้อมแปลไทย",
}

// ── Register slash commands with Discord ─────────────────────────────────────
async function registerCommands(clientId) {
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN)
  try {
    console.log("📝 กำลัง register slash commands…")
    await rest.put(Routes.applicationCommands(clientId), { body: commands })
    console.log("✅ Slash commands registered แล้ว!")
  } catch (err) {
    console.error("⚠️  Register commands ไม่ได้:", err.message)
  }
}

// ── Discord Client ────────────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once(Events.ClientReady, async (c) => {
  console.log(`\n✅ WhyMan Bot พร้อมแล้ว! → ${c.user.tag}`)
  await registerCommands(c.user.id)
  c.user.setActivity("/ask หรือ /jp /plan /money", { type: 3 })
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const { commandName } = interaction
  console.log(`[${new Date().toLocaleTimeString("th-TH")}] /${commandName} — ${interaction.user.username}`)

  try {
    await interaction.deferReply()
  } catch {
    // Interaction expired before we could acknowledge (>3s) — silently skip
    console.warn(`⚠️  Interaction expired for /${commandName}, skipping`)
    return
  }

  try {
    // /notify
    if (commandName === "notify") {
      const now      = new Date()
      const dayTH    = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"][now.getDay()]
      const isWeekend = now.getDay() === 0 || now.getDay() === 6
      const timeStr  = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
      const prompt   = isWeekend
        ? `Generate Discord daily briefing for ${dayTH} (weekend), time ${timeStr}. Full-day schedule with JP, EN, savings tasks. Discord markdown.`
        : `Generate Discord daily briefing for ${dayTH} (weekday), time ${timeStr}. Work 8-7PM, free 8-9:30PM only. Optimize 1.5h evening. Discord markdown.`

      const msg = await askGemini(prompt)

      if (WEBHOOK_URL) {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "WhyMan — Life Secretary", content: msg }),
        })
        if (res.ok) {
          await interaction.editReply("✅ ส่ง daily briefing ไปยัง channel แล้ว!")
        } else {
          const parts = splitMessage(msg)
          await interaction.editReply(parts[0])
          for (let i = 1; i < parts.length; i++) await interaction.followUp(parts[i])
        }
      } else {
        const parts = splitMessage(msg)
        await interaction.editReply(parts[0])
        for (let i = 1; i < parts.length; i++) await interaction.followUp(parts[i])
      }
      return
    }

    // /ask
    const question = commandName === "ask"
      ? interaction.options.getString("คำถาม")
      : PROMPTS[commandName]

    if (!question) {
      await interaction.editReply("❌ ไม่รู้จักคำสั่งนี้")
      return
    }

    const answer = await askGemini(question)
    const parts  = splitMessage(answer)
    await interaction.editReply(parts[0])
    for (let i = 1; i < parts.length; i++) await interaction.followUp(parts[i])

  } catch (err) {
    console.error("Error:", err.message)
    await interaction.editReply(`❌ ${err.message}`)
  }
})

console.log("🚀 กำลังเชื่อมต่อ WhyMan Bot…")
client.login(BOT_TOKEN)
