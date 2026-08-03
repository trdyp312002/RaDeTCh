/**
 * daily-sync.js — runs standalone (no Next.js server needed)
 * Syncs today's Garmin data via Railway API or local file fallback.
 *
 * Usage:  node scripts/daily-sync.js
 */

const { GarminConnect } = require("garmin-connect")
const fs   = require("fs")
const path = require("path")

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1")
  }
}

const DATA_FILE = path.join(__dirname, "../data/health.json")
const TODAY     = new Date().toLocaleDateString("en-CA") // YYYY-MM-DD

// ── Helpers ──────────────────────────────────────────────────────────────────
function readHealth() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }
  catch { return { logs: [] } }
}

function writeHealth(data) {
  data.logs.sort((a, b) =>
    String(a.date).substring(0, 10).localeCompare(String(b.date).substring(0, 10))
  )
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8")
}

function upsert(data, datePrefix, updates, notes) {
  const idx = data.logs.findIndex((l) => String(l.date).substring(0, 10) === datePrefix)
  if (idx !== -1) {
    Object.assign(data.logs[idx], updates)
    if (notes) data.logs[idx].notes = (data.logs[idx].notes ? data.logs[idx].notes + " | " : "") + notes
  } else {
    data.logs.push({
      id: `sync_${datePrefix}_${Date.now()}`,
      date: datePrefix,
      sleep_hours: null, sleep_score: null,
      steps: null, resting_heart_rate: null,
      notes: notes || "",
      ...updates,
    })
  }
}

// ── POST health data to Railway API (or write local file) ────────────────────
async function postHealth(dateStr, fields, notes) {
  const appUrl = process.env.RADETCH_APP_URL || "https://radetch-production.up.railway.app"
  if (!appUrl) {
    const data = readHealth()
    upsert(data, dateStr, fields, notes)
    writeHealth(data)
    return
  }
  const res = await fetch(`${appUrl}/api/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: dateStr, ...fields, notes }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`POST /api/health failed (${res.status}): ${txt}`)
  }
}

// ── Garmin sync ───────────────────────────────────────────────────────────────
async function syncGarmin() {
  const email    = process.env.GARMIN_EMAIL
  const password = process.env.GARMIN_PASSWORD
  if (!email || !password) { console.log("[Garmin] Missing credentials"); return }

  try {
    console.log("[Garmin] Logging in…")
    const client = new GarminConnect({ username: email, password: password })
    await client.login()

    const today = new Date()
    const [sleepData, stepsData, hrData] = await Promise.all([
      client.getSleepData(today).catch(() => null),
      client.getSteps(today).catch(() => null),
      client.getHeartRate(today).catch(() => null),
    ])

    const sleepSeconds = sleepData?.dailySleepDTO?.sleepTimeSeconds || 0
    const sleep_hours  = sleepSeconds ? parseFloat((sleepSeconds / 3600).toFixed(2)) : null
    const sleep_score  = sleepData?.dailySleepDTO?.sleepScores?.overall?.value ?? null
    const steps        = Array.isArray(stepsData) && stepsData.length
      ? stepsData.reduce((acc, s) => acc + (s.steps || 0), 0) : null
    const resting_heart_rate = hrData?.restingHeartRate ?? null

    await postHealth(TODAY, { sleep_hours, sleep_score, steps, resting_heart_rate }, "Garmin Auto-Sync")
    console.log(`[Garmin] OK — sleep: ${sleep_hours}h, steps: ${steps}, RHR: ${resting_heart_rate}`)
  } catch (e) {
    console.error("[Garmin] Error:", e.message)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
;(async () => {
  console.log(`\n=== RaDeTCh Daily Sync — ${TODAY} ===`)
  await syncGarmin()
  console.log("=== Done ===\n")
})()
