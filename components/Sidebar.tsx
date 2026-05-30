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
]

type TravelPick = {
  spot: { name: string; region: string }
  category: "toyama" | "japan"
  weekKey: string
}

export default function Sidebar() {
  const path = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [pick, setPick] = useState<TravelPick | null>(null)

  useEffect(() => {
    fetch("/api/travel/recommendation")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPick(d && d.spot ? d : null))
      .catch(() => setPick(null))
  }, [])

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/")

  const SidebarContent = ({ mini = false }: { mini?: boolean }) => (
    <div className={`flex flex-col h-full transition-all duration-300 ${mini ? "items-center" : ""}`}>

      {/* Logo + Toggle Button */}
      <div className={`pt-7 pb-5 flex items-center ${mini ? "flex-col gap-4 px-0 w-full" : "px-5 justify-between"}`}>
        {!mini && (
          <Link href="/" className="block group">
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-semibold block mb-0.5 group-hover:text-gray-600 transition-colors">
              Personal OS
            </span>
            <span className="text-xl font-black text-gray-900 tracking-tight">RaDeTCh</span>
          </Link>
        )}
        {mini && (
          <Link href="/" className="text-xl font-black text-gray-900">R</Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 ${mini ? "" : ""}`}
        >
          <svg
            width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"
            viewBox="0 0 24 24"
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nav Items */}
      <nav className={`flex-1 ${mini ? "w-full px-2" : "px-3"}`}>
        {!mini && (
          <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-semibold px-3 mb-2">
            Navigation
          </p>
        )}
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 group relative
                    ${mini ? "justify-center w-full py-2.5" : "gap-3 px-3 py-2.5"}
                    ${active
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  <span className="text-base w-6 text-center leading-none shrink-0">
                    {item.emoji}
                  </span>

                  {/* Label — only show when expanded */}
                  {!mini && (
                    <span className="tracking-tight">{item.label}</span>
                  )}
                  {!mini && active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}

                  {/* Tooltip when collapsed */}
                  {mini && (
                    <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold whitespace-nowrap
                      opacity-0 pointer-events-none group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
                      transition-all duration-200 shadow-xl z-50">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Week's Pick — only when expanded */}
      {!mini && (
        <div className="mx-3 mb-4 mt-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-semibold mb-3">
              ✈️ Week&apos;s Pick
            </p>
            {pick ? (
              <Link href="/travel" className="block group">
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold inline-block mb-2 ${
                  pick.category === "toyama" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                }`}>
                  {pick.category === "toyama" ? "Toyama" : "Japan"}
                </span>
                <p className="text-xs font-semibold text-gray-800 leading-tight group-hover:text-gray-600 transition-colors">
                  {pick.spot.name}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{pick.spot.region}</p>
                <p className="text-[9px] text-gray-300 mt-1.5 font-mono">{pick.weekKey}</p>
              </Link>
            ) : (
              <Link href="/travel" className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                See travel picks →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {!mini && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-300 font-mono">© {new Date().getFullYear()} RaDeTCh</p>
        </div>
      )}
      {mini && <div className="pb-6" />}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-40 shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? "w-[64px]" : "w-[220px]"
        }`}
      >
        <SidebarContent mini={collapsed} />
      </aside>

      {/* Spacer so content doesn't go under sidebar */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ${collapsed ? "w-[64px]" : "w-[220px]"}`} />

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-5">
        <Link href="/" className="font-black text-gray-900 text-sm tracking-tight">RaDeTCh</Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-14 bottom-0 w-64 bg-white z-50 border-r border-gray-100 overflow-y-auto shadow-xl">
            <SidebarContent mini={false} />
          </aside>
        </>
      )}
    </>
  )
}
