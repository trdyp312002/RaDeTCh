"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts"

const sleepData = [
  { day: 'M', hours: 0 },
  { day: 'T', hours: 0 },
  { day: 'W', hours: 0 },
  { day: 'T', hours: 0 },
  { day: 'F', hours: 0 },
  { day: 'S', hours: 0 },
  { day: 'S', hours: 0 },
];

export default function HomeDashboard() {
  const [netWorth, setNetWorth] = useState<number>(0);
  const [financeData, setFinanceData] = useState<{name: string, value: number}[]>([
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 },
    { name: 'May', value: 0 },
    { name: 'Jun', value: 0 },
  ]);

  useEffect(() => {
    async function fetchNetWorth() {
      try {
        // 1. Fetch balance sheet items
        const res = await fetch("/api/finance");
        let cash = 0;
        let otherAssets = 0;
        let liability = 0;

        if (res.ok) {
          const items = await res.json();
          items.forEach((item: any) => {
             const amt = Number(item.amount) || 0;
             if (item.category === "cash") cash += amt;
             if (item.category === "other_asset" || item.category === "bond") otherAssets += amt;
             if (item.category === "liability") liability += amt;
          });
        }

        // 2. Fetch live holdings & market quotes
        let holdingsValueTHB = 0;
        try {
          const [fxRes, hRes] = await Promise.all([
            fetch("/api/fx"),
            fetch("/api/holdings")
          ]);
          
          let thbRate = 35.5;
          if (fxRes.ok) {
            const fxData = await fxRes.json();
            if (fxData?.rates?.THB) thbRate = fxData.rates.THB;
          }

          if (hRes.ok) {
            const holdings = await hRes.json();
            const symbols = [...new Set(holdings.map((h: any) => h.symbol))].filter(Boolean).join(",");
            let quotes: any = {};
            if (symbols) {
              const qRes = await fetch(`/api/market?symbols=${symbols}`);
              if (qRes.ok) {
                quotes = await qRes.json();
              }
            }
            // Sum all holdings value in THB
            holdings.forEach((h: any) => {
              const quote = quotes[h.symbol];
              const price = quote?.currentPrice || 0;
              const valueUSD = (h.quantity || 0) * price;
              holdingsValueTHB += (valueUSD * thbRate);
            });
          }
        } catch (e) {
          console.error("Failed to fetch holdings/market data", e);
        }
        
        // Final Net Worth Calculation
        const totalNetWorth = cash + otherAssets + holdingsValueTHB - liability;
        setNetWorth(totalNetWorth);
        
        // Save today's snapshot and fetch real history
        if (totalNetWorth > 0) {
          try {
            // Use en-CA for local YYYY-MM-DD format
            const dateStr = new Date().toLocaleDateString('en-CA'); 

            await fetch('/api/networth-snapshot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: dateStr, value: totalNetWorth })
            });

            const histRes = await fetch('/api/networth-snapshot');
            if (histRes.ok) {
              const histData = await histRes.json();
              if (Array.isArray(histData) && histData.length > 0) {
                let formatted = histData.map((row: any) => {
                  const [y, m, d] = row.date.split('-');
                  return { name: `${d}/${m}`, value: row.total_value };
                });
                
                // If only 1 day of data exists, duplicate it so the area chart draws a line
                if (formatted.length === 1) {
                  formatted = [
                    { name: 'Start', value: formatted[0].value },
                    ...formatted
                  ];
                }
                setFinanceData(formatted);
                return;
              }
            }
          } catch (e) {
            console.error("Snapshot error", e);
          }
        }
        
        // Fallback if no history or error
        setFinanceData([{ name: 'Today', value: totalNetWorth }]);
        
      } catch (err) {
        console.error("Failed to fetch net worth:", err);
      }
    }
    
    fetchNetWorth();
  }, []);

  // Format number
  const formattedNetWorth = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(netWorth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F0] to-[#EAE0D5] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-2">Personal Overview</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-stone-800 tracking-tight">
              Dashboard
            </h1>
            <p className="text-stone-500 mt-2 text-sm md:text-base">
              Welcome back, Teeradet. Here's a summary of your life data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/finance">
              <button className="px-5 py-2.5 bg-stone-800 text-white text-sm font-semibold rounded-full hover:bg-stone-700 transition-colors shadow-lg shadow-stone-800/20">
                Go to Finance
              </button>
            </Link>
          </div>
        </header>

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Net Worth" value={formattedNetWorth} trend="Active" isPositive={true} icon="📊" />
          <StatCard title="Avg Sleep" value="0 hrs" trend="0%" isPositive={true} icon="💤" />
          <StatCard title="Songs Saved" value="1,125" trend="Active" isPositive={true} icon="🎵" />
          <StatCard title="Recipes" value="24" trend="Active" isPositive={true} icon="🍽️" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Main Chart Area - Finance */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 md:p-8 shadow-xl shadow-stone-200/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-800">Financial Growth</h2>
                <p className="text-sm text-stone-500">Net Worth Trajectory</p>
              </div>
              <Link href="/finance" className="text-stone-400 hover:text-stone-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(value))}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column - Routine & Travel */}
          <div className="space-y-6 md:space-y-8">
            
            {/* Sleep Tracking */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-stone-200/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-stone-800">Sleep Routine</h2>
                <Link href="/routine" className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">Details</Link>
              </div>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepData}>
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="hours" fill="#818CF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Travel Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-200/50 text-white group cursor-pointer">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <p className="text-xs font-bold tracking-widest text-blue-200 uppercase mb-1">Weekly Pick</p>
                <h2 className="text-2xl font-bold mb-1">Toyama Alps</h2>
                <p className="text-blue-100 text-sm mb-4">Japan-wide destinations</p>
                <Link href="/travel" className="inline-flex items-center gap-2 text-sm font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full transition-colors">
                  Explore Map <span>→</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <ModuleCard
            title="Music Library"
            desc="1,125 songs across Japanese, Korean, Thai, and others."
            icon="🎧"
            href="/music"
            color="bg-rose-50 border-rose-100 text-rose-900"
          />
          <ModuleCard
            title="Food Menu"
            desc="Searchable recipe database. 5+ cuisines."
            icon="🍜"
            href="/menu"
            color="bg-orange-50 border-orange-100 text-orange-900"
          />
          <ModuleCard
            title="Agent Office"
            desc="Live Multi-Agent workspace. Isometric 3D office view."
            icon="🏢"
            href="/agents"
            color="bg-indigo-50 border-indigo-100 text-indigo-900"
          />
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, trend, isPositive, icon }: { title: string, value: string | React.ReactNode, trend: string, isPositive: boolean, icon: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl p-5 shadow-lg shadow-stone-200/40 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-stone-100 rounded-xl text-xl">{icon}</div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend}
        </span>
      </div>
      <div>
        <h3 className="text-stone-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-extrabold text-stone-800 mt-1">{value}</p>
      </div>
    </div>
  )
}

function ModuleCard({ title, desc, icon, href, color }: { title: string, desc: string, icon: string, href: string, color: string }) {
  return (
    <Link href={href} className="group block">
      <div className={`rounded-3xl border p-6 flex items-center gap-6 transition-all duration-300 hover:shadow-xl ${color}`}>
        <div className="text-4xl bg-white/50 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-1 group-hover:text-stone-900 transition-colors">{title}</h3>
          <p className="text-sm opacity-80">{desc}</p>
        </div>
      </div>
    </Link>
  )
}
