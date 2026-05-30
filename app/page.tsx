import Link from "next/link"

type Section = {
  href: string
  emoji: string
  tag: string
  title: string
  desc: string
  stats: { label: string; value: string }[]
  color: string
}

const sections: Section[] = [
  {
    href: "/finance",
    emoji: "📊",
    tag: "Finance",
    title: "Personal Finance",
    desc: "Tracks holdings, transactions, and net worth across Long-term, Short-term, BTC, Store of Wealth, and Personal Financial Statement. Updated via the Discord slip-scanner bot.",
    stats: [
      { label: "Source", value: "Turso DB" },
      { label: "Sync", value: "Discord Bot" },
    ],
    color: "from-indigo-50 to-blue-50",
  },
  {
    href: "/menu",
    emoji: "🍽️",
    tag: "Food",
    title: "Food Menu",
    desc: "A searchable recipe database across Thai, Japanese, Korean, Chinese, and Italian cuisines with full ingredient lists and cooking steps.",
    stats: [
      { label: "Cuisines", value: "5+" },
      { label: "Recipes", value: "24+" },
    ],
    color: "from-orange-50 to-amber-50",
  },
  {
    href: "/music",
    emoji: "🎵",
    tag: "Music",
    title: "Playlist",
    desc: "Personal playlist of 1,125 songs grouped by language (Japanese, Korean, Thai, Others) and artist — linked directly to YouTube Music.",
    stats: [
      { label: "Songs", value: "1,125" },
      { label: "Artists", value: "676+" },
    ],
    color: "from-purple-50 to-violet-50",
  },
  {
    href: "/travel",
    emoji: "✈️",
    tag: "Travel",
    title: "Travel",
    desc: "Weekly travel recommendation system — Toyama and Japan-wide destinations with visit tracking.",
    stats: [
      { label: "System", value: "Weekly Pick" },
      { label: "Region", value: "JP + World" },
    ],
    color: "from-blue-50 to-sky-50",
  },
  {
    href: "/routine",
    emoji: "⏰",
    tag: "Daily",
    title: "Routine",
    desc: "Daily priority system — sleep first, then everything else. With task tracker, schedule reference, and OT mode.",
    stats: [
      { label: "Sleep", value: "22:30" },
      { label: "Anki", value: "Daily" },
    ],
    color: "from-slate-50 to-gray-100",
  },
]

const quickLinks = [
  { href: "/finance", label: "Personal Finance" },
  { href: "/menu", label: "Food Menu" },
  { href: "/music", label: "Music" },
  { href: "/travel", label: "Travel" },
  { href: "/routine", label: "Routine" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-10 pb-12 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-3">Personal</p>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">RaDeTCh</h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md">
            Teeradet Yodphom — Machine Assembly Intern, Toyama JP.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-5">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group block">
            <div className="rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="grid grid-cols-1 md:grid-cols-4">
                <div className={`bg-gradient-to-br ${s.color} p-10 flex items-center justify-center text-6xl md:col-span-1`}>
                  {s.emoji}
                </div>
                <div className="p-8 md:col-span-3 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-2">{s.tag}</p>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">{s.title}</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{s.desc}</p>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex gap-6">
                      {s.stats.map((st) => (
                        <div key={st.label}>
                          <p className="text-sm font-semibold text-gray-900">{st.value}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{st.label}</p>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-gray-700 transition-colors flex items-center gap-1">
                      Explore <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="max-w-4xl mx-auto px-6 pb-12">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-6">Snapshot</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "言", label: "Targeting N2", sub: "Japanese" },
            { icon: "₿", label: "BTC + US Stocks", sub: "Investing" },
            { icon: "📷", label: "Sony + Piano", sub: "Creative" },
            { icon: "🔌", label: "Safety Inspector", sub: "Global Compliant" },
          ].map((item) => (
            <div key={item.label} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors text-center">
              <div className="text-2xl mb-2 font-mono">{item.icon}</div>
              <p className="text-xs font-medium text-gray-700 mb-0.5">{item.label}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="border-t border-gray-100 pt-8 flex items-center gap-6 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.4em] text-gray-300">Quick Links</span>
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
