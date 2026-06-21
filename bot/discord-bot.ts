/**
 * MYWORLD Discord Bot
 * ────────────────────────
 * /diary morning/afternoon/evening <text>  — บันทึก Daily Diary
 * /diary view [date]                       — ดู diary entry
 *
 * /routine task list                       — ดู Mandala actions ที่ยังไม่เสร็จ
 * /routine task done <text>               — tick ✅ Mandala action
 * /routine milestone <year> <title>       — เพิ่ม Life Timeline milestone
 * /routine ask <message>                  — chat กับ WhyMan AI
 *
 * ต้องการ env:
 *   DISCORD_BOT_TOKEN   — bot token จาก Discord Developer Portal
 *   DISCORD_CLIENT_ID   — Application ID
 *   WHYMAN_APP_URL      — URL ของ Next.js app (default: http://localhost:3000)
 *   APP_PASSWORD        — password สำหรับ API (ถ้ามี)
 */

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const TOKEN     = process.env.DISCORD_BOT_TOKEN!
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!
const GUILD_ID  = process.env.DISCORD_GUILD_ID ?? ""   // ถ้าตั้งค่า → register เฉพาะ server นั้น (instant)
const APP_URL   = (process.env.WHYMAN_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")
const PASSWORD  = process.env.APP_PASSWORD ?? ""

if (!TOKEN || !CLIENT_ID) {
  console.error("❌  ต้องตั้ง DISCORD_BOT_TOKEN และ DISCORD_CLIENT_ID ใน .env.local")
  process.exit(1)
}

console.log("🔧 Config:")
console.log(`   CLIENT_ID   = ${CLIENT_ID}`)
console.log(`   GUILD_ID    = ${GUILD_ID || "(global — ช้า ~1h)"}`)
console.log(`   APP_URL     = ${APP_URL}`)
console.log(`   PASSWORD    = ${PASSWORD ? "✓ set" : "(not set)"}`)

// ─── Register Slash Commands ──────────────────────────────────────────────────

const CATEGORY_CHOICES = [
  { name: "Career", value: "career" },
  { name: "Wealth", value: "wealth" },
  { name: "Health", value: "health" },
  { name: "Personal", value: "personal" },
  { name: "Life", value: "life" },
]

const commands = [
  // ── /diary ──────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("diary")
    .setDescription("บันทึก Daily Diary")
    .addSubcommand(sub =>
      sub.setName("morning")
        .setDescription("☀️ Morning Breath — เจตนาและแผนของวัน")
        .addStringOption(opt =>
          opt.setName("text").setDescription("เขียนอะไรก็ได้...").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("date").setDescription("วัน (YYYY-MM-DD) default = วันนี้").setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName("afternoon")
        .setDescription("☁️ Midday Check-in — เช็คความรู้สึกกลางวัน")
        .addStringOption(opt =>
          opt.setName("text").setDescription("เขียนอะไรก็ได้...").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("date").setDescription("วัน (YYYY-MM-DD) default = วันนี้").setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName("evening")
        .setDescription("🌙 Evening Reflection — สะท้อนความรู้สึกก่อนนอน")
        .addStringOption(opt =>
          opt.setName("text").setDescription("เขียนอะไรก็ได้...").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("date").setDescription("วัน (YYYY-MM-DD) default = วันนี้").setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName("view")
        .setDescription("📖 ดู entry ของวันที่ระบุ")
        .addStringOption(opt =>
          opt.setName("date").setDescription("วัน (YYYY-MM-DD) default = วันนี้").setRequired(false)
        )
    ),

  // ── /routine ─────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("routine")
    .setDescription("จัดการ Routine & Future Planning")
    .addSubcommandGroup(group =>
      group
        .setName("task")
        .setDescription("Mandala Chart actions")
        .addSubcommand(sub =>
          sub.setName("list")
            .setDescription("📋 ดู actions ที่ยังไม่เสร็จใน Mandala Chart")
        )
        .addSubcommand(sub =>
          sub.setName("done")
            .setDescription("✅ Mark Mandala action ว่าทำเสร็จแล้ว")
            .addStringOption(opt =>
              opt.setName("text")
                .setDescription("ข้อความของ action (ค้นหา partial match)")
                .setRequired(true)
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName("milestone")
        .setDescription("🗺️ เพิ่ม Life Timeline milestone")
        .addIntegerOption(opt =>
          opt.setName("year").setDescription("ปี (เช่น 2027)").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("title").setDescription("ชื่อ milestone").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("description").setDescription("รายละเอียดเพิ่มเติม").setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName("category")
            .setDescription("หมวดหมู่ (default: life)")
            .setRequired(false)
            .addChoices(...CATEGORY_CHOICES)
        )
    )
    .addSubcommand(sub =>
      sub.setName("ask")
        .setDescription("🤖 ถาม WhyMan AI secretary")
        .addStringOption(opt =>
          opt.setName("message").setDescription("ถามอะไรก็ได้...").setRequired(true)
        )
    ),
].map(c => c.toJSON())

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN)

  if (GUILD_ID) {
    // Guild commands — ขึ้นทันที ใช้สำหรับ dev/test
    console.log(`⚙️  Registering slash commands to guild ${GUILD_ID} (instant)...`)
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
    console.log("✅  Guild slash commands registered (ขึ้นทันที)")
  } else {
    // Global commands — ช้าสุด ~1 ชั่วโมง
    console.log("⚙️  Registering global slash commands (อาจรอนาน ~1h)...")
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
    console.log("✅  Global slash commands registered")
    console.log("💡  Tip: ตั้ง DISCORD_GUILD_ID ใน .env.local เพื่อให้คำสั่งขึ้นทันที")
  }
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

function today() {
  return new Date().toLocaleDateString("en-CA")
}

async function getEntry(date: string) {
  const res = await fetch(`${APP_URL}/api/daily`, {
    headers: PASSWORD ? { "x-app-password": PASSWORD } : {},
  })
  if (!res.ok) throw new Error(`GET /api/daily failed: ${res.status}`)
  const { entries } = await res.json() as { entries: Entry[] }
  return entries.find(e => e.date === date) ?? null
}

async function saveEntry(date: string, morning: string, afternoon: string, evening: string) {
  const res = await fetch(`${APP_URL}/api/daily`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PASSWORD ? { "x-app-password": PASSWORD } : {}),
    },
    body: JSON.stringify({ date, morning, afternoon, evening }),
  })
  if (!res.ok) throw new Error(`POST /api/daily failed: ${res.status}`)
}

type Entry = { id: string; date: string; morning: string; afternoon: string; evening: string }

// ─── Routine API Helpers ──────────────────────────────────────────────────────

type MandalaSubgoal = { id: string; chart_id: string; position: number; title: string; color: string }
type MandalaAction  = { id: string; subgoal_id: string; position: number; text: string; completed: number }
type Milestone      = { id: string; year: number; title: string; description: string; category: string; color: string }

const CATEGORY_COLORS: Record<string, string> = {
  career: "#818cf8", wealth: "#34d399", health: "#fb923c",
  personal: "#f472b6", life: "#38bdf8",
}

async function getMandala(): Promise<{ subgoals: MandalaSubgoal[]; actions: MandalaAction[] }> {
  const res = await fetch(`${APP_URL}/api/mandala`, {
    headers: PASSWORD ? { "x-app-password": PASSWORD } : {},
  })
  if (!res.ok) throw new Error(`GET /api/mandala failed: ${res.status}`)
  return res.json()
}

async function toggleMandalaAction(id: string, completed: boolean): Promise<void> {
  const res = await fetch(`${APP_URL}/api/mandala/action/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(PASSWORD ? { "x-app-password": PASSWORD } : {}),
    },
    body: JSON.stringify({ completed }),
  })
  if (!res.ok) throw new Error(`PATCH /api/mandala/action failed: ${res.status}`)
}

async function addMilestone(data: {
  year: number; title: string; description?: string; category?: string
}): Promise<Milestone> {
  const category = data.category ?? "life"
  const res = await fetch(`${APP_URL}/api/timeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PASSWORD ? { "x-app-password": PASSWORD } : {}),
    },
    body: JSON.stringify({
      ...data,
      category,
      color: CATEGORY_COLORS[category] ?? "#818cf8",
    }),
  })
  if (!res.ok) throw new Error(`POST /api/timeline failed: ${res.status}`)
  return res.json()
}

