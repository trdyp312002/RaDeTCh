import db from "@/lib/db"

type Section = { source: string; rows: Record<string, unknown>[] }
const QUERIES = [
  ["daily_logs", "SELECT date, morning, afternoon, evening, updated_at FROM diary_entries ORDER BY date DESC LIMIT 14"],
  ["health", "SELECT date, weight, bmi, body_fat, sleep_hours, sleep_score, steps, resting_heart_rate, notes, updated_at FROM health_logs ORDER BY date DESC LIMIT 14"],
  ["goals", "SELECT id, main_goal, updated_at FROM mandala_charts ORDER BY updated_at DESC LIMIT 3"],
  ["goal_actions", "SELECT s.title AS subgoal, a.text, a.completed FROM mandala_actions a JOIN mandala_subgoals s ON s.id = a.subgoal_id WHERE TRIM(a.text) != '' ORDER BY a.completed, s.position, a.position LIMIT 64"],
  ["books", "SELECT title, author, category, status, updated_at FROM books ORDER BY updated_at DESC LIMIT 30"],
  ["finance", "SELECT category, label, amount, currency, updated_at FROM finance_items ORDER BY category, label LIMIT 50"],
  ["holdings", "SELECT id, symbol, name, type, portfolio, updated_at FROM holdings ORDER BY updated_at DESC LIMIT 50"],
  ["transactions", "SELECT holding_id, type, quantity, price, fee, date FROM transactions ORDER BY date DESC LIMIT 80"],
] as const

async function read(source: string, sql: string): Promise<Section | null> {
  try {
    const result = await db.execute(sql)
    const rows = result.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "bigint" ? Number(value) : value])))
    return { source, rows }
  } catch { return null }
}

export async function getLineWebsiteContext() {
  const sections = (await Promise.all(QUERIES.map(([source, sql]) => read(source, sql))))
    .filter((section): section is Section => Boolean(section?.rows.length))
  return JSON.stringify({ generatedAt: new Date().toISOString(), timezone: "Asia/Tokyo", sections })
}
