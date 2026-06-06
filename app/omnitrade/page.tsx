import Link from 'next/link'
import { readMarkdown } from '@/lib/markdown'
import LiveStatus from '@/components/LiveStatus'
import LiveMetrics from '@/components/LiveMetrics'

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

  const statusColor = metrics.botStatus === 'ONLINE' ? 'var(--green)' : 'var(--red)'

  const menuItems = [
    {
      href: '/omnitrade/team',
      label: 'PARTY',
      sub: 'View team roster',
      icon: '⚔️',
      color: '#a855f7',
      glow: 'rgba(168,85,247,0.3)',
    },
    {
      href: '/omnitrade/architecture',
      label: 'SYSTEM',
      sub: 'Bot architecture modules',
      icon: '🧠',
      color: '#00f5ff',
      glow: 'rgba(0,245,255,0.3)',
    },
    {
      href: '/omnitrade/quest',
      label: 'QUESTS',
      sub: 'Trading workflow log',
      icon: '📜',
      color: '#ffd700',
      glow: 'rgba(255,215,0,0.3)',
    },
    {
      href: '/omnitrade/dashboard',
      label: 'HUD',
      sub: 'Live performance dashboard',
      icon: '📊',
      color: '#00ff41',
      glow: 'rgba(0,255,65,0.3)',
    },
    {
      href: '/omnitrade/agent',
      label: 'AGENT',
      sub: 'Browser AI automation protocol',
      icon: '🤖',
      color: '#f97316',
      glow: 'rgba(249,115,22,0.3)',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
      {/* Hero */}
      <div className="relative flex flex-col items-center text-center gap-6 scanlines overflow-hidden py-12">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,245,255,0.4) 0%, transparent 70%)',
          }}
        />
        <p
          className="font-pixel relative z-10"
          style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '4px' }}
        >
          ▶ ALGORITHMIC TRADING SYSTEM ◀
        </p>
        <h1
          className="font-pixel relative z-10 leading-loose glow-cyan"
          style={{ color: 'var(--cyan)', fontSize: 'clamp(20px, 5vw, 40px)' }}
        >
          OMNITRADE
        </h1>
        <p
          className="font-pixel relative z-10"
          style={{ color: 'var(--text-dim)', fontSize: '9px' }}
        >
          PROFESSIONAL AUTOMATED TRADING PLATFORM
        </p>
        <div className="relative z-10 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full blink" style={{ background: statusColor }} />
          <span className="font-pixel" style={{ color: statusColor, fontSize: '9px' }}>
            BOT STATUS: {metrics.botStatus}
          </span>
        </div>
      </div>

      {/* Live bot status */}
      <LiveStatus />

      {/* Live stats */}
      <LiveMetrics />

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-5 group card-hover glass-card"
            style={{
              border: `1px solid ${item.color}60`,
              boxShadow: `0 0 20px ${item.color}35`,
            }}
          >
            <span className="text-3xl">{item.icon}</span>
            <div>
              <p
                className="font-pixel mb-1"
                style={{ color: item.color, fontSize: '12px' }}
              >
                {item.label}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                {item.sub}
              </p>
            </div>
            <span
              className="ml-auto font-pixel"
              style={{ color: item.color, fontSize: '14px' }}
            >
              ▶
            </span>
          </Link>
        ))}
      </div>

      {/* System info */}
      <div
        className="p-4 font-pixel glass-card"
        style={{
          border: '1px solid var(--border-dim)',
          color: 'var(--text-dim)',
          fontSize: '8px',
          lineHeight: '2',
        }}
      >
        <p>■ ACTIVE STRATEGIES: {metrics.activeStrategies}</p>
        <p>■ TOTAL TRADES EXECUTED: {metrics.totalTrades}</p>
        <p>■ SYSTEM UPTIME: {metrics.systemUptime}</p>
        <p>
          ■ LAST SYNC: <span style={{ color: 'var(--cyan)' }}>2026-05-30</span>
        </p>
      </div>
    </div>
  )
}
