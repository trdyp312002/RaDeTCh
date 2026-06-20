import Link from "next/link";

export default function Portal() {
  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden absolute inset-0 z-[100]">
      
      {/* LEFT: Health OS */}
      <Link
        href="/health"
        className="flex-1 relative group bg-[#FAF6F0] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 hover:flex-[1.2]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 to-rose-100/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="relative z-10 text-center transform group-hover:-translate-y-4 transition-transform duration-500">
          <div className="w-24 h-24 mx-auto bg-white rounded-full shadow-xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500 shadow-purple-200/50">
            ❤️
          </div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-stone-400 mb-2">Sleep · Food · Fitness</p>
          <h2 className="text-4xl md:text-5xl font-black text-stone-800 tracking-tight">HEALTH OS</h2>
          <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 flex gap-4 justify-center text-stone-400 text-sm">
            <span>Sleep</span> • <span>Nutrition</span> • <span>Exercise</span>
          </div>
        </div>
      </Link>

      {/* CENTER DIVIDER (Visual) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md text-gray-400 text-xs font-bold px-4 py-2 rounded-full border border-gray-200/20 shadow-2xl uppercase tracking-widest">
          Choose Workspace
        </div>
      </div>

      {/* RIGHT: Wealth OS */}
      <Link 
        href="/wealth-os/dashboard" 
        className="flex-1 relative group bg-[#050B14] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 hover:flex-[1.2]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '100% 4px' }}></div>
        
        <div className="relative z-10 text-center transform group-hover:-translate-y-4 transition-transform duration-500">
          <div className="w-24 h-24 mx-auto bg-cyan-950/50 border border-cyan-800/50 rounded-full shadow-[0_0_30px_rgba(0,255,255,0.15)] flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(0,255,255,0.3)] transition-all duration-500">
            🤖
          </div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-cyan-500/70 mb-2">Automated Trading Firm</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">WEALTH OS</h2>
          <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 flex gap-4 justify-center text-cyan-600 text-sm font-mono">
            <span>TRADING</span> _ <span>FINANCE</span> _ <span>PORTFOLIO</span>
          </div>
        </div>
      </Link>

    </div>
  );
}
