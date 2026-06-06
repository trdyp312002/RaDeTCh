import Link from 'next/link'
import { readMarkdown } from '@/lib/markdown'
import PixelDashboard from './agents/page'
import LiveStatus from '@/components/LiveStatus'

export default function Home() {
  const metrics = readMarkdown('dashboard', 'metrics').meta as {
    totalPnL: string
    totalPnLPercent: string
    winRate: string
    systemUptime: string
    totalTrades: number
    botStatus: string
    activeStrategies: number
  }

  const isOnline = metrics.botStatus === 'ONLINE'

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans selection:bg-cyan-500/30 pb-20">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-cyan-900/30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-10 w-10">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-20 ${isOnline ? 'bg-cyan-400' : 'bg-red-500'}`}></span>
              <div className={`relative inline-flex rounded-full h-10 w-10 border-2 items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.2)] ${isOnline ? 'border-cyan-500 bg-cyan-950/50 text-cyan-400' : 'border-red-500 bg-red-950/50 text-red-400'}`}>
                <span className="text-lg">🤖</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">OMNITRADE <span className="text-cyan-500">AI</span></h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/70 font-semibold">Autonomous Quantitative Trading Firm</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 mr-6 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Link href="/finance" className="hover:text-cyan-400 transition-colors">Portfolio</Link>
              <span className="text-cyan-400 border-b border-cyan-400 pb-1">Command Center</span>
              <Link href="/omnitrade/quest" className="hover:text-cyan-400 transition-colors">Logs</Link>
            </div>
            <div className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${isOnline ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' : 'bg-rose-950/30 border-rose-500/30 text-rose-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              {metrics.botStatus}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: The Virtual AI Office (Digital Twin) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <div className="bg-[#0A111E] border border-cyan-900/30 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
              <div className="bg-[#0D1525] border-b border-cyan-900/30 px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  <h2 className="text-sm font-bold text-white tracking-widest uppercase">Live Digital Twin Feed</h2>
                </div>
                <div className="text-[10px] text-cyan-500/60 font-mono flex items-center gap-2">
                  <span>LATENCY: 12ms</span>
                  <span className="w-px h-3 bg-cyan-900/50"></span>
                  <span>CAM 01: HQ</span>
                </div>
              </div>
              
              {/* Embed the Pixel Dashboard */}
              <div className="relative w-full h-[600px] bg-black">
                <PixelDashboard />
                
                {/* Scanline overlay for that "CCTV Feed" feel */}
                <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '100% 4px' }}></div>
              </div>
            </div>

            {/* AI Architecture Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/omnitrade/team" className="bg-[#0A111E] border border-gray-800 hover:border-purple-500/50 rounded-2xl p-5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-purple-950/30 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.1)]">🧠</div>
                <h3 className="text-sm font-bold text-white mb-1">Agents Roster</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Manage system prompts and behavior of the 6 specialized AI models.</p>
              </Link>
              <Link href="/omnitrade/quest" className="bg-[#0A111E] border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/30 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.1)]">📊</div>
                <h3 className="text-sm font-bold text-white mb-1">Trading Log</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Review past debates, consensus decisions, and executed orders.</p>
              </Link>
              <Link href="/omnitrade/architecture" className="bg-[#0A111E] border border-gray-800 hover:border-cyan-500/50 rounded-2xl p-5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/30 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.1)]">⚙️</div>
                <h3 className="text-sm font-bold text-white mb-1">System Core</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Configure API keys, risk management limits, and server settings.</p>
              </Link>
            </div>

          </div>

          {/* RIGHT COLUMN: Real-time Stats & Logs */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Performance Overview */}
            <div className="bg-[#0A111E] border border-gray-800 rounded-3xl p-6">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-5">System Performance</h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Net PNL</p>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{metrics.totalPnL}</span>
                    <span className="text-sm font-bold text-emerald-500 bg-emerald-950/30 px-2 py-0.5 rounded-md mb-1">{metrics.totalPnLPercent}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/50">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Win Rate</p>
                    <p className="text-lg font-mono font-bold text-white">{metrics.winRate}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Total Trades</p>
                    <p className="text-lg font-mono font-bold text-white">{metrics.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Active Strats</p>
                    <p className="text-lg font-mono font-bold text-white">{metrics.activeStrategies}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Uptime</p>
                    <p className="text-lg font-mono font-bold text-white">{metrics.systemUptime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Server Daemon Status */}
            <div className="bg-[#0A111E] border border-gray-800 rounded-3xl p-6 flex-1 flex flex-col">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Python Daemon Connection</h3>
              <div className="flex-1">
                <LiveStatus />
              </div>
              <p className="text-[9px] text-gray-600 mt-4 font-mono">Note: The Python FastAPI server must be running on port 8000 for the AI agents to communicate and execute trades.</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
