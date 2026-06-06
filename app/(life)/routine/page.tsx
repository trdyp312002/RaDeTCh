"use client";
import { useState, useEffect } from "react";
import holidaysData from "@/data/holidays.json";

type Mode = "normal" | "ot" | "weekend";
type DayCategory = "workday" | "weekend" | "holiday" | "personal";
type Holiday = { date: string; name: string };

const HOLIDAYS: Holiday[] = (holidaysData as { holidays: Holiday[] }).holidays;

const tasks = [
  { id: "exercise", label: "Exercise",        duration: 30, color: "text-gray-700" },
  { id: "eat",      label: "กินข้าว",        duration: 25, color: "text-gray-700" },
  { id: "shower",   label: "อาบน้ำ",          duration: 20, color: "text-gray-700" },
  { id: "laundry",  label: "ซักเสื้อผ้า",     duration: 25, color: "text-gray-700" },
  { id: "anki",     label: "Anki (25 words)", duration: 60, color: "text-indigo-600" },
];

const priorities = [
  { rank: "01", label: "Sleep",    detail: "8 hours · 22:30 → 06:30", color: "bg-gray-900" },
  { rank: "02", label: "Exercise", detail: "30 min",                  color: "bg-gray-600" },
  { rank: "03", label: "Eat",      detail: "25 min",                  color: "bg-gray-400" },
  { rank: "04", label: "Shower",   detail: "20 min",                  color: "bg-gray-300" },
];

const normalSchedule = [
  { time: "06:30",         block: "Wake up",        duration: "—",       type: "fixed"    },
  { time: "08:00 – 16:45", block: "Work",           duration: "—",       type: "work"     },
  { time: "17:00",         block: "Home",           duration: "—",       type: "fixed"    },
  { time: "17:00 – 17:30", block: "Exercise",       duration: "30 min",  type: "priority" },
  { time: "17:30 – 17:55", block: "กินข้าว",        duration: "25 min",  type: "priority" },
  { time: "17:55 – 18:15", block: "อาบน้ำ",          duration: "20 min",  type: "priority" },
  { time: "18:15 – 18:40", block: "ซักเสื้อผ้า",   duration: "25 min",  type: "priority" },
  { time: "18:40 – 19:40", block: "Anki (25 words)",duration: "60 min",  type: "anki"     },
  { time: "19:40 – 22:00", block: "Free time",      duration: "2h 20min",type: "free"     },
  { time: "22:00 – 22:30", block: "Pre-sleep prep", duration: "30 min",  type: "fixed"    },
  { time: "22:30",         block: "Sleep",          duration: "8 hours", type: "sleep"    },
];

const otSchedule = [
  { time: "06:30",         block: "Wake up",        duration: "—",      type: "fixed"    },
  { time: "08:00 – 19:00", block: "Work (OT)",      duration: "—",      type: "work"     },
  { time: "19:20",         block: "Home",           duration: "—",      type: "fixed"    },
  { time: "19:20 – 19:50", block: "Exercise",       duration: "30 min", type: "priority" },
  { time: "19:50 – 20:15", block: "กินข้าว",        duration: "25 min", type: "priority" },
  { time: "20:15 – 20:35", block: "อาบน้ำ",          duration: "20 min", type: "priority" },
  { time: "20:35 – 21:00", block: "ซักเสื้อผ้า",   duration: "25 min", type: "priority" },
  { time: "21:00 – 22:00", block: "Anki (25 words)",duration: "60 min", type: "anki"     },
  { time: "22:00 – 22:30", block: "Pre-sleep prep", duration: "30 min", type: "fixed"    },
  { time: "22:30",         block: "Sleep",          duration: "8 hours",type: "sleep"    },
];

const weekendSchedule = [
  { time: "06:30",         block: "Wake up",        duration: "—",        type: "fixed"    },
  { time: "07:00 – 07:30", block: "Exercise",       duration: "30 min",   type: "priority" },
  { time: "07:30 – 07:55", block: "กินข้าว",        duration: "25 min",   type: "priority" },
  { time: "07:55 – 08:15", block: "อาบน้ำ",          duration: "20 min",   type: "priority" },
  { time: "08:15 – 08:40", block: "ซักเสื้อผ้า",   duration: "25 min",   type: "priority" },
  { time: "08:40 – 09:40", block: "Anki (25 words)",duration: "60 min",   type: "anki"     },
  { time: "09:40 – 22:00", block: "Free time",      duration: "12h 20min",type: "free"     },
  { time: "22:00 – 22:30", block: "Pre-sleep prep", duration: "30 min",   type: "fixed"    },
  { time: "22:30",         block: "Sleep",          duration: "8 hours",  type: "sleep"    },
];

