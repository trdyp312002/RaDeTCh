export default function RelationshipsPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase">Social & Connections</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-800 tracking-tight">
            Relationships
          </h1>
          <p className="text-stone-500 text-sm md:text-base">
            Keep track of important people, events, and milestones in your life.
          </p>
        </header>

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-16 shadow-xl shadow-stone-200/50 text-center">
          <p className="text-4xl mb-4">🤝</p>
          <h2 className="text-xl font-bold text-stone-800 mb-2">Coming Soon</h2>
          <p className="text-stone-500 max-w-md mx-auto">
            The relationship management module is currently under construction. You will be able to store notes, birthdays, and reminders here soon.
          </p>
        </div>
      </div>
    </div>
  )
}