async function askWhyMan(message: string): Promise<string> {
  const res = await fetch(`${APP_URL}/api/life-secretary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PASSWORD ? { "x-app-password": PASSWORD } : {}),
    },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`POST /api/life-secretary failed: ${res.status}`)
  const data = await res.json()
  return data.message ?? data.error ?? "ไม่มีคำตอบ"
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

const SECTION_META = {
  morning:   { emoji: "☀️", label: "Morning Breath",     color: 0xFDECA6 as number },
  afternoon: { emoji: "☁️", label: "Midday Check-in",    color: 0xC6EBC5 as number },
  evening:   { emoji: "🌙", label: "Evening Reflection", color: 0xC4DAFA as number },
} as const

type Section = keyof typeof SECTION_META

async function handleWrite(interaction: ChatInputCommandInteraction, section: Section) {
  const text = interaction.options.getString("text", true)
  const date = interaction.options.getString("date") ?? today()

  try {
    // Fetch current entry so we don't overwrite other sections
    const existing = await getEntry(date)
    const merged = {
      morning:   existing?.morning   ?? "",
      afternoon: existing?.afternoon ?? "",
      evening:   existing?.evening   ?? "",
      [section]: text,
    }

    await saveEntry(date, merged.morning, merged.afternoon, merged.evening)

    const meta = SECTION_META[section]
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} ${meta.label} — ${date}`)
      .setDescription(text)
      .setFooter({ text: "บันทึกแล้ว ✓" })
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    console.error(err)
    await interaction.editReply("❌ บันทึกไม่สำเร็จ — ตรวจสอบ WHYMAN_APP_URL และ APP_PASSWORD")
  }
}

