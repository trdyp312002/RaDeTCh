"use client"
import { motion } from "framer-motion"

export default function ProjectOmnitechPage() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden bg-[#050B14]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,211,238,0.4)] border border-cyan-300/30">
          <span className="text-5xl">🚀</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 mb-6 tracking-tight">
          PROJECT OMNITECH
        </h1>
        
        <p className="text-lg md:text-xl text-cyan-100/70 max-w-2xl leading-relaxed mb-10">
          Welcome to the central command hub. Omnitech is currently being initialized. This space will serve as the primary interface for advanced system integrations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6 text-left hover:bg-black/30 transition-all cursor-pointer group">
            <div className="text-cyan-400 mb-3 text-2xl group-hover:scale-110 transition-transform origin-left">📡</div>
            <h3 className="text-white font-bold mb-2">Signal Processing</h3>
            <p className="text-xs text-gray-400">Monitoring incoming data streams and orchestrating network communications.</p>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6 text-left hover:bg-black/30 transition-all cursor-pointer group">
            <div className="text-blue-400 mb-3 text-2xl group-hover:scale-110 transition-transform origin-left">🧠</div>
            <h3 className="text-white font-bold mb-2">Neural Link</h3>
            <p className="text-xs text-gray-400">Establishing direct connections with autonomous agent models.</p>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6 text-left hover:bg-black/30 transition-all cursor-pointer group">
            <div className="text-indigo-400 mb-3 text-2xl group-hover:scale-110 transition-transform origin-left">⚡</div>
            <h3 className="text-white font-bold mb-2">Power Grid</h3>
            <p className="text-xs text-gray-400">Managing resource allocation and computational throughput.</p>
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-3 w-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <span className="text-xs text-cyan-400 uppercase tracking-widest font-semibold">Systems Online</span>
        </div>
      </motion.div>
    </div>
  )
}
