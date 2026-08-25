import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PLAYLIST = "PLcyPc8deg1u7LlMwpgssomHbLgQg2bpe7";
const playlistUrl = `https://www.youtube.com/playlist?list=${PLAYLIST}`;
const dataFile = path.join(process.cwd(), "data", "menu.json");

type MenuData = { items: Array<Record<string, unknown>> };
type PlaylistEntry = { id?: string; title?: string };

function videoId(url: unknown) {
  if (typeof url !== "string") return null;
  try { return new URL(url).searchParams.get("v"); } catch { return null; }
}

async function translateToThai(title: string) {
  if (!title || title === "NA") return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(title)}&langpair=autodetect%7Cth`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
  const json = await response.json() as { responseData?: { translatedText?: string } };
  return json.responseData?.translatedText?.trim() || "";
}

function inferTags(title: string) {
  const text = title.toLowerCase();
  const tags = ["สูตรจากวิดีโอ", "อาหารญี่ปุ่น", "แปลไทย"];
  const pairs: Array<[RegExp, string]> = [
    [/chicken|鶏/, "ไก่"], [/pork|豚/, "หมู"], [/beef|牛/, "เนื้อ"],
    [/egg|卵/, "ไข่"], [/tofu|豆腐/, "เต้าหู้"], [/rice|ご飯/, "ข้าว"],
    [/pasta|パスタ/, "พาสต้า"], [/curry|カレー/, "แกงกะหรี่"],
    [/fried|揚げ/, "ทอด"], [/stir|炒め/, "ผัด"], [/soup|煮|スープ/, "ต้ม"],
  ];
  for (const [pattern, tag] of pairs) if (pattern.test(text)) tags.push(tag);
  return [...new Set(tags)];
}

async function main() {
const raw = execFileSync("yt-dlp", ["--flat-playlist", "--dump-single-json", "--no-update", playlistUrl], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
const playlist = JSON.parse(raw) as { entries?: PlaylistEntry[] };
const data = JSON.parse(fs.readFileSync(dataFile, "utf8")) as MenuData;
const existingItems = new Map(data.items.map((item) => [videoId(item.videoUrl), item]));
let added = 0;
let skipped = 0;
let updated = 0;

async function importEntry(index: number, entry: PlaylistEntry) {
  if (!entry.id) { skipped++; return; }
  const originalTitle = entry.title?.replace(/\s+/g, " ").trim() || "";
  let name = "";
  try { name = await translateToThai(originalTitle); } catch { name = originalTitle; }
  if (!name || name === "NA") name = `เมนูจากวิดีโอ ${entry.id}`;
  const existing = existingItems.get(entry.id);
  if (existing) {
    existing.name = name;
    existing.nationality = "japanese";
    existing.tags = inferTags(originalTitle);
    existing.desc = `วิดีโอสอนทำอาหารญี่ปุ่น · ชื่อเดิม: ${originalTitle || entry.id}`;
    updated++;
    console.log(`updated ${updated}: ${name}`);
    return;
  }
  data.items.push({
    id: `${Date.now()}${index}`,
    name,
    image: null,
    emoji: "🍽️",
    nationality: "japanese",
    tags: inferTags(originalTitle),
    price: 0,
    time: 0,
    calories: 0,
    servings: 1,
    difficulty: 1,
    desc: `วิดีโอสอนทำอาหารญี่ปุ่น · ชื่อเดิม: ${originalTitle || entry.id}`,
    ingredients: [],
    steps: [],
    videoUrl: `https://www.youtube.com/watch?v=${entry.id}&list=${PLAYLIST}`,
  });
  added++;
  console.log(`${added}: ${name}`);
}

const entries = playlist.entries || [];
let cursor = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < entries.length) {
    const index = cursor++;
    await importEntry(index, entries[index]);
  }
}));

fs.writeFileSync(dataFile, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Added ${added} Thai-translated menus; updated ${updated}; skipped ${skipped} existing videos.`);
}

void main();
