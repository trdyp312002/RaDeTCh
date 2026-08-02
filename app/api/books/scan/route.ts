import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 8 * 1024 * 1024;
const CATEGORIES = ["การเงิน", "พัฒนาตนเอง", "เทคโนโลยี", "การเรียน", "ประวัติศาสตร์", "ธุรกิจ", "นิยาย", "ทั่วไป"] as const;

type BookAnalysis = {
  title: string;
  author: string;
  description: string;
  category: string;
  language: string;
};

type ImageOutput = {
  output_image?: { data?: string; mime_type?: string };
  outputImage?: { data?: string; mimeType?: string };
  error?: { message?: string };
};

function findGeneratedImage(value: unknown): { data: string; mimeType?: string } | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const data = typeof item.data === "string" ? item.data : null;
  const type = typeof item.type === "string" ? item.type : "";
  const mimeType = typeof item.mime_type === "string" ? item.mime_type : typeof item.mimeType === "string" ? item.mimeType : undefined;
  if (data && (type === "image" || mimeType?.startsWith("image/"))) return { data, mimeType };
  for (const [key, child] of Object.entries(item)) {
    if (["input", "request"].includes(key)) continue;
    if (Array.isArray(child)) {
      for (const nested of child) {
        const found = findGeneratedImage(nested);
        if (found) return found;
      }
    } else {
      const found = findGeneratedImage(child);
      if (found) return found;
    }
  }
  return null;
}

function clean(value: unknown, fallback: string, max = 500) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, max);
}

async function analyzeBook(apiKey: string, mimeType: string, imageData: string): Promise<BookAnalysis> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent([
    { text: `Analyze the single physical book in this photo. Read the cover and spine carefully. Return JSON only with keys title, author, description, category, language. Write title and author exactly as printed when legible. Write a concise Thai description. category must be exactly one of: ${CATEGORIES.join(", ")}. language should be a short Thai label such as ไทย, อังกฤษ, ญี่ปุ่น, or จีน. If a field cannot be read, use "ไม่ระบุ". Do not invent an ISBN or facts that are not visible.` },
    { inlineData: { mimeType, data: imageData } },
  ]);
  const parsed = JSON.parse(result.response.text()) as Partial<BookAnalysis>;
  const category = CATEGORIES.includes(parsed.category as typeof CATEGORIES[number]) ? String(parsed.category) : "ทั่วไป";
  return {
    title: clean(parsed.title, "หนังสือไม่ทราบชื่อ", 240),
    author: clean(parsed.author, "ไม่ระบุ", 180),
    description: clean(parsed.description, "สแกนจากภาพหนังสือ", 800),
    category,
    language: clean(parsed.language, "ไม่ระบุ", 40),
  };
}

async function generateBookRender(apiKey: string, mimeType: string, imageData: string, analysis: BookAnalysis, stylePrompt: string) {
  const prompt = [
    "Create a polished photorealistic 3D product render of the exact physical book shown in the reference image.",
    `Presentation: ${stylePrompt}.`,
    `The identified book is titled ${analysis.title} by ${analysis.author}.`,
    "Preserve the original cover artwork, dominant colors, typography placement, spine design, proportions, thickness, wear and material as faithfully as possible.",
    "Show a believable hardcover or paperback object with realistic page edges, binding, depth, soft contact shadows and subtle studio lighting.",
    "Use a warm neutral cream studio background matching a premium personal library catalog.",
    "Do not add unrelated books, people, hands, stickers, watermarks, decorative text or invented logos.",
    "Clean square composition, centered object, high-end 3D ecommerce visualization.",
  ].join(" ");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey, "Api-Revision": "2026-05-20" },
      body: JSON.stringify({
        model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
        input: [{ type: "text", text: prompt }, { type: "image", mime_type: mimeType, data: imageData }],
        response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "1:1", image_size: "1K" },
      }),
      signal: controller.signal,
    });
    const data = await response.json() as ImageOutput;
    if (!response.ok) {
      console.error("Book 3D generation:", data.error?.message);
      throw new Error("บริการสร้างภาพ 3D ยังไม่พร้อม กรุณาลองใหม่");
    }
    const direct = data.output_image?.data
      ? { data: data.output_image.data, mimeType: data.output_image.mime_type }
      : data.outputImage?.data
        ? { data: data.outputImage.data, mimeType: data.outputImage.mimeType }
        : findGeneratedImage(data);
    if (!direct?.data) throw new Error("AI อ่านหนังสือสำเร็จ แต่ไม่ได้ส่งภาพ 3D กลับมา");
    return `data:${direct.mimeType || "image/jpeg"};base64,${direct.data}`;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureBooksTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'ทั่วไป',
    status TEXT DEFAULT 'wishlist' CHECK(status IN ('wishlist', 'bought', 'reading', 'completed')),
    cover_image TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า Google AI API key" }, { status: 503 });
    const body = await request.json();
    const match = String(body.image || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return NextResponse.json({ error: "รูปภาพไม่ถูกต้อง กรุณาอัปโหลดใหม่" }, { status: 400 });
    const [, mimeType, imageData] = match;
    if (Buffer.byteLength(imageData, "base64") > MAX_BYTES) return NextResponse.json({ error: "รูปภาพมีขนาดเกิน 8 MB" }, { status: 413 });

    const analysis = await analyzeBook(apiKey, mimeType, imageData);
    const coverImage = await generateBookRender(
      apiKey,
      mimeType,
      imageData,
      analysis,
      clean(body.stylePrompt, "upright three-quarter product view showing the front cover and spine", 300),
    );

    await ensureBooksTable();
    const id = randomUUID();
    const description = `${analysis.description}\n\nภาษา: ${analysis.language} · สแกนและสร้างโมเดล 3D อัตโนมัติ`;
    await db.execute({
      sql: "INSERT INTO books (id, title, author, description, category, status, cover_image) VALUES (?, ?, ?, ?, ?, 'bought', ?)",
      args: [id, analysis.title, analysis.author, description, analysis.category, coverImage],
    });
    const result = await db.execute({ sql: "SELECT * FROM books WHERE id = ?", args: [id] });
    return NextResponse.json({ book: result.rows[0], analysis, image: coverImage }, { status: 201 });
  } catch (error) {
    console.error("Book scan route:", error);
    if (error instanceof Error && error.name === "AbortError") return NextResponse.json({ error: "การสร้างภาพใช้เวลาเกิน 3 นาที กรุณาลองใหม่" }, { status: 504 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "สแกนหนังสือไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
