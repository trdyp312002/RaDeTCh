import Link from "next/link";

export default function Portal() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-5 py-3 bg-[#FAF6F0] border-b border-[#E8E1D5]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#5A4F43] flex items-center justify-center text-white text-sm font-bold">R</div>
          <span className="text-base font-semibold text-[#1F1D1A] tracking-tight">RaDeTCh</span>
        </div>
        <span className="text-xs text-[#8C837A]">Choose workspace</span>
      </div>

      {/* Desktop divider label */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md text-gray-400 text-xs font-bold px-4 py-2 rounded-full border border-gray-200/20 shadow-2xl uppercase tracking-widest">
          Choose Workspace
        </div>
      </div>

      {/* Content: stacked on mobile, side-by-side on desktop */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* LEFT / TOP: Health OS */}
        <Link
          href="/health"
          prefetch={false}
          className="flex-1 relative group bg-[#FAF6F0] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 md:hover:flex-[1.2] active:scale-[0.98]"
          style={{ minHeight: "45vh" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 to-rose-100/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 text-center px-6">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-white rounded-full shadow-xl flex items-center justify-center text-3xl md:text-4xl mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500" style={{ boxShadow: "0 10px 40px rgba(147,51,234,0.12)" }}>
              🌿
            </div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-stone-400 mb-2">Sleep · Food · Fitness</p>
            <h2 className="text-3xl md:text-5xl font-black text-stone-800 tracking-tight">HEALTH OS</h2>
            <p className="mt-3 text-sm text-stone-400 md:hidden">Diary · Garmin · Routine · Books · Travel</p>
            <div className="mt-6 md:mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hidden md:flex gap-4 justify-center text-stone-400 text-sm">
              <span>Sleep</span> • <span>Nutrition</span> • <span>Exercise</span>
            </div>
          </div>
          {/* Mobile tap indicator */}
          <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-stone-400 font-medium">
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            Open Health OS
          </div>
        </Link>

        {/* Divider on mobile */}
        <div className="md:hidden h-px bg-[#E8E1D5]" />

        {/* RIGHT / BOTTOM: Wealth OS */}
        <Link
          href="/wealth-os/dashboard"
          prefetch={false}
          className="flex-1 relative group bg-[#050B14] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 md:hover:flex-[1.2] active:scale-[0.98]"
          style={{ minHeight: "45vh" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.2) 1px, transparent 1px)", backgroundSize: "100% 4px" }} />

          <div className="relative z-10 text-center px-6">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-cyan-950/50 border border-cyan-800/50 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-4 md:mb-6 group-hover:scale-110 transition-all duration-500"
              style={{ boxShadow: "0 0 30px rgba(0,255,255,0.15)" }}
            >
              🤖
            </div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-cyan-500/70 mb-2">Automated Trading Firm</p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight" style={{ filter: "drop-shadow(0 0 15px rgba(255,255,255,0.2))" }}>WEALTH OS</h2>
            <p className="mt-3 text-sm text-cyan-500/60 md:hidden font-mono">PORTFOLIO · TRADING · FINANCE</p>
            <div className="mt-6 md:mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hidden md:flex gap-4 justify-center text-cyan-600 text-sm font-mono">
              <span>TRADING</span> _ <span>FINANCE</span> _ <span>PORTFOLIO</span>
            </div>
          </div>
          {/* Mobile tap indicator */}
          <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs text-cyan-600 font-medium font-mono">
            <span className="material-symbols-outlined text-[16px]" style={{ color: "#2dd4bf" }}>arrow_forward</span>
            <span style={{ color: "#2dd4bf" }}>Open Wealth OS</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

