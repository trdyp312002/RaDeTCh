"use client"
import { useState, useEffect, useCallback } from "react"

type Entry = {
  id: string
  date: string
  morning: string
  afternoon: string
  evening: string
}

const TODAY = new Date().toLocaleDateString("en-CA")

export default function DailyPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(TODAY)
  const [morning, setMorning] = useState("")
  const [afternoon, setAfternoon] = useState("")
  const [evening, setEvening] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/daily")
      if (res.ok) {
        const data = await res.json()
        const sorted = (data.entries as Entry[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setEntries(sorted)
        
        const todayEntry = sorted.find((e) => e.date === TODAY)
        if (todayEntry) {
          setMorning(todayEntry.morning)
          setAfternoon(todayEntry.afternoon)
          setEvening(todayEntry.evening)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  // Helper to change date from our custom calendar
  function selectDate(dateStr: string) {
    setSelectedDate(dateStr)
    const entry = entries.find((en) => en.date === dateStr)
    setMorning(entry?.morning ?? "")
    setAfternoon(entry?.afternoon ?? "")
    setEvening(entry?.evening ?? "")
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, morning, afternoon, evening }),
      })
      await loadEntries()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // --- Calendar logic (simplified for current month based on selectedDate) ---
  const currentSelectedDateObj = new Date(selectedDate);
  const currentMonth = currentSelectedDateObj.getMonth();
  const currentYear = currentSelectedDateObj.getFullYear();
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null); // empty padding
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  return (
    <div className="min-h-screen flex bg-white text-[#33302C] font-sans selection:bg-[#FDECA6] selection:text-[#33302C]">
      <main className="flex-1 p-6 md:p-12 transition-all duration-300 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        {/* Left Column: Timeline & Editor */}
        <section className="col-span-1 lg:col-span-8 flex flex-col">
          <header className="mb-10 border-b border-[#E8E1D5] pb-6 flex justify-between items-end">
            <h1 className="text-3xl md:text-4xl font-serif text-[#1F1D1A] tracking-tight">Health OS Daily Diary</h1>
            {/* Mobile Date indicator */}
            <div className="lg:hidden text-sm font-medium text-[#8C837A] bg-[#F9F9F9] px-3 py-1 rounded-full border border-[#E8E1D5]">
              {selectedDate}
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="text-[#8C837A]">Loading diary...</span>
            </div>
          ) : (
            <div className="relative pl-6 md:pl-8 space-y-10">
              {/* Timeline Line */}
              <div className="absolute left-[11px] md:left-[11px] top-8 bottom-8 w-[2px] bg-[#E8E1D5] -z-10" />

              {/* Morning Entry */}
              <div className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-6 md:-left-8 top-6 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#FDECA6] border-4 border-white shadow-sm" />
                
                <div className="bg-[#FDECA6]/80 rounded-3xl p-6 md:p-8 shadow-sm border border-[#F5E18D]/50 transition-all focus-within:shadow-md">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2">
                    <h3 className="text-xl md:text-2xl font-medium text-[#5C5020] flex items-center gap-2">
                      Morning Breath ☀️ 🙂 🥱 ☕
                    </h3>
                    <span className="text-[#8B7D41] text-xs font-medium">12:47 AM</span>
                  </div>
                  <textarea 
                    value={morning}
                    onChange={(e) => setMorning(e.target.value)}
                    placeholder="What are your intentions for the day? Write freely..."
                    className="w-full bg-transparent border-none p-0 min-h-[100px] focus:ring-0 resize-y text-[#4A4016] placeholder:text-[#A1945D] placeholder:font-medium text-base outline-none"
                    style={{ lineHeight: "2.5rem", backgroundImage: "linear-gradient(transparent, transparent calc(2.5rem - 1px), #E6D28A 0px)", backgroundSize: "100% 2.5rem" }}
                  />
                  <div className="flex justify-end mt-4">
                    <button onClick={handleSave} disabled={saving} className="bg-white/80 hover:bg-white text-[#5C5020] px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors border border-[#F5E18D]">
                      {saving ? "Saving..." : "Save Entry"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Afternoon Entry */}
              <div className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-6 md:-left-8 top-6 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#C6EBC5] border-4 border-white shadow-sm" />
                
                <div className="bg-[#C6EBC5]/80 rounded-3xl p-6 md:p-8 shadow-sm border border-[#A9DBA8]/50 transition-all focus-within:shadow-md">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2">
                    <h3 className="text-xl md:text-2xl font-medium text-[#305C30] flex items-center gap-2">
                      Midday Check-in ☁️ 😐 🧐 💧
                    </h3>
                    <span className="text-[#4E824E] text-xs font-medium">12:50 PM</span>
                  </div>
                  <textarea 
                    value={afternoon}
                    onChange={(e) => setAfternoon(e.target.value)}
                    placeholder="How are you feeling right now? Briefly pause..."
                    className="w-full bg-transparent border-none p-0 min-h-[100px] focus:ring-0 resize-y text-[#224522] placeholder:text-[#679E67] placeholder:font-medium text-base outline-none"
                    style={{ lineHeight: "2.5rem", backgroundImage: "linear-gradient(transparent, transparent calc(2.5rem - 1px), #A9D1A9 0px)", backgroundSize: "100% 2.5rem" }}
                  />
                  <div className="flex justify-end mt-4">
                    <button onClick={handleSave} disabled={saving} className="bg-white/80 hover:bg-white text-[#305C30] px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors border border-[#A9DBA8]">
                      {saving ? "Saving..." : "Save Entry"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Evening Entry */}
              <div className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-6 md:-left-8 top-6 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#C4DAFA] border-4 border-white shadow-sm" />
                
                <div className="bg-[#C4DAFA]/80 rounded-3xl p-6 md:p-8 shadow-sm border border-[#A5C6F7]/50 transition-all focus-within:shadow-md">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2">
                    <h3 className="text-xl md:text-2xl font-medium text-[#2C4976] flex items-center gap-2">
                      Evening Reflection 🌙 😌 😌 📚
                    </h3>
                    <span className="text-[#4C71AA] text-xs font-medium">12:53 PM</span>
                  </div>
                  <textarea 
                    value={evening}
                    onChange={(e) => setEvening(e.target.value)}
                    placeholder="What are you grateful for today? Reflect..."
                    className="w-full bg-transparent border-none p-0 min-h-[100px] focus:ring-0 resize-y text-[#1E3456] placeholder:text-[#7297CE] placeholder:font-medium text-base outline-none"
                    style={{ lineHeight: "2.5rem", backgroundImage: "linear-gradient(transparent, transparent calc(2.5rem - 1px), #9CBDEB 0px)", backgroundSize: "100% 2.5rem" }}
                  />
                  <div className="flex justify-end mt-4">
                    <button onClick={handleSave} disabled={saving} className="bg-white/80 hover:bg-white text-[#2C4976] px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors border border-[#A5C6F7]">
                      {saving ? "Saving..." : "Save Entry"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* Right Column: Widgets / Sidebar */}
        <section className="col-span-1 lg:col-span-4 bg-[#F9F9F9] rounded-[2rem] p-8 shadow-sm border border-[#E8E1D5]/50 flex flex-col h-fit">
          
          {/* Calendar Widget */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-[#1F1D1A]">{monthNames[currentMonth]} {currentYear}</h3>
              <div className="flex gap-4 text-[#8C837A] select-none">
                <span className="material-symbols-outlined text-sm cursor-pointer hover:text-black transition-colors" onClick={() => {
                   const d = new Date(currentYear, currentMonth - 1, 1);
                   selectDate(d.toLocaleDateString("en-CA"));
                }}>arrow_back_ios</span>
                <span className="material-symbols-outlined text-sm cursor-pointer hover:text-black transition-colors" onClick={() => {
                   const d = new Date(currentYear, currentMonth + 1, 1);
                   selectDate(d.toLocaleDateString("en-CA"));
                }}>arrow_forward_ios</span>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-[#8C837A] text-xs font-medium">{day}</div>
              ))}
              
              {days.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;
                
                // Form date string to match YYYY-MM-DD
                const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dStr === selectedDate;
                
                return (
                  <div 
                    key={day} 
                    onClick={() => selectDate(dStr)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full mx-auto cursor-pointer transition-colors ${
                      isSelected 
                        ? "bg-[#C4DAFA] text-[#2C4976] font-bold shadow-sm ring-4 ring-[#E6F0FA]" 
                        : "text-[#33302C] hover:bg-[#E8E1D5]"
                    }`}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="w-full h-px bg-[#E8E1D5] mb-10" />

          {/* Weekly Insights */}
          <div className="mb-10">
            <h3 className="text-xl font-medium text-[#1F1D1A] mb-3">Weekly Insights</h3>
            <p className="text-[#8C837A] text-sm leading-relaxed">
              Weekly Insights for all your next, weekly plans and preparations. Take a moment to review your recent entries.
            </p>
          </div>

          <div className="w-full h-px bg-[#E8E1D5] mb-10" />

          {/* Monthly Goals */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-medium text-[#1F1D1A]">Monthly Goals</h3>
              <div className="w-16 h-2 bg-[#E8E1D5] rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-[#A5C6F7] rounded-full" />
              </div>
            </div>
            <p className="text-[#8C837A] text-sm leading-relaxed">
              Add your monthly goals...
            </p>
          </div>

        </section>

      </main>
    </div>
  )
}
