import db from "@/lib/db";
import HealthDashboard, { HealthLog } from "./HealthDashboard";

async function getHealthLogs(): Promise<HealthLog[]> {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS health_logs (
        date TEXT PRIMARY KEY, weight REAL, bmi REAL, body_fat REAL,
        sleep_hours REAL, sleep_score INTEGER, steps INTEGER,
        resting_heart_rate INTEGER, calories_in INTEGER, calories_out INTEGER,
        notes TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    const result = await db.execute(
      "SELECT * FROM health_logs ORDER BY date DESC LIMIT 30"
    );
    return result.rows.map((r) => ({
      id:                 String(r.date),
      date:               String(r.date),
      weight:             r.weight as number | null,
      bmi:                r.bmi as number | null,
      body_fat:           r.body_fat as number | null,
      sleep_hours:        r.sleep_hours as number | null,
      sleep_score:        r.sleep_score as number | null,
      steps:              r.steps as number | null,
      resting_heart_rate: r.resting_heart_rate as number | null,
      calories_in:        r.calories_in as number | null,
      calories_out:       r.calories_out as number | null,
      notes:              String(r.notes ?? ""),
    }));
  } catch {
    return [];
  }
}

export default async function HealthPage() {
  const logs = await getHealthLogs();
  return <HealthDashboard logs={logs} />;
}