async function handleView(interaction: ChatInputCommandInteraction) {
  const date = interaction.options.getString("date") ?? today()

  try {
    const entry = await getEntry(date)

    if (!entry) {
      await interaction.editReply(`📭 ยังไม่มี entry สำหรับ **${date}**`)
      return
    }

    const embed = new EmbedBuilder()
      .setColor(0xE8E1D5)
      .setTitle(`📖 Daily Diary — ${date}`)
      .addFields(
        { name: "☀️ Morning Breath",     value: entry.morning   || "_ยังไม่ได้เขียน_", inline: false },
        { name: "☁️ Midday Check-in",    value: entry.afternoon || "_ยังไม่ได้เขียน_", inline: false },
        { name: "🌙 Evening Reflection", value: entry.evening   || "_ยังไม่ได้เขียน_", inline: false },
      )
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    console.error(err)
    await interaction.editReply("❌ โหลดข้อมูลไม่สำเร็จ")
  }
}

// ─── Routine Handlers ────────────────────────────────────────────────────────

async function handleTaskList(interaction: ChatInputCommandInteraction) {
  try {
    const { subgoals, actions } = await getMandala()
    const incomplete = actions.filter(a => !a.completed && a.text.trim())

    if (incomplete.length === 0) {
      await interaction.editReply("🎉 ไม่มี action ที่ค้างอยู่! ทำเสร็จหมดแล้ว")
      return
    }

    const sgMap = Object.fromEntries(subgoals.map(sg => [sg.id, sg]))

    // Group by subgoal
    const grouped = new Map<string, { sg: MandalaSubgoal; acts: MandalaAction[] }>()
    for (const a of incomplete) {
      const sg = sgMap[a.subgoal_id]
      if (!sg) continue
      if (!grouped.has(sg.id)) grouped.set(sg.id, { sg, acts: [] })
      grouped.get(sg.id)!.acts.push(a)
    }

    const fields = [...grouped.values()]
      .filter(g => g.sg.title.trim())
      .slice(0, 8)
      .map(({ sg, acts }) => ({
        name: sg.title || `Sub-goal ${sg.position + 1}`,
        value: acts.slice(0, 8).map(a => `▫ ${a.text}`).join("\n") || "—",
        inline: false,
      }))

    const embed = new EmbedBuilder()
      .setColor(0x818CF8)
      .setTitle(`📋 Mandala — ${incomplete.length} actions ที่ยังไม่เสร็จ`)
      .addFields(fields.length ? fields : [{ name: "—", value: "ไม่มีข้อมูล", inline: false }])
      .setFooter({ text: "ใช้ /routine task done <text> เพื่อ tick ✅" })

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    console.error(err)
    await interaction.editReply("❌ โหลดข้อมูล Mandala ไม่สำเร็จ")
  }
}

