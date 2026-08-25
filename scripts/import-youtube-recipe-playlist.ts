import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PLAYLIST = "PLDJdpEf1tqQ9y8aj1VVqDIcsj46_T-uf0";
const playlistUrl = `https://www.youtube.com/playlist?list=${PLAYLIST}`;
const dataFile = path.join(process.cwd(), "data", "menu.json");

type MenuData = { items: Array<Record<string, unknown>> };
type PlaylistEntry = { id?: string; title?: string };

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
const existingIds = new Set(data.items.map((item) => videoId(item.videoUrl)).filter(Boolean));
let added = 0;
let skipped = 0;

for (const [index, entry] of (playlist.entries || []).entries()) {
  if (!entry.id || existingIds.has(entry.id)) { skipped++; continue; }
  const title = entry.title?.replace(/\s+/g, " ").trim() || `เมนูจากวิดีโอ ${entry.id}`;
  data.items.push({
    id: `${Date.now()}${index}`,
    name: title,
    image: null,
    emoji: "🍽️",
    nationality: "thai",
    tags: ["สูตรจากวิดีโอ", "อาหารไทย"],
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
console.log(`Added ${added} menus; skipped ${skipped} existing videos.`);
