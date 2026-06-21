'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface HealthLog {
  id: string;
  date: string;
  weight: number | null;
  sleep_hours: number | null;
  sleep_score: number | null;
  steps: number | null;
  resting_heart_rate: number | null;
  calories_in: number | null;
  calories_out: number | null;
  notes: string;
}

interface Props {
  logs: HealthLog[];
}

const CIRCUMFERENCE = 2 * Math.PI * 80;
const STEPS_GOAL = 10000;

function formatSleepHours(h: number | null) {
  if (h == null) return '—';
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

function sleepLabel(score: number | null) {
  if (score == null) return '—';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
}

function sleepColor(score: number | null) {
  if (score == null) return 'text-slate-400';
  if (score >= 80) return 'bg-blue-50 text-blue-700';
  if (score >= 60) return 'bg-yellow-50 text-yellow-700';
  return 'bg-red-50 text-red-700';
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-slate-100 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[13px] text-slate-500 mb-0.5">{label}</div>
        <div className="text-[22px] font-bold text-slate-900 leading-tight">{value}</div>
        {sub && <div className="text-[12px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function HealthDashboard({ logs }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const latest = logs[0] ?? null;
  const chartData = logs
    .slice(0, 14)
    .reverse()
    .map((l) => ({
      date: String(l.date).substring(5, 10),
      sleep_score: l.sleep_score,
      sleep_hours: l.sleep_hours != null ? parseFloat(l.sleep_hours.toFixed(1)) : null,
      steps: l.steps,
    }));

  const tableData = logs.slice(0, 10);

  const sleepOffset =
    latest?.sleep_score != null
      ? CIRCUMFERENCE * (1 - latest.sleep_score / 100)
      : CIRCUMFERENCE;

  const stepsOffset =
    latest?.steps != null
      ? CIRCUMFERENCE * (1 - Math.min(latest.steps / STEPS_GOAL, 1))
      : CIRCUMFERENCE;

  const stepsPct =
    latest?.steps != null ? Math.min(Math.round((latest.steps / STEPS_GOAL) * 100), 100) : null;

  const latestDate = latest?.date ? String(latest.date).substring(0, 10) : null;

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const garminRes = await fetch('/api/garmin');
      const garmin = await garminRes.json();

      if (garmin.error) {
        setSyncMsg(`❌ ${garmin.error}`);
        return;
      }

      const saveRes = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...garmin, notes: 'Garmin Auto-Sync' }),
      });

      if (!saveRes.ok) {
        setSyncMsg('❌ Failed to save data');
        return;
      }

      setSyncMsg('✓ Synced successfully!');
      router.refresh();
    } catch (e: unknown) {
      setSyncMsg(`❌ ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto p-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[32px] font-semibold text-slate-900 tracking-tight mb-2">
            Health & Vitality
          </h1>
          <p className="text-[15px] text-slate-500">
            {latestDate ? `Last entry: ${latestDate}` : 'No data yet'} · Garmin Connect
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-full text-[14px] font-medium transition-colors"
          >
            {syncing ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            )}
            {syncing ? 'Syncing...' : 'Sync from Garmin'}
          </button>
          {syncMsg && (
            <span className={`text-[12px] ${syncMsg.startsWith('❌') ? 'text-red-500' : 'text-emerald-600'}`}>
              {syncMsg}
            </span>
          )}
        </div>
      </div>

      {/* Progress Rings */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 mb-10">

        {/* Sleep Score Ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-56 h-56 mb-5">
            <svg className="w-full h-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="80" fill="none" stroke="#f1f5f9" strokeWidth="16" />
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke={latest?.sleep_score != null ? 'url(#sleepGradient)' : '#f1f5f9'}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={sleepOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 mb-1">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                <path d="M19 3v4" />
                <path d="M21 5h-4" />
              </svg>
              <span className="text-[14px] font-medium text-slate-600 mt-1">Sleep Score</span>
              <span className="text-[44px] font-bold text-slate-900 leading-tight">
                {latest?.sleep_score ?? '—'}
              </span>
              <span className="text-[14px] font-medium text-slate-500">
                {sleepLabel(latest?.sleep_score ?? null)}
              </span>
            </div>
          </div>
          <div className="text-center text-[14px] font-medium text-slate-500 mb-1">Goal: 80+</div>
          <div className="text-center text-[13px] text-slate-400">
            Total Sleep:{' '}
            <span className="font-semibold text-slate-700">
              {formatSleepHours(latest?.sleep_hours ?? null)}
            </span>
          </div>
        </div>

        {/* Steps Ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-56 h-56 mb-5">
            <svg className="w-full h-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="stepsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="80" fill="none" stroke="#f1f5f9" strokeWidth="16" />
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke={latest?.steps != null ? 'url(#stepsGradient)' : '#f1f5f9'}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={stepsOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 mb-1">
                <path d="M13 4v10.93a2 2 0 0 1-.36 1.16L10 20" />
                <path d="m7.5 19.5 2-2" />
                <path d="M6.5 17.5l2-2" />
                <path d="m9.5 14.5 1.5-1.5" />
                <path d="M17 4a2 2 0 0 1 0 4" />
                <path d="M19 8a2 2 0 0 1 0 4" />
                <path d="M20 12v4" />
              </svg>
              <span className="text-[14px] font-medium text-slate-600 mt-1">Daily Steps</span>
              <span className="text-[44px] font-bold text-slate-900 leading-tight">
                {latest?.steps != null ? latest.steps.toLocaleString() : '—'}
              </span>
              <span className="text-[14px] font-medium text-slate-500">
                {latest?.steps != null ? `/ ${STEPS_GOAL.toLocaleString()}` : 'No data'}
              </span>
            </div>
          </div>
          <div className="text-center text-[14px] font-medium text-slate-500 mb-1">
            {stepsPct != null ? `${stepsPct}% of Goal` : `Goal: ${STEPS_GOAL.toLocaleString()}`}
          </div>
          <div className="text-center text-[13px] text-slate-400">
            Resting HR:{' '}
            <span className="font-semibold text-slate-700">
              {latest?.resting_heart_rate != null ? `${latest.resting_heart_rate} bpm` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Resting Heart Rate"
          value={latest?.resting_heart_rate != null ? `${latest.resting_heart_rate}` : '—'}
          sub={latest?.resting_heart_rate != null ? 'bpm' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          }
        />
        <StatCard
          label="Sleep Hours"
          value={latest?.sleep_hours != null ? `${latest.sleep_hours.toFixed(1)}` : '—'}
          sub={latest?.sleep_hours != null ? 'hours' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          }
        />
        <StatCard
          label="7-day Avg Sleep"
          value={
            (() => {
              const valid = logs.slice(0, 7).filter((l) => l.sleep_score != null);
              if (valid.length === 0) return '—';
              const avg = valid.reduce((s, l) => s + (l.sleep_score ?? 0), 0) / valid.length;
              return Math.round(avg).toString();
            })()
          }
          sub="avg score"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Sleep Score Trend */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-6">
            <h2 className="text-[16px] font-semibold text-slate-900 mb-5">Sleep Score (14 days)</h2>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="sleepAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 13,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  formatter={(v) => [v as number, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="sleep_score"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#sleepAreaGrad)"
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sleep Hours Trend */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-6">
            <h2 className="text-[16px] font-semibold text-slate-900 mb-5">Sleep Hours (14 days)</h2>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="hoursAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[4, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 13,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  formatter={(v: unknown) => [`${v}h`, 'Hours']}
                />
                <Area
                  type="monotone"
                  dataKey="sleep_hours"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  fill="url(#hoursAreaGrad)"
                  dot={{ r: 3, fill: '#2dd4bf', strokeWidth: 0 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Entries Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-6">
        <h2 className="text-[16px] font-semibold text-slate-900 mb-5">Recent Entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-100 text-[12px] uppercase tracking-wide">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-center">Sleep Score</th>
                <th className="pb-3 font-medium text-center">Sleep</th>
                <th className="pb-3 font-medium text-center">Steps</th>
                <th className="pb-3 font-medium text-center">Heart Rate</th>
                <th className="pb-3 font-medium text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableData.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-medium text-slate-800">
                    {String(log.date).substring(0, 10)}
                  </td>
                  <td className="py-3 text-center">
                    {log.sleep_score != null ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${sleepColor(log.sleep_score)}`}>
                        {log.sleep_score}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 text-center text-slate-600">
                    {log.sleep_hours != null ? formatSleepHours(log.sleep_hours) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 text-center text-slate-600">
                    {log.steps != null ? log.steps.toLocaleString() : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 text-center text-slate-600">
                    {log.resting_heart_rate != null ? `${log.resting_heart_rate} bpm` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      {log.notes?.includes('Garmin') ? 'Garmin' : log.notes || 'Manual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