const rules = [
  "Anki ห้ามข้าม — ทำทุกวัน ถ้าเหนื่อยให้ทำก่อนนอนก็ได้ แต่ต้องทำ",
  "Exercise — ข้ามได้ไม่เกิน 2 วัน/สัปดาห์",
  "OT day: ทำครบ 160 min พอดี 22:00 — ไม่มี free time",
  "Sleep 22:30 — fixed ไม่เลื่อน",
];

const DAY_NAMES = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function minutesUntil2200(): number {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(22, 0, 0, 0);
  return Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 60000));
}

function formatMinutes(min: number): string {
  if (min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function typeStyle(type: string) {
  switch (type) {
    case "sleep":    return "text-gray-900 font-semibold";
    case "priority": return "text-gray-700";
    case "anki":     return "text-indigo-600";
    case "free":     return "text-emerald-600";
    case "work":     return "text-gray-400";
    default:         return "text-gray-400";
  }
}

function durationBadge(type: string) {
  const base = "text-[10px] px-2.5 py-1 rounded-full border";
  switch (type) {
    case "sleep": return `${base} border-gray-200 text-gray-500`;
    case "free":  return `${base} border-emerald-100 text-emerald-500`;
    case "anki":  return `${base} border-indigo-100 text-indigo-400`;
    default:      return `${base} border-gray-100 text-gray-400`;
  }
}

export default function Routine() {
  const today = todayKey();
  const todayDate = new Date();
  const dow = todayDate.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const companyHoliday = HOLIDAYS.find((h) => h.date === today) ?? null;

  const [isPersonalOff, setIsPersonalOff] = useState(false);
  const [mode, setMode] = useState<Mode>(() => {
    if (isWeekend || companyHoliday) return "weekend";
    return "normal";
  });
  const [done, setDone] = useState<Set<string>>(new Set());
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const stored = localStorage.getItem(`personalOff_${today}`);
    if (stored === "true") {
      setIsPersonalOff(true);
      setMode("weekend");
    }
  }, [today]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const togglePersonalOff = () => {
    const next = !isPersonalOff;
    setIsPersonalOff(next);
    if (next) {
      localStorage.setItem(`personalOff_${today}`, "true");
      setMode("weekend");
    } else {
      localStorage.removeItem(`personalOff_${today}`);
      setMode("normal");
    }
  };

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  let dayCategory: DayCategory = "workday";
  if (isWeekend) dayCategory = "weekend";
  else if (companyHoliday) dayCategory = "holiday";
  else if (isPersonalOff) dayCategory = "personal";

  const dayLabel = `${DAY_NAMES[dow]} ${todayDate.getDate()}/${todayDate.getMonth()+1}/${todayDate.getFullYear()}`;

  const remaining = minutesUntil2200();
  const pendingMin = tasks.filter((t) => !done.has(t.id)).reduce((s, t) => s + t.duration, 0);
  const freeMin = remaining - pendingMin;
  const allDone = done.size === tasks.length;

  const freeColor = freeMin <= 0 ? "text-red-500" : freeMin < 30 ? "text-amber-500" : "text-emerald-600";
  const freeBg   = freeMin <= 0 ? "bg-red-50 border-red-100" : freeMin < 30 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100";

  const schedule = mode === "normal" ? normalSchedule : mode === "ot" ? otSchedule : weekendSchedule;

  return (
    <div className="min-h-screen bg-white pt-10 pb-24 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-5">Daily System</p>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">Routine</h1>
          <p className="text-gray-400 text-sm leading-7 max-w-xl">
            ระบบบังคับตัวเองรายวัน เรียงจากสิ่งสำคัญที่สุด — นอนหลับก่อน ทุกอย่างหลังจากนั้น
          </p>
        </div>

        <div className="h-px bg-gray-100 mb-16" />

        {/* Today / Day Type */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-6">Today</p>
          <div className="border border-gray-100 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">{dayLabel}</p>
              {dayCategory === "weekend" && (
                <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-violet-50 text-violet-500 border border-violet-100">
                  วันหยุด · เสาร์/อาทิตย์
                </span>
              )}
              {dayCategory === "holiday" && (
                <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                  วันหยุดบริษัท · {companyHoliday?.name}
                </span>
              )}
              {dayCategory === "personal" && (
                <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
                  หยุดส่วนตัว
                </span>
              )}
              {dayCategory === "workday" && (
                <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                  วันทำงาน
                </span>
              )}
            </div>

            {!isWeekend && !companyHoliday && (
              <button
                onClick={togglePersonalOff}
                className={`text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl border transition-all ${
                  isPersonalOff
                    ? "bg-gray-900 text-white border-gray-900"
                    : "text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {isPersonalOff ? "ยกเลิกหยุดส่วนตัว" : "หยุดส่วนตัว"}
              </button>
            )}
          </div>
        </section>

        <div className="h-px bg-gray-100 mb-16" />

        {/* Tracker */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400">Today&apos;s Tracker</p>
            <p className="text-xs text-gray-300 font-mono">{formatTime(now)}</p>
          </div>

          <div className={`rounded-2xl p-6 mb-6 border ${freeBg}`}>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
              {allDone ? "Free time remaining" : "Free time (after pending tasks)"}
            </p>
            <p className={`text-4xl font-bold tracking-tight ${freeColor}`}>
              {freeMin <= 0 ? "ไม่พอแล้ว" : formatMinutes(freeMin)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {remaining} min ถึง 22:00
              {pendingMin > 0 && ` · ยังต้องทำอีก ${pendingMin} min`}
            </p>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const isDone = done.has(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => toggle(task.id)}
                  className={`w-full flex items-center gap-5 border rounded-2xl px-6 py-5 transition-all text-left ${
                    isDone ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isDone ? "border-gray-900 bg-gray-900" : "border-gray-200"
                  }`}>
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <p className={`flex-1 text-sm font-medium transition-colors ${isDone ? "text-gray-400 line-through" : task.color}`}>
                    {task.label}
                  </p>
                  <span className="text-[10px] text-gray-300 border border-gray-100 px-2.5 py-1 rounded-full">
                    {task.duration} min
                  </span>
                </button>
              );
            })}
          </div>

          {allDone && (
            <p className="text-xs text-gray-400 tracking-widest uppercase text-center mt-4">
              ทำครบแล้ว — เหลือเวลาว่าง {formatMinutes(freeMin)}
            </p>
          )}
        </section>

        <div className="h-px bg-gray-100 mb-16" />

        {/* Priority */}
        <section className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-8">Priority Order</p>
          <div className="space-y-3">
            {priorities.map((p) => (
              <div key={p.rank} className="border border-gray-100 rounded-2xl p-6 flex items-center gap-6 hover:border-gray-200 transition-colors">
                <div className={`w-1.5 h-10 rounded-full ${p.color} flex-shrink-0`} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-300 mb-1">{p.rank}</p>
                  <p className="text-gray-900 font-semibold text-sm">{p.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{p.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-gray-100 mb-16" />

        {/* Schedule Reference */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400">Schedule Reference</p>
            <div className="flex border border-gray-100 rounded-xl overflow-hidden text-[10px] uppercase tracking-widest">
              {(["normal","ot","weekend"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-5 py-2.5 transition-colors ${mode === m ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"}`}
                >
                  {m === "normal" ? "Normal" : m === "ot" ? "OT Day" : "Weekend"}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            {schedule.map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-7 py-4 gap-4 ${i !== schedule.length - 1 ? "border-b border-gray-50" : ""}`}>
                <p className="text-[10px] text-gray-300 font-mono w-28 flex-shrink-0">{row.time}</p>
                <p className={`flex-1 text-sm ${typeStyle(row.type)}`}>{row.block}</p>
                {row.duration !== "—" && (
                  <span className={durationBadge(row.type)}>{row.duration}</span>
                )}
              </div>
            ))}
          </div>

          {mode === "ot" && (
            <p className="text-xs text-gray-400 mt-4 px-1">
              * OT day: ทำครบทุก task แล้วไม่มี free time — Anki เสร็จ 22:00 พอดี
            </p>
          )}
        </section>

        <div className="h-px bg-gray-100 mb-16" />

        {/* Rules */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-8">Rules</p>
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-4 border border-gray-100 rounded-2xl px-6 py-5 hover:border-gray-200 transition-colors">
                <span className="text-[10px] text-gray-300 font-mono mt-0.5 flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                <p className="text-sm text-gray-500 leading-6">{rule}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
