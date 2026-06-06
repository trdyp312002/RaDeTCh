"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'

const Panel = ({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) => {
  return (
    <div className={`flex flex-col bg-[#040f28]/80 backdrop-blur-md border border-[#00f5ff] rounded shadow-[0_0_15px_rgba(0,245,255,0.2),inset_0_0_10px_rgba(0,245,255,0.1)] overflow-hidden font-pixel ${className}`}>
      <div className="flex justify-between items-center px-2 py-1.5 bg-[#0096ff]/30 border-b border-[#00f5ff]">
        <span className="text-[8px] text-[#00f5ff] tracking-wider">{title}</span>
        <div className="flex gap-1">
          <button className="text-[8px] hover:text-white text-[#00f5ff]/70 px-1">-</button>
          <button className="text-[8px] hover:text-white text-[#00f5ff]/70 px-1">x</button>
        </div>
      </div>
      <div className="p-3 text-[9px] text-white overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export default function PixelFinanceDashboard() {
  const [time, setTime] = useState("")
  
  // Real data states
  const [allHoldings, setAllHoldings] = useState<any[]>([])
  const [marketQuotes, setMarketQuotes] = useState<Record<string, any>>({})
  const [dbFinanceItems, setDbFinanceItems] = useState<any[]>([])
  const [dbMonthlyItems, setDbMonthlyItems] = useState<any[]>([])

  const fetchDbHoldings = useCallback(async () => {
    try {
      const res = await fetch("/api/holdings")
      if (!res.ok) return
      const holdingsData = await res.json()
      
      if (Array.isArray(holdingsData)) {
        setAllHoldings(holdingsData)
        
        // Always fetch these popular coins plus whatever is in holdings
        const baseSymbols = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'SOL']
        const holdingSymbols = holdingsData.map((h: any) => h.symbol).filter(Boolean)
        const symbols = [...new Set([...baseSymbols, ...holdingSymbols])].join(",")
        
        if (symbols) {
          const qRes = await fetch(`/api/market?symbols=${symbols}`)
          if (qRes.ok) {
            const quotes = await qRes.json()
            setMarketQuotes(quotes)
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchFinanceItems = useCallback(async () => {
    try {
      const res = await fetch("/api/finance")
      if (res.ok) setDbFinanceItems(await res.json())
      const mRes = await fetch("/api/monthly")
      if (mRes.ok) setDbMonthlyItems(await mRes.json())
    } catch (e) {}
  }, [])

  useEffect(() => {
    fetchDbHoldings()
    fetchFinanceItems()
    
    // Time loop
    const timer = setInterval(() => {
      const d = new Date()
      setTime(d.toLocaleTimeString('en-US', { hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [fetchDbHoldings, fetchFinanceItems])

  // Calculations
  const calculateTotalHoldings = () => {
    return allHoldings.reduce((acc, h) => {
      const price = marketQuotes[h.symbol]?.price || 0
      return acc + (h.amount * price)
    }, 0)
  }

  const calculateCashflow = () => {
    const income = dbMonthlyItems.filter(i => i.type.startsWith('income')).reduce((acc, i) => acc + i.amount, 0)
    const expense = dbMonthlyItems.filter(i => i.type.startsWith('expense')).reduce((acc, i) => acc + i.amount, 0)
    return income - expense
  }

  const holdingsValue = calculateTotalHoldings()
  const netCashflow = calculateCashflow()
  const btcAmount = allHoldings.filter(h => h.symbol === 'BTC').reduce((acc, h) => acc + h.amount, 0)

  // Crypto prices list
  const cryptoPricesList = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'SOL'].map(sym => {
    const quote = marketQuotes[sym] || {}
    return { symbol: sym, price: quote.price || 0, change: quote.change24h || 0 }
  })

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-pixel select-none omnitrade-theme">
      {/* Background Image */}
      <img 
        src="/pixel_office_bg.png" 
        alt="Office Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
      />
      
      {/* Top Navbar */}
      <div className="absolute top-4 left-4 right-4 h-12 bg-black/60 backdrop-blur border border-white/10 rounded-xl flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-xs">▲</div>
            <div>
              <p className="text-[10px] text-white">PIXEL DREAM</p>
              <p className="text-[8px] text-gray-400 mt-1">GAMES</p>
            </div>
          </div>
          <div className="hidden md:flex gap-4 ml-6 text-[8px] tracking-wider">
            <button className="text-cyan-400 bg-cyan-900/40 px-3 py-1.5 rounded border border-cyan-500/50">Dashboard</button>
            <button className="text-gray-300 hover:text-white">Projects</button>
            <button className="text-gray-300 hover:text-white">AI Agents</button>
            <button className="text-gray-300 hover:text-white">Assets</button>
            <button className="text-gray-300 hover:text-white">Team</button>
            <button className="text-gray-300 hover:text-white">Analytics</button>
            <button className="text-gray-300 hover:text-white">Settings</button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px]">
          <div className="flex items-center gap-1 text-emerald-400"><span className="text-lg">💰</span> {holdingsValue.toLocaleString('en-US', {maximumFractionDigits:0})}</div>
          <div className="flex items-center gap-1 text-cyan-400"><span className="text-lg">💎</span> 320</div>
          <div className="flex items-center gap-1 text-purple-400">Lv.24 1,200/2,000</div>
        </div>
      </div>

      {/* Main Grid Layout overlaying the background */}
      <div className="absolute top-20 left-4 right-4 bottom-8 flex gap-4 z-10 pointer-events-none">
        
        {/* Left Column */}
        <div className="w-64 flex flex-col gap-4 h-full pointer-events-auto">
          <Panel title="รายได้ AFFILIATE วันนี้" className="h-32">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[#00f5ff] text-xl font-bold">$7.59 <span className="text-[8px] text-gray-400">USDT</span></span>
            </div>
            <div className="text-[7px] text-gray-400 mb-2">@32.52 THB/USD - open.er-api.com</div>
            <div className="flex justify-between text-[8px] border-b border-white/10 pb-1 mb-1">
              <span>Bybit pending</span>
              <span className="text-green-400">$2.94</span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Bitget วันนี้</span>
              <span className="text-green-400">$4.65</span>
            </div>
            <div className="text-[7px] text-gray-500 mt-2 text-right">อัปเดต {time}</div>
          </Panel>

          <Panel title="GRID BOT" className="h-44">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
              <span className="text-gray-300">ROI</span>
              <span className="text-rose-500">-344.84%</span>
            </div>
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
              <span className="text-gray-300">กำไรรวม</span>
              <span className="text-rose-500">-$179.13</span>
            </div>
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
              <span className="text-gray-300">Grid Profit</span>
              <span className="text-emerald-400">$20.39</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">ช่วงราคา</span>
              <span className="text-cyan-400">0.0025 - 0.0045</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-400">สถานะ</span>
              <span className="bg-emerald-900/60 text-emerald-400 border border-emerald-500 px-2 py-1 rounded-full text-[7px] animate-pulse">RUNNING</span>
            </div>
          </Panel>

          <Panel title="AI AGENTS" className="flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="flex-1">
                  <div className="text-white text-[8px]">Housekeeper</div>
                  <div className="text-gray-400 text-[7px] mt-0.5">ว่าง · ล่าสุด 12 ชม.ที่แล้ว</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="flex-1">
                  <div className="text-white text-[8px]">Policy Refresh</div>
                  <div className="text-gray-400 text-[7px] mt-0.5">ว่าง · ล่าสุด 15 ชม.ที่แล้ว</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="flex-1">
                  <div className="text-white text-[8px]">Jing (Dev)</div>
                  <div className="text-gray-400 text-[7px] mt-0.5">ว่าง · ล่าสุด 15 ชม.ที่แล้ว</div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Center Column (Empty space for game view, with small panel at bottom) */}
        <div className="flex-1 flex flex-col justify-end pointer-events-none">
          <div className="pointer-events-auto">
            <Panel title="V2 TRADING" className="w-80 h-32 mb-4 mx-auto">
              <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1.5">
                <span className="text-gray-300">PnL วันนี้</span>
                <span className="text-white">$0.00</span>
              </div>
              <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1.5">
                <span className="text-gray-300">Realized</span>
                <span className="text-white">$0.00</span>
              </div>
              <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1.5">
                <span className="text-gray-300">Floating</span>
                <span className="text-white">$0.00</span>
              </div>
              <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1.5">
                <span className="text-gray-300">W/L วันนี้</span>
                <span className="text-white">0W / 0L · -</span>
              </div>
              <div className="mt-2 text-[7px] text-gray-400">OPEN POSITIONS (0)</div>
              <div className="text-[7px] text-gray-500 mt-1">ไม่มี position เปิดอยู่</div>
            </Panel>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-64 flex flex-col gap-4 h-full pointer-events-auto">
          <Panel title="COMPANY STATUS" className="h-44">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-[7px]">Realized PnL</span>
              <span className="text-emerald-400 text-[8px]">$1,757</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-[7px]">Total PnL</span>
              <span className="text-rose-400 text-[8px]">-$1,889</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-[7px]">Net Cashflow</span>
              <span className="text-emerald-400 text-[8px]">${netCashflow.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2 border-t border-white/10 pt-2">
              <span className="text-gray-300 text-[7px]">Holdings</span>
              <span className="text-cyan-400 text-[7px]">{btcAmount.toFixed(4)} BTC · ${holdingsValue.toLocaleString(undefined, {maximumFractionDigits:0})} USDT</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-[7px]">APY</span>
              <span className="text-white text-[8px]">1.2%</span>
            </div>
            <div className="mt-2">
              <button className="w-full bg-cyan-900/50 border border-cyan-500/50 hover:bg-cyan-800 text-cyan-300 py-1.5 rounded text-[8px] transition-colors">Safe Withdraw</button>
            </div>
          </Panel>

          <Panel title="CRYPTO PRICES" className="flex-1">
            <div className="grid grid-cols-4 text-[7px] text-gray-400 border-b border-white/10 pb-1 mb-2">
              <span>เหรียญ</span>
              <span className="text-right">ราคา</span>
              <span className="text-right">24h</span>
              <span className="text-right">แนวโน้ม</span>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {cryptoPricesList.map((c, i) => (
                <div key={i} className="grid grid-cols-4 items-center text-[7px]">
                  <span className="text-white font-bold">{c.symbol}</span>
                  <span className="text-right text-gray-300">${c.price.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  <span className={`text-right ${c.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {c.change >= 0 ? '+' : ''}{c.change}%
                  </span>
                  <span className="text-right text-gray-500">--</span>
                </div>
              ))}
            </div>
            <div className="text-[6px] text-gray-500 text-right mt-3">อัปเดต {time}</div>
          </Panel>

          {/* Lofi Beats & Team Chat stacked */}
          <div className="flex flex-col gap-4 h-48">
            <Panel title="TEAM CHAT" className="flex-1">
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  <div className="text-[7px]">
                    <span className="text-emerald-400">เทพทอง:</span> โป๊มีเรื่องไร กำลังทำงานเอา ตอนนี้ตรวจสถานะระบบเทรดก่อนเปิดเช้า
                  </div>
                  <div className="text-[7px]">
                    <span className="text-cyan-400">กราฟิก:</span> ว่างจังเลย ครับ 😴 รอดูว่าเปิดรอเดอร์ thumbnail มาไหม เดี๋ยว Editor อาจจะฉีดยามาให้
                  </div>
                </div>
                <div className="mt-2">
                  <input type="text" placeholder="Type a message..." className="w-full bg-black/50 border border-white/20 rounded px-2 py-1 text-[7px] text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
            </Panel>

            <Panel title="LOFI BEATS TO CODE" className="h-16 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-900/50 rounded border border-purple-500/50 flex items-center justify-center">🎵</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] text-cyan-300">คุณมีเวทมนตร์ 🪄</span>
                    <span className="text-[7px] text-gray-400">1:45 / 3:12</span>
                  </div>
                  <div className="h-1 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-1/2"></div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

        </div>

      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/80 border-t border-white/10 flex justify-between items-center px-4 text-[7px] text-gray-500 z-10 font-mono">
        <div className="flex items-center gap-4">
          <span className="text-yellow-500 flex items-center gap-1">⚡ DAY 150</span>
          <span>📅 เสาร์ 30 พ.ค. 2569</span>
          <span className="text-white bg-black px-2 py-0.5 rounded border border-white/20">{time}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>192.168.1.34</span>
          <span>🔋 76%</span>
          <span>🌡️ 29°C</span>
        </div>
      </div>
    </div>
  )
}
