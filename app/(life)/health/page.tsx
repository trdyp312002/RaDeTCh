import fs from 'fs/promises';
import path from 'path';
import HealthDashboard, { HealthLog } from './HealthDashboard';

async function getHealthLogs(): Promise<HealthLog[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'health.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw) as { logs: HealthLog[] };
    const logs = data.logs ?? [];

    logs.sort((a, b) =>
      String(b.date).substring(0, 10).localeCompare(String(a.date).substring(0, 10))
    );

    return logs.slice(0, 30);
  } catch {
    return [];
  }
}

export default async function HealthPage() {
  const logs = await getHealthLogs();
  return <HealthDashboard logs={logs} />;
}
