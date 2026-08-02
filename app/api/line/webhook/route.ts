import { createHmac, timingSafeEqual } from "node:crypto"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getLineWebsiteContext } from "@/lib/lineWebsiteContext"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type LineEvent = { type?: string; replyToken?: string; deliveryContext?: { isRedelivery?: boolean }; source?: { userId?: string }; message?: { type?: string; text?: string } }
type Webhook = { events?: LineEvent[] }

function validSignature(body: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body).digest()
  const received = Buffer.from(signature, "base64")
  return received.length === expected.length && timingSafeEqual(received, expected)
}

function allowedIds() { return new Set((process.env.LINE_ALLOWED_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean)) }

async function answer(question: string) {
  const key = process.env.GOOGLE_AI_API_KEY
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not configured")
  const context = await getLineWebsiteContext()
  const model = new GoogleGenerativeAI(key).getGenerativeModel({
    model: process.env.LINE_GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction: `คุณคือ WhyMan เลขาส่วนตัวของบาส ตอบภาษาไทยแบบกระชับ ใช้ข้อมูลเว็บไซต์ที่แนบมาเป็นแหล่งจริงเพียงชุดเดียว ห้ามเดาตัวเลข วันที่ หรือสถานะ ถ้าข้อมูลไม่พอให้บอกตรงๆ อ้างอิงเวลา Asia/Tokyo ห้ามแสดง secret, token, credential, internal ID หรือโครงสร้างระบบ และตอบไม่เกิน 12 บรรทัด`,
  })
  const result = await model.generateContent(`ข้อมูลล่าสุดจากเว็บไซต์:\n${context}\n\nคำถามจาก LINE:\n${question}`)
  return result.response.text().trim().slice(0, 4900)
}

async function reply(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured")
  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  })
  if (!response.ok) throw new Error(`LINE reply failed (${response.status})`)
}

async function handle(event: LineEvent) {
  if (event.type !== "message" || event.message?.type !== "text" || !event.message.text?.trim() || !event.replyToken || event.deliveryContext?.isRedelivery) return
  const ids = allowedIds()
  if (!event.source?.userId || !ids.has(event.source.userId)) { console.warn("[LINE] ignored user outside allowlist"); return }
  await reply(event.replyToken, await answer(event.message.text))
}

export async function GET() { return Response.json({ ok: true, service: "line-webhook" }) }

export async function POST(request: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET
  const signature = request.headers.get("x-line-signature") ?? ""
  const raw = await request.text()
  if (!secret) return Response.json({ ok: false, error: "LINE is not configured" }, { status: 503 })
  try { if (!validSignature(raw, signature, secret)) throw new Error() } catch { return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 }) }
  let body: Webhook
  try { body = JSON.parse(raw) as Webhook } catch { return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 }) }
  if (!body.events?.length) return Response.json({ ok: true })
  const results = await Promise.allSettled(body.events.map(handle))
  for (const result of results) if (result.status === "rejected") console.error("[LINE] event failed:", result.reason)
  return Response.json({ ok: true })
}
