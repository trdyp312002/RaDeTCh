"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HealthMobileNav() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dash", icon: "dashboard" },
    { href: "/health", label: "Health", icon: "monitor_heart" },
    { href: "/routine", label: "Routine", icon: "task_alt" },
    { href: "/travel", label: "Travel", icon: "flight" },
  ];

  return (
    <>
      <div className="md:hidden w-full bg-[#FAF6F0] border-b border-[#E8E1D5] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#5A4F43] flex items-center justify-center text-white text-sm">
            🌿
          </div>
          <h1 className="text-xl font-medium tracking-tight text-[#1F1D1A]">Health OS</h1>
        </Link>
        <div className="w-8 h-8 rounded-full bg-[#E8E1D5] flex items-center justify-center">
          <span className="material-symbols-outlined text-sm text-[#5A4F43]">person</span>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E1D5] px-4 py-2 flex justify-between items-center z-50 pb-safe">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all ${
                isActive ? 'text-[#33302C] font-semibold' : 'text-[#8C837A]'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'bg-[#E8E1D5] px-4 py-1 rounded-full' : ''}`}>
                {link.icon}
              </span>
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
