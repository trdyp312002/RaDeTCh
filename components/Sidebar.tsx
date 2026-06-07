"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const wealthNavItems = [
  { href: "/", label: "Portal", emoji: "🌌" },
  { href: "/project-omnitech", label: "Project Omnitech", emoji: "🚀" },
  { href: "/claw-empire", label: "Claw Empire", emoji: "⚔️" },
  { href: "/finance", label: "Finance", emoji: "💰" },
]

const lifeNavItems = [
  { href: "/", label: "Portal", emoji: "🌌" },
  { href: "/health", label: "Health", emoji: "❤️" },
  { href: "/routine", label: "Routine", emoji: "📋" },
  { href: "/travel", label: "Travel", emoji: "✈️" },
  { href: "/music", label: "Music", emoji: "🎵" },
  { href: "/relationships", label: "Relationships", emoji: "🤝" },
]

type TravelPick = {
  spot: { name: string; region: string }
  category: "toyama" | "japan"
  weekKey: string
}

export default function Sidebar() {
  const path = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pick, setPick] = useState<TravelPick | null>(null)

  useEffect(() => {
    fetch("/api/travel/recommendation")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPick(d && d.spot ? d : null))
      .catch(() => setPick(null))
  }, [])

  const isWealthMode = path.startsWith("/project-omnitech") || path.startsWith("/claw-empire") || path.startsWith("/finance")
  const isPortal = path === "/"

  // Hide completely on the dual-portal home page
  if (isPortal) return null;

  const currentNavItems = isWealthMode ? wealthNavItems : lifeNavItems

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/")

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b z-50 px-6 md:px-12 flex items-center justify-between shadow-sm transition-colors ${
        isWealthMode ? "bg-[#050B14]/80 border-cyan-900/30 text-white" : "bg-white/80 border-gray-100/60"
      }`}>
        
        <Link href="/" className="block group shrink-0">
          <span className={`text-[9px] uppercase tracking-[0.5em] font-bold block leading-none mb-0.5 transition-colors ${isWealthMode ? "text-cyan-600 group-hover:text-cyan-400" : "text-gray-400 group-hover:text-gray-600"}`}>
            {isWealthMode ? "Wealth OS" : "Health OS"}
          </span>
          <span className={`text-lg font-black tracking-tight leading-none ${isWealthMode ? "text-white" : "text-gray-900"}`}>RaDeTCh</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5">
          {currentNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold tracking-tight transition-all duration-200 flex items-center gap-2 relative ${
                  active
                    ? (isWealthMode ? "bg-cyan-950/60 text-cyan-400 shadow-md border border-cyan-800/50" : "bg-gray-900 text-white shadow-md")
                    : (isWealthMode ? "text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/30" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80")
                }`}
              >
                <span className="leading-none">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {!isWealthMode && pick && (
            <Link 
              href="/travel" 
              className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[10px] xl:text-[11px] font-semibold text-amber-800 hover:shadow-sm transition-all"
            >
              <span>✈️ Pick:</span>
              <span className="truncate max-w-[100px] xl:max-w-[130px] font-extrabold text-amber-900">{pick.spot.name}</span>
            </Link>
          )}
          
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-1.5 rounded-xl transition-colors ${isWealthMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setMobileOpen(false)} 
          />
          
          <aside className={`md:hidden fixed right-0 top-16 bottom-0 w-64 z-50 border-l overflow-y-auto shadow-2xl p-5 flex flex-col justify-between animate-slideLeft ${isWealthMode ? "bg-[#0A111E] border-gray-800" : "bg-white border-gray-100"}`}>
            <div className="space-y-6">
              <div>
                <p className={`text-[9px] uppercase tracking-[0.4em] font-bold mb-3 ${isWealthMode ? "text-gray-600" : "text-gray-300"}`}>
                  Navigation
                </p>
                <ul className="space-y-1">
                  {currentNavItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            active
                              ? (isWealthMode ? "bg-cyan-950 text-cyan-400" : "bg-gray-900 text-white")
                              : (isWealthMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100")
                          }`}
                        >
                          <span className="text-base w-6 text-center leading-none shrink-0">{item.emoji}</span>
                          <span className="tracking-tight">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