async function handleTaskDone(interaction: ChatInputCommandInteraction) {
  const query = interaction.options.getString("text", true).toLowerCase()
  try {
    const { subgoals, actions } = await getMandala()
    const sgMap = Object.fromEntries(subgoals.map(sg => [sg.id, sg]))

    const matches = actions.filter(
      a => a.text.toLowerCase().includes(query) && !a.completed
    )

    if (matches.length === 0) {
      const alreadyDone = actions.filter(a => a.text.toLowerCase().includes(query) && a.completed)
      if (alreadyDone.length > 0) {
        await interaction.editReply(`✅ "${alreadyDone[0].text}" ทำเสร็จไปแล้ว`)
      } else {
        await interaction.editReply(`❌ ไม่พบ action ที่ตรงกับ **"${query}"**\nลอง \`/routine task list\` ดูชื่อที่ถูกต้อง`)
      }
      return
    }

    // Mark all matches as done (usually just 1)
    await Promise.all(matches.map(a => toggleMandalaAction(a.id, true)))

    const sg = matches[0] ? sgMap[matches[0].subgoal_id] : null
    const embed = new EmbedBuilder()
      .setColor(0x34D399)
      .setTitle(`✅ เสร็จแล้ว! (${matches.length} action)`)
      .addFields(
        matches.slice(0, 5).map(a => ({
          name: sg?.title || "Action",
          value: a.text,
          inline: false,
        }))
      )
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    console.error(err)
    await interaction.editReply("❌ อัปเดต action ไม่สำเร็จ")
  }
}

async function handleMilestone(interaction: ChatInputCommandInteraction) {
  const year        = interaction.options.getInteger("year", true)
  const title       = interaction.options.getString("title", true)
  const description = interaction.options.getString("description") ?? ""
  const category    = interaction.options.getString("category") ?? "life"
  try {
    const milestone = await addMilestone({ year, title, description, category })
    const color = parseInt((CATEGORY_COLORS[category] ?? "#818cf8").replace("#", ""), 16)

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🗺️ Milestone Added — ${year}`)
      .addFields(
        { name: "Title",    value: milestone.title,                        inline: true },
        { name: "Category", value: category,                               inline: true },
        { name: "Year",     value: String(year),                           inline: true },
        ...(description ? [{ name: "Description", value: description, inline: false }] : [])
      )
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    console.error(err)
    await interaction.editReply("❌ เพิ่ม milestone ไม่สำเร็จ")
  }
}

async function handleAsk(interaction: ChatInputCommandInteraction) {
  const message = interaction.options.getString("message", true)
  try {
    const reply = await askWhyMan(message)

    // Discord embed description max = 4096 chars
    const truncated = reply.length > 4000 ? reply.slice(0, 3997) + "…" : reply

    const embed = new EmbedBuilder()
      .setColor(0x1F1D1A)
      .setAuthor({ name: "WhyMan — Life Secretary", iconURL: "https://cdn.discordapp.com/embed/avatars/0.png" })
      .setDescription(truncated)
      .setFooter({ text: `ถาม: ${message.slice(0, 80)}` })
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    console.error(err)
    await interaction.editReply("❌ WhyMan ตอบไม่ได้ — ตรวจสอบ GOOGLE_AI_API_KEY")
  }
}

// ─── Bot Client ───────────────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once("ready", () => {
  console.log(`🤖 Bot online: ${client.user?.tag}`)
  console.log(`📡 Listening for interactions...`)
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const cmd   = interaction.commandName
  const group = interaction.options.getSubcommandGroup(false)
  const sub   = interaction.options.getSubcommand(false) ?? ""
  console.log(`📨 /${cmd}${group ? " " + group : ""}${sub ? " " + sub : ""} from ${interaction.user.tag}`)

  // Acknowledge immediately — ต้องเสร็จก่อน 3 วินาที
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  } catch (err) {
    console.error("💥 deferReply failed (interaction expired?):", err)
    return
  }

  try {
    if (cmd === "diary") {
      if (sub === "view") {
        await handleView(interaction)
      } else if (sub === "morning" || sub === "afternoon" || sub === "evening") {
        await handleWrite(interaction, sub)
      }
      return
    }

    if (cmd === "routine") {
      if (group === "task") {
        if (sub === "list") await handleTaskList(interaction)
        if (sub === "done") await handleTaskDone(interaction)
      } else {
        if (sub === "milestone") await handleMilestone(interaction)
        if (sub === "ask")       await handleAsk(interaction)
      }
    }
  } catch (err) {
    console.error(`💥 Unhandled error in /${cmd}:`, err)
    try {
      await interaction.editReply("❌ เกิดข้อผิดพลาดที่ไม่คาดคิด ตรวจสอบ bot log")
    } catch { /* ignore */ }
  }
})

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  await registerCommands()
  await client.login(TOKEN)
}

main().catch(err => {
  console.error("Fatal:", err)
  process.exit(1)
})
