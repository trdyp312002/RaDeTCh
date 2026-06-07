"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { Activity, Heart, Moon, Zap, Flame, Footprints, Star, Utensils, Dumbbell } from "lucide-react"

type Tab = "overview" | "food" | "sleep" | "exercise"

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", Icon: Activity },
  { key: "food", label: "Nutrition", Icon: Utensils },
  { key: "sleep", label: "Sleep", Icon: Moon },
  { key: "exercise", label: "Exercise", Icon: Dumbbell },
]

export default function HealthDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [healthData, setHealthData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingWeight, setSyncingWeight] = useState(false)
  const [backfilling, setBackfilling] = useState(false)

  async function loadData() {
    try {
      const res = await fetch(`/api/health?t=${Date.now()}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const sorted = (data.logs || []).sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setHealthData(sorted)
      }
    } catch (err) {
      console.error("Failed to fetch health data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const saved = localStorage.getItem("garminSyncToday")
    let shouldSync = true
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.date.startsWith(new Date().toISOString().split("T")[0])) shouldSync = false
      } catch (_) {}
    }
    if (shouldSync) syncGarmin(true)
  }, [])

  // VeSync auto-sync once per day on page load
  useEffect(() => {
    const saved = localStorage.getItem("vesyncSyncToday")
    let shouldSync = true
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.date.startsWith(new Date().toISOString().split("T")[0])) shouldSync = false
      } catch (_) {}
    }
    if (shouldSync) {
      fetch("/api/vesync")
        .then((r) => r.json())
        .then((data) => {
          if (data.weight) {
            fetch("/api/health", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ weight: data.weight, notes: "VeSync Auto-Sync" }),
            }).then(() => loadData())
            localStorage.setItem("vesyncSyncToday", JSON.stringify({ date: new Date().toISOString() }))
          }
        })
        .catch(() => {})
    }
  }, [])

  async function syncGarmin(isAuto = false) {
    setSyncing(true)
    try {
      const res = await fetch("/api/garmin")
      if (res.ok) {
        const g = await res.json()
        await fetch("/api/health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sleep_hours: g.sleep_hours,
            sleep_score: g.sleep_score,
            steps: g.steps,
            resting_heart_rate: g.resting_heart_rate,
            notes: "Garmin Auto-Sync",
          }),
        })
        localStorage.setItem("garminSyncToday", JSON.stringify({ date: new Date().toISOString() }))
        await loadData()
        if (!isAuto) alert("Synced from Garmin!")
      } else {
        const err = await res.json()
        if (!isAuto) alert(`Garmin Error: ${err.error}`)
      }
    } catch {
      if (!isAuto) alert("Network error during sync.")
    } finally {
      setSyncing(false)
    }
  }

  async function backfillHistory() {
    setBackfilling(true)
    try {
      // Run Garmin backfill (90 days)
      const gRes = await fetch("/api/garmin/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: 90 }) })
      const gData = await gRes.json()
      // Run VeSync history
      const vRes = await fetch("/api/vesync/history", { method: "POST" })
      const vData = await vRes.json()
      await loadData()
      alert(`Backfill done!\nGarmin: ${gData.synced ?? "?"} days synced\nVeSync: ${vData.synced ?? 0} records`)
    } catch (e: any) {
      alert(`Backfill error: ${e.message}`)
    } finally {
      setBackfilling(false)
    }
  }

  async function syncVeSync() {
    setSyncingWeight(true)
    try {
      const res = await fetch("/api/vesync")
      const data = await res.json()
      if (!res.ok || data.error) {
        alert(`VeSync Error: ${data.error}`)
        return
      }
      await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: data.weight, notes: "VeSync Auto-Sync" }),
      })
      await loadData()
      alert(`Weight synced: ${data.weight} kg${data.bmi ? ` · BMI ${data.bmi}` : ""}`)
    } catch {
      alert("Network error syncing VeSync.")
    } finally {
      setSyncingWeight(false)
    }
  }

  const latest = healthData.at(-1) ?? null

  const fmtDate = (dateStr: string | undefined) => (dateStr ?? "").split(" ")[0].substring(5)

  const last14 = healthData.slice(-14)
  const sleepChart = last14.map(d => ({ date: fmtDate(d.date), hours: d.sleep_hours || 0, score: d.sleep_score || 0 }))
  const stepsChart = last14.map(d => ({ date: fmtDate(d.date), steps: d.steps || 0 }))
  const nutritionChart = last14.map(d => ({ date: fmtDate(d.date), in: d.calories_in || 0, out: d.calories_out || 0 }))

  const withSleep = healthData.filter(d => d.sleep_hours)
  const withScore = healthData.filter(d => d.sleep_score)
  const avgSleep = withSleep.length ? (withSleep.reduce((s, d) => s + d.sleep_hours, 0) / withSleep.length).toFixed(1) : "--"
  const avgScore = withScore.length ? Math.round(withScore.reduce((s, d) => s + d.sleep_score, 0) / withScore.length) : "--"
  const bestScore = withScore.length ? Math.max(...withScore.map(d => d.sleep_score)) : "--"

  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="max-w-7xl mx-auto relative z-10 p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-purple-400/60 mb-1">Health OS</p>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              Health Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {syncing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 text-sm">
                <Zap className="w-4 h-4 animate-spin" />
                Syncing...
              </div>
            )}
            <button
              onClick={() => backfillHistory()}
              disabled={backfilling}
              className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-sm transition-all text-purple-300 disabled:opacity-50"
            >
              {backfilling ? "Backfilling…" : "Backfill History"}
            </button>
            <button
              onClick={() => syncVeSync()}
              disabled={syncingWeight}
              className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-xl text-sm transition-all text-pink-300 disabled:opacity-50"
            >
              {syncingWeight ? "Syncing..." : "Sync Weight"}
            </button>
            <button
              onClick={() => syncGarmin(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all text-gray-300"
            >
              Sync Garmin
            </button>
          </div>
        </header>

        {/* KPI strip */}
        {!loading && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            <KpiCard title="Weight"  value={latest?.weight              ? `${latest.weight} kg`                     : "--"} icon={<Heart     className="w-4 h-4 text-pink-400"   />} from="from-pink-500/20"   border="border-pink-500/20"   />
            <KpiCard title="Sleep"   value={latest?.sleep_hours         ? `${latest.sleep_hours}h`                  : "--"} icon={<Moon      className="w-4 h-4 text-indigo-400" />} from="from-indigo-500/20" border="border-indigo-500/20" />
            <KpiCard title="Score"   value={latest?.sleep_score         ? `${latest.sleep_score}`                   : "--"} icon={<Star      className="w-4 h-4 text-yellow-400" />} from="from-yellow-500/20" border="border-yellow-500/20" />
            <KpiCard title="Steps"   value={latest?.steps               ? `${(latest.steps / 1000).toFixed(1)}k`   : "--"} icon={<Footprints className="w-4 h-4 text-green-400" />} from="from-green-500/20"  border="border-green-500/20"  />
            <KpiCard title="RHR"     value={latest?.resting_heart_rate  ? `${latest.resting_heart_rate} bpm`        : "--"} icon={<Activity  className="w-4 h-4 text-red-400"    />} from="from-red-500/20"   border="border-red-500/20"   />
            <KpiCard title="Cal Out" value={latest?.calories_out        ? `${latest.calories_out}`                  : "--"} icon={<Flame     className="w-4 h-4 text-orange-400" />} from="from-orange-500/20" border="border-orange-500/20" />
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === key ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ChartCard title="Weight Trend" icon={<Heart className="w-5 h-5 text-pink-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={healthData}>
                        <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#6b7280" />
                        <YAxis domain={["auto", "auto"]} stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }} itemStyle={{ color: "#fff" }} />
                        <Line type="monotone" dataKey="weight" stroke="#f472b6" strokeWidth={3} dot={{ r: 3, fill: "#f472b6" }} activeDot={{ r: 6, fill: "#fff", stroke: "#f472b6", strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Daily Steps" icon={<Footprints className="w-5 h-5 text-green-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stepsChart}>
                        <defs>
                          <linearGradient id="stepsBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
                            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                        <Bar dataKey="steps" fill="url(#stepsBarGrad)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
                <LogTable data={healthData} />
              </div>
            )}

            {/* ── NUTRITION ── */}
            {activeTab === "food" && (
              <div className="space-y-8">
                <ChartCard title="Calories In vs Out" icon={<Flame className="w-5 h-5 text-orange-400" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nutritionChart}>
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                      <Bar dataKey="in"  fill="#fb923c" radius={[4, 4, 0, 0]} name="Cal In"  />
                      <Bar dataKey="out" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Cal Out" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <Link href="/menu" className="block group">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-center gap-6 hover:bg-white/10 transition-all">
                    <div className="text-5xl shrink-0">🍜</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Recipe Menu</h3>
                      <p className="text-gray-400 text-sm">Browse all recipes — filter by nationality, ingredients, cooking method</p>
                    </div>
                    <div className="ml-auto text-gray-500 group-hover:text-white transition-colors text-xl">→</div>
                  </div>
                </Link>
              </div>
            )}

            {/* ── SLEEP ── */}
            {activeTab === "sleep" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ChartCard title="Sleep Duration (hrs)" icon={<Moon className="w-5 h-5 text-indigo-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sleepChart}>
                        <defs>
                          <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis domain={[0, 12]} stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                        <Bar dataKey="hours" fill="url(#sleepGrad)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Sleep Score" icon={<Star className="w-5 h-5 text-yellow-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sleepChart}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#facc15" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#facc15" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis domain={[0, 100]} stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                        <Area type="monotone" dataKey="score" stroke="#facc15" strokeWidth={3} fill="url(#scoreGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Avg Sleep", value: avgSleep !== "--" ? `${avgSleep}h` : "--" },
                    { label: "Avg Score", value: String(avgScore) },
                    { label: "Best Score", value: String(bestScore) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                      <p className="text-3xl font-bold text-white mb-2">{value}</p>
                      <p className="text-gray-400 text-sm">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EXERCISE ── */}
            {activeTab === "exercise" && (
              <div className="space-y-8">
                <ChartCard title="Daily Steps (Garmin)" icon={<Footprints className="w-5 h-5 text-green-400" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stepsChart}>
                      <defs>
                        <linearGradient id="stepsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4ade80" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                      <Area type="monotone" dataKey="steps" stroke="#4ade80" strokeWidth={3} fill="url(#stepsAreaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
                  <p className="text-5xl mb-4">💪</p>
                  <h3 className="text-xl font-bold text-white mb-2">Workout Logger</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">Manual workout tracking coming soon. Steps auto-synced from Garmin above.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon, from, border }: { title: string; value: string; icon: React.ReactNode; from: string; border: string }) {
  return (
    <div className={`bg-gradient-to-br ${from} to-transparent border ${border} rounded-2xl p-4 backdrop-blur-xl`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
      <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2 mb-5">{icon} {title}</h3>
      <div className="h-60">{children}</div>
    </div>
  )
}

function LogTable({ data }: { data: any[] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <h3 className="text-lg font-semibold text-gray-200">Recent Logs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Weight</th>
              <th className="p-4">Sleep</th>
              <th className="p-4">Score</th>
              <th className="p-4">Steps</th>
              <th className="p-4">RHR</th>
              <th className="p-4">Cal In</th>
              <th className="p-4">Cal Out</th>
              <th className="p-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((log, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 text-gray-300 transition-colors">
                <td className="p-4 whitespace-nowrap">{(log.date ?? "").split(" ")[0]}</td>
                <td className="p-4 text-pink-400 font-medium">{log.weight || "-"}</td>
                <td className="p-4 text-indigo-400 font-medium">{log.sleep_hours || "-"}</td>
                <td className="p-4 text-yellow-400 font-medium">{log.sleep_score || "-"}</td>
                <td className="p-4 text-green-400 font-medium">{log.steps?.toLocaleString() || "-"}</td>
                <td className="p-4 text-red-400 font-medium">{log.resting_heart_rate || "-"}</td>
                <td className="p-4 text-orange-400">{log.calories_in || "-"}</td>
                <td className="p-4 text-yellow-400">{log.calories_out || "-"}</td>
                <td className="p-4 text-gray-500 max-w-xs truncate">{log.notes || "-"}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">No data. Sync from Garmin to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
