"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────
interface HealthLog {
  date: string;
  sleep_hours: number | null;
  sleep_score: number | null;
  steps: number | null;
  resting_heart_rate: number | null;
  weight: number | null;
}

interface DiaryEntry {
  date: string;
  morning: string;
  afternoon: string;
  evening: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  cover_image?: string;
  category?: string;
}

interface MandalaAction {
  completed: number;
  text: string;
}

interface MandalaSubgoal {
  title: string;
  color: string;
}

interface MandalaData {
  chart: { main_goal: string } | null;
  subgoals: MandalaSubgoal[];
  actions: MandalaAction[];
}

interface Milestone {
  id: string;
  year: number;
  title: string;
  description: string;
  category: string;
  color: string;
}

interface Country {
  code?: string;
  name?: string;
  country?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtSleep(h: number | null) {
  if (h == null) return "—";
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
}

function sleepColor(score: number | null) {
  if (score == null) return "#94a3b8";
  if (score >= 80) return "#3b82f6";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [selectedMood, setSelectedMood] = useState("calm");
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [todayDiary, setTodayDiary] = useState<DiaryEntry | null>(null);
  const [readingBooks, setReadingBooks] = useState<Book[]>([]);
  const [bookStats, setBookStats] = useState({ total: 0, reading: 0, completed: 0 });
  const [mandala, setMandala] = useState<MandalaData | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [countriesCount, setCountriesCount] = useState(0);
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        await Promise.all([
          fetchHealth(),
          fetchDiary(),
          fetchBooks(),
          fetchMandala(),
          fetchTimeline(),
          fetchTravel(),
          fetchNetWorth(),
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  async function fetchHealth() {
    try {
      const res = await fetch("/api/health");
      if (!res.ok) return;
      const logs: HealthLog[] = await res.json();
      setHealthLogs(logs.slice(-30));
    } catch {}
  }

  async function fetchDiary() {
    try {
      const res = await fetch("/api/daily");
      if (!res.ok) return;
      const data = await res.json();
      const entries: DiaryEntry[] = Array.isArray(data) ? data : data.entries ?? [];
      const today = todayISO();
      const entry = entries.find((e) => e.date === today) ?? entries[entries.length - 1] ?? null;
      setTodayDiary(entry);
    } catch {}
  }

  async function fetchBooks() {
    try {
      const res = await fetch("/api/books");
      if (!res.ok) return;
      const books: Book[] = await res.json();
      setReadingBooks(books.filter((b) => b.status === "reading"));
      setBookStats({
        total: books.length,
        reading: books.filter((b) => b.status === "reading").length,
        completed: books.filter((b) => b.status === "completed").length,
      });
    } catch {}
  }

  async function fetchMandala() {
    try {
      const res = await fetch("/api/mandala");
      if (!res.ok) return;
      setMandala(await res.json());
    } catch {}
  }

  async function fetchTimeline() {
    try {
      const res = await fetch("/api/timeline");
      if (!res.ok) return;
      const data = await res.json();
      const list: Milestone[] = Array.isArray(data) ? data : data.milestones ?? [];
      setMilestones(list.sort((a, b) => b.year - a.year));
    } catch {}
  }

  async function fetchTravel() {
    try {
      const res = await fetch("/api/travel/countries");
      if (!res.ok) return;
      const data: Country[] = await res.json();
      setCountriesCount(Array.isArray(data) ? data.length : 0);
    } catch {}
  }

  async function fetchNetWorth() {
    try {
      const [finRes, fxRes, hRes] = await Promise.all([
        fetch("/api/finance"),
        fetch("/api/fx"),
        fetch("/api/holdings"),
      ]);
      let cash = 0, other = 0, liability = 0;
      if (finRes.ok) {
        const items = await finRes.json();
        items.forEach((i: any) => {
          const a = Number(i.amount) || 0;
          if (i.category === "cash") cash += a;
          if (i.category === "other_asset" || i.category === "bond") other += a;
          if (i.category === "liability") liability += a;
        });
      }
      let holdingsTHB = 0;
      let thbRate = 35.5;
      if (fxRes.ok) {
        const fx = await fxRes.json();
        if (fx?.rates?.THB) thbRate = fx.rates.THB;
      }
      if (hRes.ok) {
        const holdings = await hRes.json();
        const symbols = [...new Set(holdings.map((h: any) => h.symbol))].filter(Boolean).join(",");
        if (symbols) {
          const qRes = await fetch(`/api/market?symbols=${symbols}`);
          if (qRes.ok) {
            const quotes = await qRes.json();
            holdings.forEach((h: any) => {
              const price = quotes[h.symbol]?.currentPrice || 0;
              holdingsTHB += (h.quantity || 0) * price * thbRate;
            });
          }
        }
      }
      setNetWorth(cash + other + holdingsTHB - liability);
    } catch {}
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const latest = healthLogs[healthLogs.length - 1] ?? null;
  const sleepScore = latest?.sleep_score ?? null;
  const CIRC = 2 * Math.PI * 40;
  const scoreOffset = sleepScore != null ? CIRC * (1 - sleepScore / 100) : CIRC;

  const sleepChartData = healthLogs.slice(-7).map((l) => ({
    day: l.date.slice(5),
    hours: Number((l.sleep_hours ?? 0).toFixed(1)),
  }));

  const mandalaGoal = mandala?.chart?.main_goal ?? "";
  const totalActions = mandala?.actions?.length ?? 0;
  const doneActions = mandala?.actions?.filter((a) => a.completed === 1).length ?? 0;
  const mandalaPercent = totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0;

  const latestMilestone = milestones[0] ?? null;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest text-[#8C837A] uppercase mb-1">
          {new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-3xl font-serif text-[#1F1D1A] tracking-tight">Life OS Dashboard</h1>
        <p className="text-sm text-[#8C837A] mt-1">ภาพรวมชีวิตของวันนี้ รวบรวมจากทุกหน้า</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[#8C837A] text-sm mb-6">
          <div className="w-4 h-4 border-2 border-[#E8E1D5] border-t-[#8C837A] rounded-full animate-spin" />
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* ── Section 1: Health Snapshot ───────────────────────────────────── */}
      <section className="mb-6">
        <SectionLabel href="/health" label="สุขภาพ" icon="💪" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Sleep Score Ring */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-[#8C837A] font-medium">Sleep Score</p>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#E8E1D5" strokeWidth="12" fill="none" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke={sleepColor(sleepScore)}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={CIRC}
                  strokeDashoffset={scoreOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <span className="absolute text-xl font-bold text-[#1F1D1A]">
                {sleepScore ?? "—"}
              </span>
            </div>
            <p className="text-xs text-[#8C837A]">
              {sleepScore != null ? (sleepScore >= 80 ? "Good" : sleepScore >= 60 ? "Fair" : "Poor") : "ไม่มีข้อมูล"}
            </p>
          </div>

          <SmallStat icon="🌙" label="นอนหลับ" value={fmtSleep(latest?.sleep_hours ?? null)} sub={latest?.date ?? "—"} />
          <SmallStat icon="👟" label="ก้าวเดิน" value={latest?.steps != null ? latest.steps.toLocaleString() : "—"} sub="steps" />
          <SmallStat icon="❤️" label="Heart Rate" value={latest?.resting_heart_rate != null ? `${latest.resting_heart_rate} bpm` : "—"} sub={latest?.weight != null ? `${latest.weight} kg` : ""} />
        </div>
      </section>

      {/* ── Section 2: Sleep Chart + Book ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-[#1F1D1A]">การนอน 7 วันล่าสุด</h3>
            <Link href="/health" className="text-xs text-[#8C837A] hover:text-[#1F1D1A]">ดูทั้งหมด →</Link>
          </div>
          {sleepChartData.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepChartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8C837A" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: "#8C837A" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v}h`, "นอน"]}
                    contentStyle={{ borderRadius: "10px", border: "none", fontSize: 12 }}
                  />
                  <Bar dataKey="hours" fill="#818CF8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="ยังไม่มีข้อมูลการนอน" />
          )}
        </div>

        {/* Currently Reading */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-[#1F1D1A]">📚 กำลังอ่าน</h3>
            <Link href="/books" className="text-xs text-[#8C837A] hover:text-[#1F1D1A]">ห้องสมุด →</Link>
          </div>
          {readingBooks.length > 0 ? (
            <div className="space-y-4">
              {readingBooks.slice(0, 2).map((b) => (
                <div key={b.id} className="flex gap-3 items-start">
                  {b.cover_image ? (
                    <img src={b.cover_image} alt={b.title} className="w-10 h-14 object-cover rounded-lg border border-[#E8E1D5] shrink-0" />
                  ) : (
                    <div className="w-10 h-14 bg-[#F5F0EA] rounded-lg border border-[#E8E1D5] shrink-0 flex items-center justify-center text-xl">📖</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1F1D1A] leading-tight line-clamp-2">{b.title}</p>
                    <p className="text-xs text-[#8C837A] mt-0.5 truncate">{b.author}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">reading</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[#E8E1D5] flex gap-4 text-xs text-[#8C837A]">
                <span>📚 {bookStats.total} เล่ม</span>
                <span>✅ {bookStats.completed} จบแล้ว</span>
              </div>
            </div>
          ) : (
            <div>
              <EmptyState text="ยังไม่มีหนังสือที่กำลังอ่าน" />
              <div className="pt-3 border-t border-[#E8E1D5] flex gap-4 text-xs text-[#8C837A] mt-3">
                <span>📚 {bookStats.total} เล่ม</span>
                <span>✅ {bookStats.completed} จบแล้ว</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Diary + Mandala ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Diary */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-[#1F1D1A]">
              📓 บันทึก {todayDiary?.date === todayISO() ? "วันนี้" : todayDiary ? formatDate(todayDiary.date) : ""}
            </h3>
            <Link href="/daily" className="text-xs text-[#8C837A] hover:text-[#1F1D1A]">เขียนบันทึก →</Link>
          </div>
          {todayDiary && (todayDiary.morning || todayDiary.afternoon || todayDiary.evening) ? (
            <div className="space-y-3 text-sm">
              {todayDiary.morning && (
                <div>
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">เช้า</span>
                  <p className="text-[#33302C] mt-0.5 line-clamp-3 leading-relaxed">{todayDiary.morning}</p>
                </div>
              )}
              {todayDiary.afternoon && (
                <div>
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">บ่าย</span>
                  <p className="text-[#33302C] mt-0.5 line-clamp-3 leading-relaxed">{todayDiary.afternoon}</p>
                </div>
              )}
              {todayDiary.evening && (
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">เย็น</span>
                  <p className="text-[#33302C] mt-0.5 line-clamp-3 leading-relaxed">{todayDiary.evening}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="ยังไม่มีบันทึกวันนี้" />
          )}
        </div>

        {/* Mandala Goal */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-[#1F1D1A]">🎯 Mandala Goal</h3>
            <Link href="/routine" className="text-xs text-[#8C837A] hover:text-[#1F1D1A]">แผน →</Link>
          </div>
          {mandalaGoal ? (
            <div>
              <p className="text-lg font-bold text-[#1F1D1A] mb-4">{mandalaGoal}</p>
              <div className="mb-2 flex justify-between text-xs text-[#8C837A]">
                <span>ความคืบหน้า</span>
                <span>{doneActions}/{totalActions} tasks</span>
              </div>
              <div className="w-full h-2 bg-[#F5F0EA] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-700"
                  style={{ width: `${mandalaPercent}%` }}
                />
              </div>
              <p className="text-right text-xs text-[#8C837A] mt-1">{mandalaPercent}%</p>
              {mandala?.subgoals && mandala.subgoals.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {mandala.subgoals.filter((s) => s.title).slice(0, 6).map((s, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: s.color }}>
                      {s.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="ยังไม่ได้ตั้ง Mandala Goal" />
          )}
        </div>
      </div>

      {/* ── Section 4: Net Worth + Travel + Timeline ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Net Worth */}
        <Link href="/life" className="block group">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl p-6 h-full shadow-xl hover:-translate-y-1 transition-transform duration-200">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">💰 Net Worth</p>
            <p className="text-2xl font-extrabold mt-2">
              {netWorth != null
                ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(netWorth)
                : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">อัปเดตล่าสุด</p>
            <p className="text-xs text-slate-300 mt-4 group-hover:underline">ดูรายละเอียด →</p>
          </div>
        </Link>

        {/* Travel */}
        <Link href="/travel" className="block group">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 h-full shadow-xl hover:-translate-y-1 transition-transform duration-200">
            <p className="text-xs font-bold tracking-widest text-blue-200 uppercase mb-1">✈️ Travel</p>
            <p className="text-4xl font-extrabold mt-2">{countriesCount}</p>
            <p className="text-sm text-blue-100 mt-1">ประเทศที่เคยไป</p>
            <p className="text-xs text-blue-200 mt-4 group-hover:underline">ดูแผนที่ →</p>
          </div>
        </Link>

        {/* Latest Milestone */}
        <Link href="/routine" className="block group">
          <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full hover:-translate-y-1 transition-transform duration-200">
            <p className="text-xs font-bold tracking-widest text-[#8C837A] uppercase mb-1">🗓️ Timeline</p>
            {latestMilestone ? (
              <>
                <p className="text-2xl font-extrabold text-[#1F1D1A] mt-2">{latestMilestone.year}</p>
                <p className="text-sm font-medium text-[#33302C] mt-1 line-clamp-2">{latestMilestone.title}</p>
                <p className="text-xs text-[#8C837A] mt-1 line-clamp-1">{latestMilestone.description}</p>
              </>
            ) : (
              <p className="text-sm text-[#8C837A] mt-2">ยังไม่มี Milestone</p>
            )}
            <p className="text-xs text-[#8C837A] mt-4 group-hover:text-[#1F1D1A]">ดู Timeline →</p>
          </div>
        </Link>
      </div>

      {/* ── Mood Selector ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h3 className="text-base font-semibold text-[#1F1D1A] mb-5">อารมณ์วันนี้</h3>
        <div className="flex justify-around items-center max-w-md mx-auto">
          {[
            { id: "happy", icon: "😁", label: "สุข" },
            { id: "calm", icon: "😌", label: "สงบ" },
            { id: "neutral", icon: "😐", label: "ปกติ" },
            { id: "stressed", icon: "😫", label: "เครียด" },
            { id: "sad", icon: "😢", label: "เศร้า" },
          ].map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${selectedMood === mood.id ? "bg-[#4A90E2] shadow-lg scale-110" : "bg-[#F5F0EA] group-hover:bg-[#E6F0FA]"}`}>
                <span className={selectedMood === mood.id ? "opacity-100" : "opacity-50 grayscale"}>
                  {mood.icon}
                </span>
              </div>
              <span className={`text-xs ${selectedMood === mood.id ? "text-[#4A90E2] font-semibold" : "text-[#8C837A]"}`}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SectionLabel({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-[#8C837A] uppercase tracking-widest flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </h2>
      <Link href={href} className="text-xs text-[#8C837A] hover:text-[#1F1D1A]">ดูเพิ่ม →</Link>
    </div>
  );
}

function SmallStat({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#E8E1D5] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div className="text-2xl mb-2">{icon}</div>
      <div>
        <p className="text-xs text-[#8C837A]">{label}</p>
        <p className="text-xl font-bold text-[#1F1D1A] mt-0.5">{value}</p>
        {sub && <p className="text-xs text-[#8C837A] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-20 rounded-2xl bg-[#F9F6F2] border border-dashed border-[#E8E1D5]">
      <p className="text-sm text-[#8C837A]">{text}</p>
    </div>
  );
}
