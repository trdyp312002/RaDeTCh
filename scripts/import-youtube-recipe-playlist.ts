import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PLAYLIST = "PLDJdpEf1tqQ9y8aj1VVqDIcsj46_T-uf0";
const playlistUrl = `https://www.youtube.com/playlist?list=${PLAYLIST}`;
const dataFile = path.join(process.cwd(), "data", "menu.json");

type MenuData = { items: Array<Record<string, unknown>> };
type PlaylistEntry = { id?: string; title?: string };

function inferTags(title: string) {
  const text = title.toLowerCase();
  const tags = ["สูตรจากวิดีโอ", "อาหารไทย"];
  const keywordTags: Array<[RegExp, string]> = [
    [/fish|catfish|barramundi|tilapia/, "ปลา"], [/chicken/, "ไก่"], [/pork|belly|ribs|liver|leg|intestine|sausage/, "หมู"], [/beef/, "เนื้อ"], [/shrimp|prawn/, "กุ้ง"], [/squid/, "ปลาหมึก"], [/seafood/, "อาหารทะเล"], [/crab/, "ปู"], [/egg|omelet/, "ไข่"], [/curry/, "แกง"], [/stir.?fried|pad |basil/, "ผัด"], [/fried/, "ทอด"], [/soup|boiled|stewed/, "ต้ม"], [/salad|som tum/, "ยำ"], [/grilled/, "ย่าง"], [/rice/, "ข้าว"], [/noodle|vermicelli/, "เส้น"], [/basil/, "กะเพรา"], [/vegetable|morning glory|mushroom/, "ผัก"],
  ];
  for (const [pattern, tag] of keywordTags) if (pattern.test(text)) tags.push(tag);
  return [...new Set(tags)];
}

function videoId(url: unknown) {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("v") || (parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : null);
  } catch { return null; }
}

const raw = execFileSync("yt-dlp", ["--flat-playlist", "--dump-single-json", "--no-update", playlistUrl], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
const playlist = JSON.parse(raw) as { entries?: PlaylistEntry[] };
const data = JSON.parse(fs.readFileSync(dataFile, "utf8")) as MenuData;
const existingItems = new Map(data.items.map((item) => [videoId(item.videoUrl), item]));
let added = 0;
let skipped = 0;
let tagged = 0;

for (const [index, entry] of (playlist.entries || []).entries()) {
  if (!entry.id) { skipped++; continue; }
  const title = entry.title?.replace(/\s+/g, " ").trim() || `เมนูจากวิดีโอ ${entry.id}`;
  const tags = inferTags(title);
  const existing = existingItems.get(entry.id);
  if (existing) {
    existing.tags = [...new Set([...(Array.isArray(existing.tags) ? existing.tags : []), ...tags])];
    tagged++; skipped++; continue;
  }
  data.items.push({
    id: `${Date.now()}${index}`,
    name: title,
    image: null,
    emoji: "🍽️",
    nationality: "thai",
    tags,
    price: 0,
    time: 0,
    calories: 0,
    servings: 1,
    difficulty: 1,
    desc: "วิดีโอสอนทำอาหารจาก YouTube Playlist",
    ingredients: [],
    steps: [],
    videoUrl: `https://www.youtube.com/watch?v=${entry.id}&list=${PLAYLIST}`,
  });
  added++;
}

fs.writeFileSync(dataFile, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Added ${added} menus; tagged ${tagged}; skipped ${skipped} existing videos.`);
