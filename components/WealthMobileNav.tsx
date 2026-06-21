"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Briefcase, Scale, Cpu, Home } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/wealth-os/dashboard", label: "Dashboard", Icon: BarChart2 },
  { href: "/wealth-os/portfolio", label: "Portfolio", Icon: Briefcase },
  { href: "/wealth-os/balance-sheet", label: "Balance", Icon: Scale },
  { href: "/project-omnitech", label: "OmniTrade", Icon: Cpu },
];

export default function WealthMobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top header */}
      <header className="md:hidden flex items-center justify-between px-5 py-3 sticky top-0 z-50"
        style={{ background: "rgba(10,15,26,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <span style={{ color: "#3b82f6", fontSize: "1.4rem", fontWeight: 700, fontStyle: "italic" }}>W</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Wealth</span>
          <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "1rem" }}>OS</span>
        </Link>
        <div style={{
          padding: "3px 10px", borderRadius: 20,
          background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)",
          color: "#2dd4bf", fontSize: "0.72rem", fontWeight: 600,
        }}>
          LIVE
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center"
        style={{
          background: "rgba(10,15,26,0.95)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingTop: "10px",
          paddingLeft: "4px",
          paddingRight: "4px",
        }}
      >
        {navLinks.map(({ href, label, Icon }) => {
          const isActive =
            href === "/"
              ? false
              : href === "/wealth-os/dashboard"
              ? pathname === "/wealth-os/dashboard"
              : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: "none" }}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl min-w-[56px] transition-all"
            >
              <div style={{
                width: isActive ? 40 : 28, height: 28,
                borderRadius: 14,
                background: isActive ? "rgba(45,212,191,0.15)" : "transparent",
                border: isActive ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                <Icon size={16} color={isActive ? "#2dd4bf" : "#475569"} />
              </div>
              <span style={{
                fontSize: 10,
                color: isActive ? "#2dd4bf" : "#475569",
                fontFamily: "Inter, sans-serif",
                fontWeight: isActive ? 600 : 400,
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
