"use client"

import { useEffect, useState } from "react"

export type HealthLog = {
  id: string
  date: string
  weight: number | null
  bmi: number | null
  body_fat: number | null
  sleep_hours: number | null
  sleep_score: number | null
  steps: number | null
  resting_heart_rate: number | null
  calories_in: number | null
  calories_out: number | null
  notes: string
}
type Entry = {
  id: string
  entry_date: string
  type: string
  title: string
  details: string
  benefits: string
  bedtime?: string
  wake_time?: string
}

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })
const icon: Record<string, string> = { workout: "🏋️", meal: "🥗", sleep: "🌙" }

function NutritionGuide() {
  return (
    <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-[.16em] text-emerald-700">NUTRITION GUIDE</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">โภชนาการเพื่อฟื้นฟูกล้ามเนื้อ</h2>
        </div>
        <p className="text-sm text-emerald-800">เน้นมื้อเช้า · ลดคาร์โบไฮเดรตมื้อเย็น</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <article className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-yellow-700">🍌 ก่อนออกกำลังกาย</p>
          <p className="mt-2 text-sm text-slate-700">กล้วย 1 ลูก เพื่อเติมพลังงานเบา ๆ ก่อนเริ่มออกกำลังกาย</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-amber-700">🌅 มื้อเช้า · หลังออกกำลังกาย</p>
          <p className="mt-2 text-sm text-slate-700">คาร์โบไฮเดรตเชิงซ้อนคู่กับโปรตีนสูง เพื่อเติมพลังงานและซ่อมแซมกล้ามเนื้อ</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>• ข้าวกล้อง 150 กรัม</li>
            <li>• ไข่ต้ม 2 ฟอง</li>
            <li>• เนื้อสัตว์ 150 กรัม</li>
            <li>• เชคโปรตีน 1 สกูป</li>
          </ul>
        </article>
        <article className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-sky-700">☀️ มื้อกลางวัน</p>
          <p className="mt-2 text-sm text-slate-600">ยังไม่ได้กำหนดเมนู — บันทึกมื้อที่ทานจริงด้านล่างได้เลย</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">🌙 มื้อเย็น · คาร์บต่ำ</p>
          <p className="mt-2 text-sm text-slate-700">เน้นย่อยง่าย ไม่แน่นท้องเกินไปก่อนนอน</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>• ปลา หรือไก่ย่าง/ต้ม 200 กรัม</li>
            <li>• ผักใบเขียว 50 กรัม</li>
            <li>• เลือกเนื้อสัตว์ที่สุกและสะอาด</li>
          </ul>
        </article>
      </div>
    </section>
  )
}

export default function HealthDashboard({ logs: _logs = [] }: { logs?: HealthLog[] }) {
  const [rows, setRows] = useState<Entry[]>([])
  const [type, setType] = useState("workout")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [benefits, setBenefits] = useState("")
  const [date, setDate] = useState(today())
  const [bed, setBed] = useState("23:00")
  const [wake, setWake] = useState("07:00")

  const load = async () => {
    const response = await fetch("/api/health-journal")
    if (response.ok) setRows((await response.json()).entries)
  }

  useEffect(() => { void load() }, [])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch("/api/health-journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, details, benefits, entry_date: date, bedtime: type === "sleep" ? bed : null, wake_time: type === "sleep" ? wake : null }),
    })
    if (response.ok) {
      setTitle("")
      setDetails("")
      setBenefits("")
      void load()
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold tracking-[.18em] text-emerald-600">HEALTH JOURNAL</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">สุขภาพของวันนี้</h1>
        <p className="mt-2 text-slate-500">บันทึกเวท อาหาร และการนอน — เป้าหมายคือ 7–9 ชั่วโมงต่อคืน และตื่นเวลาเดิมให้สม่ำเสมอ</p>
        <NutritionGuide />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={save} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">เพิ่มบันทึก</h2>
            <div className="mt-4 flex gap-2">{["workout", "meal", "sleep"].map((item) => <button type="button" key={item} onClick={() => setType(item)} className={`rounded-full px-3 py-2 ${type === item ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>{icon[item]} {item === "workout" ? "เวท" : item === "meal" ? "อาหาร" : "นอน"}</button>)}</div>
            <input type="date" className="mt-4 w-full rounded-lg border p-2" value={date} onChange={(event) => setDate(event.target.value)} />
            <input required className="mt-3 w-full rounded-lg border p-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "workout" ? "เช่น Squat 4 เซ็ต" : type === "meal" ? "เช่น ข้าวไก่ย่าง + ผัก" : "เช่น หลับง่าย ตื่นสดชื่น"} />
            {type === "sleep" && <div className="mt-3 grid grid-cols-2 gap-2"><input type="time" className="rounded-lg border p-2" value={bed} onChange={(event) => setBed(event.target.value)} /><input type="time" className="rounded-lg border p-2" value={wake} onChange={(event) => setWake(event.target.value)} /></div>}
            <textarea className="mt-3 w-full rounded-lg border p-2" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="รายละเอียด เช่น น้ำหนัก/เซ็ต หรือสิ่งที่กิน" />
            <textarea className="mt-3 w-full rounded-lg border p-2" value={benefits} onChange={(event) => setBenefits(event.target.value)} placeholder="ประโยชน์ เช่น โปรตีนสูง, ฝึกกล้ามเนื้อขา" />
            <button className="mt-4 w-full rounded-lg bg-emerald-600 p-3 font-bold text-white">บันทึก</button>
          </form>
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">ประวัติ</h2>
            <div className="mt-4 space-y-3">{rows.length ? rows.map((entry) => <article className="rounded-xl border p-4" key={entry.id}><div className="flex justify-between"><b>{icon[entry.type]} {entry.title}</b><span className="text-sm text-slate-400">{entry.entry_date}</span></div>{entry.details && <p className="mt-1 text-sm text-slate-600">{entry.details}</p>}{entry.benefits && <p className="mt-2 text-sm text-emerald-700">ประโยชน์: {entry.benefits}</p>}{entry.type === "sleep" && <p className="mt-2 text-sm text-indigo-600">{entry.bedtime} → {entry.wake_time}</p>}</article>) : <p className="text-slate-400">ยังไม่มีบันทึก</p>}</div>
          </section>
        </div>
      </div>
    </main>
  )
}