"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const navItems = [
  { href: "/",            label: "Home",             icon: "○" },
  { href: "/finance",     label: "Personal Finance", icon: "○" },
  { href: "/investments", label: "Investments",      icon: "○" },
  { href: "/menu",        label: "Food Menu",        icon: "○" },
  { href: "/routine",     label: "Routine",          icon: "○" },
  { href: "/travel",      label: "Travel",           icon: "○" },
  { href: "/music",       label: "Music",            icon: "○" },
]

type TravelPick = {
  spot: { name: string; region: string }
  category: "toyama" | "japan"
  weekKey: string
}

export default function Sidebar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<TravelPick | null>(null)

  useEffect(() => {
    fetch("/api/travel/recommendation")
      .then((r) => r.json())
      .then(setPick)
      .catch(() => null)
  }, [])

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/")

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8 px-6">
      <div className="mb-8">
        <Link href="/" onClick={() => setOpen(false)}>
          <span className="text-[11px] uppercase tracking-[0.4em] text-gray-400 block mb-1">Personal</span>
          <span className="text-lg font-bold text-gray-900 tracking-tight">RaDeTCh</span>
        </Link>
      </div>

      <nav className="flex-1">
        <div className="relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100" />
          <ul className="space-y-1">
            {navItems.map((item, i) => {
              const active = isActive(item.href)
              const isLast = i === navItems.length - 1
              return (
                <li key={item.href} className="relative">
                  <div className="absolute -left-4 top-1/2 w-4 border-t border-gray-100" />
                  {isLast && (
                    <div className="absolute -left-[17px] top-1/2 bottom-0 w-px bg-white" />
                  )}
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`text-[8px] ${active ? "text-white" : "text-gray-300"}`}>
                      {active ? "●" : "○"}
                    </span>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 mb-3">Week&apos;s Pick</p>
        {pick ? (
          <Link href="/travel" onClick={() => setOpen(false)}>
            <div className="rounded-xl border border-gray-100 p-3 hover:border-gray-200 transition-colors">
              <span className={`text-[8px] px-2 py-0.5 rounded-full font-medium inline-block mb-2 ${
                pick.category === "toyama" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
              }`}>
                {pick.category === "toyama" ? "Toyama" : "Japan"}
              </span>
              <p className="text-[11px] font-medium text-gray-700 leading-tight">{pick.spot.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{pick.spot.region}</p>
              <p className="text-[9px] text-gray-300 mt-1 font-mono">{pick.weekKey}</p>
            </div>
          </Link>
        ) : (
          <Link href="/travel" onClick={() => setOpen(false)} className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
            See travel picks →
          </Link>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-[10px] text-gray-200">© {new Date().getFullYear()} RaDeTCh</p>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-100 z-40">
        <SidebarContent />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-5">
        <Link href="/" className="font-bold text-gray-900 text-sm tracking-tight">RaDeTCh</Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
          <aside className="md:hidden fixed left-0 top-14 bottom-0 w-64 bg-white z-50 border-r border-gray-100 overflow-y-auto">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
