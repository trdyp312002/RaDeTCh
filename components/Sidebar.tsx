"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const navItems = [
  { href: "/",        label: "Home",    emoji: "🏠" },
  { href: "/finance", label: "Finance", emoji: "💰" },
  { href: "/routine", label: "Routine", emoji: "📋" },
  { href: "/menu",    label: "Food",    emoji: "🍜" },
  { href: "/travel",  label: "Travel",  emoji: "✈️" },
  { href: "/music",   label: "Music",   emoji: "🎵" },
  { href: "/books",   label: "Books",   emoji: "📚" },
  { href: "/health",  label: "Health",  emoji: "❤️" },
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

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/")

  return (
    <>
      {/* Premium Horizontal Header (Desktop) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100/60 z-50 px-6 md:px-12 flex items-center justify-between shadow-sm">
        
        {/* Brand Logo */}
        <Link href="/" className="block group shrink-0">
          <span className="text-[9px] uppercase tracking-[0.5em] text-gray-400 font-bold block leading-none mb-0.5 group-hover:text-gray-600 transition-colors">
            Personal OS
          </span>
          <span className="text-lg font-black text-gray-900 tracking-tight leading-none">RaDeTCh</span>
        </Link>

        {/* Center: Horizontal Navigation Link List */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold tracking-tight transition-all duration-200 flex items-center gap-2 relative ${
                  active
                    ? "bg-gray-900 text-white shadow-md shadow-black/10 scale-[1.02]"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                }`}
              >
                <span className="leading-none">{item.emoji}</span>
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Widget: Week's Pick or Profile Menu */}
        <div className="flex items-center gap-3">
          {pick && (
            <Link 
              href="/travel" 
              className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[10px] xl:text-[11px] font-semibold text-amber-800 hover:shadow-sm transition-all"
            >
              <span>✈️ Pick:</span>
              <span className="truncate max-w-[100px] xl:max-w-[130px] font-extrabold text-amber-900">{pick.spot.name}</span>
            </Link>
          )}
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-xl hover:bg-gray-100"
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

      {/* Mobile Drawer Navigation overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-xs z-40 transition-opacity duration-300" 
            onClick={() => setMobileOpen(false)} 
          />
          
          {/* Drawer Menu */}
          <aside className="md:hidden fixed right-0 top-16 bottom-0 w-64 bg-white z-50 border-l border-gray-100 overflow-y-auto shadow-2xl p-5 flex flex-col justify-between animate-slideLeft">
            <div className="space-y-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-bold mb-3">
                  Navigation
                </p>
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            active
                              ? "bg-gray-900 text-white shadow-md"
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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

              {pick && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-bold mb-3">
                    ✈️ Week&apos;s Pick
                  </p>
                  <Link href="/travel" onClick={() => setMobileOpen(false)} className="block group">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold inline-block mb-2 ${
                      pick.category === "toyama" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {pick.category === "toyama" ? "Toyama" : "Japan"}
                    </span>
                    <p className="text-xs font-bold text-gray-800 leading-tight group-hover:text-gray-600 transition-colors">
                      {pick.spot.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{pick.spot.region}</p>
                  </Link>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-[10px] text-gray-300 font-mono">
              <span>© {new Date().getFullYear()} RaDeTCh</span>
              <span>v1.0</span>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
