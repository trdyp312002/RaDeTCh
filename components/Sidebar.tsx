"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const lifeNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/health", label: "Health & Sleep", icon: "bedtime" },
  { href: "/books", label: "Books", icon: "menu_book" },
  { href: "/routine", label: "Routine", icon: "event_repeat" },
  { href: "/music", label: "Music", icon: "library_music" },
  { href: "/relationships", label: "Relationships", icon: "favorite" },
  { href: "/daily", label: "Diary", icon: "book" },
  { href: "/travel", label: "Travel", icon: "flight" },
]

export default function Sidebar() {
  const path = usePathname()

  const isWealthMode = path.startsWith("/wealth-dashboard") || path.startsWith("/portfolio") || path.startsWith("/wealth") || path.startsWith("/ai-terminal")
  const isPortal = path === "/"

  // Wealth pages have their own layout (app/(wealth)/layout.tsx), so hide the global Sidebar there
  if (isPortal || isWealthMode) return null;

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(href + "/")

  return (
    <>
      {/* Material Symbols */ }
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* SideNavBar (Web Only) */}
      <nav className="hidden md:flex flex-col p-6 gap-stack-md bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.03)] fixed left-0 top-0 h-screen w-64 z-50">
        {/* Header */}
        <Link href="/" className="flex items-center gap-4 mb-4 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-on-primary-container">spa</span>
          </div>
          <div>
            <h1 className="font-title-md text-title-md text-primary">Health OS</h1>
            <p className="font-label-sm text-label-sm text-secondary">Stay Healthy</p>
          </div>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex flex-col gap-2 flex-grow">
          {lifeNavItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active 
                  ? "flex items-center gap-3 px-4 py-3 bg-primary-container/20 text-on-primary-container rounded-xl font-bold cursor-pointer active:scale-[0.98] transition-transform duration-200"
                  : "flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low rounded-xl cursor-pointer active:scale-[0.98] transition-all duration-300"
                }
              >
                <span className="material-symbols-outlined" style={active ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
                <span className="font-body-md text-body-md">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        {/* CTA Button */}
        <button className="mt-auto w-full py-3 bg-primary text-on-primary rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Entry
        </button>
      </nav>

      {/* Bottom Nav Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-outline-variant/20 flex justify-around items-center h-16 z-50 px-2 pb-[env(safe-area-inset-bottom)]">
        {lifeNavItems.slice(0, 2).map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "flex flex-col items-center justify-center w-full h-full text-primary" : "flex flex-col items-center justify-center w-full h-full text-secondary hover:text-on-surface transition-colors"}>
              <span className="material-symbols-outlined" style={active ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
              <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
        
        <div className="relative -top-5">
          <button className="w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        
        {lifeNavItems.slice(2, 4).map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "flex flex-col items-center justify-center w-full h-full text-primary" : "flex flex-col items-center justify-center w-full h-full text-secondary hover:text-on-surface transition-colors"}>
              <span className="material-symbols-outlined" style={active ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  );
}
