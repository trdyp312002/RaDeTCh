"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HealthSidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/health", label: "Health", icon: "monitor_heart" },
    { href: "/routine", label: "Routine", icon: "task_alt" },
    { href: "/daily", label: "Diary", icon: "book_4" },
    { href: "/books", label: "Books", icon: "menu_book" },
    { href: "/music", label: "Music", icon: "headphones" },
    { href: "/relationships", label: "Relations", icon: "diversity_1" },
    { href: "/travel", label: "Travel", icon: "flight" },
  ];

  return (
    <aside className="w-64 bg-[#FAF6F0] border-r border-[#E8E1D5] hidden md:flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-md bg-[#5A4F43] flex items-center justify-center text-white text-sm">
            🌿
          </div>
          <h1 className="text-xl font-medium tracking-tight text-[#1F1D1A]">Health OS</h1>
        </Link>

        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                    ? 'bg-[#E8E1D5] text-[#33302C] shadow-sm' 
                    : 'text-[#8C837A] hover:bg-[#F2ECE4] hover:text-[#33302C]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-[#E8E1D5]">
        <div className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[#F2ECE4] rounded-xl transition-colors">
           <div className="w-8 h-8 rounded-full bg-[#D5CCBE] flex items-center justify-center">
             <span className="material-symbols-outlined text-sm text-[#5A4F43]">person</span>
           </div>
           <span className="text-sm font-medium text-[#8C837A]">Profile</span>
        </div>
      </div>
    </aside>
  );
}
