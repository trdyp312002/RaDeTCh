import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;
const MAX_BYTES = 8 * 1024 * 1024;

type Output = { output_image?: { data?: string; mime_type?: string }; outputs?: Array<{ type?: string; data?: string; mime_type?: string; image?: { data?: string; mime_type?: string } }>; error?: { message?: string } };

function findGeneratedImage(value: unknown): { data: string; mime_type?: string } | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const data = typeof item.data === "string" ? item.data : null;
  const type = typeof item.type === "string" ? item.type : "";
  const mime = typeof item.mime_type === "string" ? item.mime_type : typeof item.mimeType === "string" ? item.mimeType : undefined;
  if (data && (type === "image" || mime?.startsWith("image/"))) return { data, mime_type: mime };
  for (const [key, child] of Object.entries(item)) {
    if (["input", "request"].includes(key)) continue;
    if (Array.isArray(child)) {
      for (const nested of child) { const found = findGeneratedImage(nested); if (found) return found; }
    } else {
      const found = findGeneratedImage(child);
      if (found) return found;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า Google AI API key สำหรับสร้างภาพ" }, { status: 503 });
    const body = await request.json();
    const match = String(body.image || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return NextResponse.json({ error: "รูปภาพไม่ถูกต้อง กรุณาอัปโหลดใหม่" }, { status: 400 });
    const [, mimeType, imageData] = match;
    if (Buffer.byteLength(imageData, "base64") > MAX_BYTES) return NextResponse.json({ error: "รูปภาพมีขนาดเกิน 8 MB" }, { status: 413 });

    const note = String(body.note || "").slice(0, 300);
    const prompt = [
      "Create a polished, realistic 3D fashion render using the exact clothing item in the uploaded reference photo.",
      `Pose and presentation: ${String(body.stylePrompt || "front-facing full-body catalog pose")}.`,
      "Put the garment naturally on a smooth, faceless, anatomically neutral 3D mannequin. The mannequin is an abstract display form, not a real identifiable person.",
      "CRITICAL CONTRAST RULE: analyze the garment brightness. For dark or saturated clothing use a matte porcelain-white mannequin. For white, cream, or very pale clothing use a matte black or charcoal mannequin. Ensure clear separation at every garment edge.",
      "Preserve the garment exactly: original color, pattern, graphics, logo placement, fabric texture, seams, silhouette, sleeve and collar shape. Do not redesign it and do not invent additional clothing.",
      "Use a seamless light warm-gray studio background, realistic 3D materials, soft contact shadows, premium fashion visualization, clean square composition. No face, hair, text, watermark, props, or extra garments.",
      note ? `Additional user direction: ${note}` : "",
    ].filter(Boolean).join(" ");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
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
    clearTimeout(timeout);
    const data = await response.json() as Output;
    if (!response.ok) { console.error("Closet generation:", data.error?.message); return NextResponse.json({ error: "บริการสร้างภาพยังไม่พร้อม กรุณาลองใหม่อีกครั้ง" }, { status: 502 }); }
    const raw = data as Output & { outputImage?: { data?: string; mimeType?: string } };
    const direct = data.output_image || raw.outputImage;
    const directRecord = direct as { data?: string; mime_type?: string; mimeType?: string } | undefined;
    const output = directRecord?.data ? { data: directRecord.data, mime_type: directRecord.mime_type || directRecord.mimeType } : findGeneratedImage(data);
    if (!output?.data) {
      console.error("Closet response without image. Keys:", Object.keys(data), "stepTypes:", (data as { steps?: Array<{ type?: string }> }).steps?.map(step => step.type));
      return NextResponse.json({ error: "AI ประมวลผลเสร็จแต่ไม่ได้ส่งภาพกลับมา กรุณาลองรูปหรือท่าอื่น" }, { status: 502 });
    }
    return NextResponse.json({ image: `data:${output.mime_type || "image/jpeg"};base64,${output.data}` });
  } catch (error) {
    console.error("Closet route:", error);
    if (error instanceof Error && error.name === "AbortError") return NextResponse.json({ error: "การสร้างภาพใช้เวลาเกิน 3 นาที กรุณาลองใหม่" }, { status: 504 });
    return NextResponse.json({ error: "สร้างภาพไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
