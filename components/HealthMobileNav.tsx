"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Dash",    icon: "dashboard" },
  { href: "/health",    label: "Health",  icon: "monitor_heart" },
  { href: "/health/closet", label: "Closet", icon: "checkroom" },
  { href: "/daily",     label: "Diary",   icon: "book_4" },
  { href: "/routine",   label: "Routine", icon: "task_alt" },
];

export default function HealthMobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top header bar */}
      <div className="md:hidden w-full bg-[#FAF6F0] border-b border-[#E8E1D5] px-5 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#5A4F43] flex items-center justify-center text-white text-sm font-bold">
            R
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-[#1F1D1A]">Health OS</h1>
        </Link>
        <Link href="/wealth-os/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-[#5A4F43] border border-[#D5CCBE] rounded-full px-3 py-1.5 hover:bg-[#F2ECE4] transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">currency_exchange</span>
          Wealth
        </Link>
      </div>

      {/* Bottom navigation bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E1D5] flex justify-around items-center z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", paddingTop: "8px", paddingLeft: "4px", paddingRight: "4px" }}
      >
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[52px]"
            >
              <div className={`flex items-center justify-center transition-all ${
                isActive
                  ? "bg-[#E8E1D5] px-3 h-7 rounded-full"
                  : "h-7 px-1"
              }`}>
                <span className={`material-symbols-outlined ${
                  isActive ? "text-[22px] text-[#33302C]" : "text-[22px] text-[#8C837A]"
                }`}>
                  {link.icon}
                </span>
              </div>
              <span className={`text-[10px] font-medium ${
                isActive ? "text-[#33302C]" : "text-[#8C837A]"
              }`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
