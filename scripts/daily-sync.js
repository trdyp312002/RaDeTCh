/**
 * daily-sync.js — runs standalone (no Next.js server needed)
 * Syncs today's Garmin + VeSync data directly into data/health.json
 *
 * Usage:  node scripts/daily-sync.js
 * Sched:  registered as Windows Task Scheduler task "RaDeTCh Daily Sync"
 */

const { GarminConnect } = require("garmin-connect")
const { spawnSync }     = require("child_process")
const fs                = require("fs")
const path              = require("path")

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1")
  }
}

const DATA_FILE = path.join(__dirname, "../data/health.json")
const PYTHON    = "C:\\Users\\trdyp\\AppData\\Local\\Programs\\Python\\Python312\\python.exe"
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
      weight: null, sleep_hours: null, sleep_score: null,
      steps: null, resting_heart_rate: null,
      calories_in: null, calories_out: null,
      notes: notes || "",
      ...updates,
    })
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

    const data = readHealth()
    upsert(data, TODAY, { sleep_hours, sleep_score, steps, resting_heart_rate }, "Garmin Auto-Sync")
    writeHealth(data)
    console.log(`[Garmin] OK — sleep: ${sleep_hours}h, steps: ${steps}, RHR: ${resting_heart_rate}`)
  } catch (e) {
    console.error("[Garmin] Error:", e.message)
  }
}

// ── VeSync sync ───────────────────────────────────────────────────────────────
function syncVeSync() {
  const email    = process.env.VESYNC_EMAIL
  const password = process.env.VESYNC_PASSWORD
  if (!email || !password) { console.log("[VeSync] Missing credentials"); return }

  try {
    console.log("[VeSync] Running Python script…")
    const scriptPath = path.join(__dirname, "vesync_weight.py")
    const proc = spawnSync(PYTHON, [scriptPath], {
      env: { ...process.env },
      timeout: 30_000,
      encoding: "utf8",
    })

    const raw = (proc.stdout || "").trim()
    if (!raw) {
      console.log("[VeSync] No output:", (proc.stderr || "").trim())
      return
    }

    const result = JSON.parse(raw)
    if (result.error) { console.log("[VeSync] Error:", result.error); return }

    const data = readHealth()
    upsert(data, TODAY, { weight: result.weight }, "VeSync Auto-Sync")
    writeHealth(data)
    console.log(`[VeSync] OK — weight: ${result.weight} kg`)
  } catch (e) {
    console.error("[VeSync] Error:", e.message)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
;(async () => {
  console.log(`\n=== RaDeTCh Daily Sync — ${TODAY} ===`)
  await syncGarmin()
  syncVeSync()
  console.log("=== Done ===\n")
})()
