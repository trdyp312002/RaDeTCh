import { readMarkdown } from '@/lib/markdown'
import MetricCard from '@/components/MetricCard'
import LiveHUD from '@/components/LiveHUD'
import LiveMetrics from '@/components/LiveMetrics'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OmniTrade — HUD Dashboard' }

interface TradeEntry {
  id: string
  symbol: string
  side: string
  price: string
  size: string
  pnl: string
  pnlPositive: boolean
  time: string
  status: string
  strategy: string
}

interface PositionEntry {
  symbol: string
  side: string
  entryPrice: string
  currentPrice: string
  size: string
  unrealizedPnL: string
  pnlPercent: string
  pnlPositive: boolean
  strategy: string
  openedAt: string
}

export default function DashboardPage() {
  const metrics = readMarkdown('dashboard', 'metrics').meta as {
    totalPnL: string
    totalPnLPercent: string
    pnlTrend: string
    winRate: string
    maxDrawdown: string
    sharpeRatio: string
    calmarRatio: string
    totalTrades: number
    systemUptime: string
    botStatus: string
    activeStrategies: number
  }

  const trades = (readMarkdown('dashboard', 'trades').meta as { trades: TradeEntry[] }).trades
  const positions = (readMarkdown('dashboard', 'positions').meta as { positions: PositionEntry[] }).positions

  const isPositive = metrics.pnlTrend === 'positive'

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            ▶ LIVE PERFORMANCE
          </p>
          <h1 className="font-pixel glow-green" style={{ color: 'var(--green)', fontSize: '18px' }}>
            HUD DASHBOARD
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full blink" style={{ background: 'var(--green)' }} />
          <span className="font-pixel" style={{ color: 'var(--green)', fontSize: '9px' }}>
            {metrics.botStatus}
          </span>
        </div>
      </div>

      {/* Live metrics from bot */}
      <LiveMetrics />

      {/* Live portfolio + trades */}
      <LiveHUD />

      {/* Active positions */}
      <div>
        <p className="font-pixel mb-4" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ■ ACTIVE POSITIONS ({positions.length})
        </p>
        <div
          className="overflow-x-auto glass-card"
          style={{ border: '1px solid var(--border-bright)' }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                {['SYMBOL', 'SIDE', 'ENTRY', 'CURRENT', 'SIZE', 'UNREAL. PNL', 'STRATEGY', 'OPENED'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left font-pixel px-4 py-3"
                      style={{ color: 'var(--text-dim)', fontSize: '7px' }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid var(--border-dim)' }}
                >
                  <td className="px-4 py-3 font-pixel" style={{ color: 'var(--cyan)', fontSize: '8px' }}>
                    {pos.symbol}
                  </td>
                  <td className="px-4 py-3 font-pixel" style={{ fontSize: '8px' }}>
                    <span
                      style={{
                        color: pos.side === 'LONG' ? '#00ff41' : '#ff4444',
                        border: `1px solid ${pos.side === 'LONG' ? '#00ff41' : '#ff4444'}`,
                        padding: '1px 6px',
                      }}
                    >
                      {pos.side}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                    ${pos.entryPrice}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                    ${pos.currentPrice}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-dim)' }}>
                    {pos.size}
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: pos.pnlPositive ? '#00ff41' : '#ff4444' }}>
                      {pos.unrealizedPnL} ({pos.pnlPercent})
                    </span>
                  </td>
                  <td className="px-4 py-3 font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
                    {pos.strategy}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                    {pos.openedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent trades */}
      <div>
        <p className="font-pixel mb-4" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ■ RECENT BATTLES (CLOSED TRADES)
        </p>
        <div
          className="overflow-x-auto glass-card"
          style={{ border: '1px solid var(--border-bright)' }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                {['ID', 'SYMBOL', 'SIDE', 'PRICE', 'SIZE', 'PNL', 'STRATEGY', 'TIME'].map((h) => (
                  <th
                    key={h}
                    className="text-left font-pixel px-4 py-3"
                    style={{ color: 'var(--text-dim)', fontSize: '7px' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid var(--border-dim)' }}
                >
                  <td className="px-4 py-3 font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
                    {trade.id}
                  </td>
                  <td className="px-4 py-3 font-pixel" style={{ color: 'var(--cyan)', fontSize: '8px' }}>
                    {trade.symbol}
                  </td>
                  <td className="px-4 py-3 font-pixel" style={{ fontSize: '8px' }}>
                    <span
                      style={{
                        color: trade.side === 'BUY' ? '#00ff41' : '#ff4444',
                        border: `1px solid ${trade.side === 'BUY' ? '#00ff41' : '#ff4444'}`,
                        padding: '1px 6px',
                      }}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                    ${trade.price}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-dim)' }}>
                    {trade.size}
                  </td>
                  <td className="px-4 py-3 font-pixel" style={{ fontSize: '8px' }}>
                    <span style={{ color: trade.pnlPositive ? '#00ff41' : '#ff4444' }}>
                      {trade.pnl}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
                    {trade.strategy}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                    {trade.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="font-pixel text-center" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
        DATA SOURCED FROM /data/dashboard/*.md — UPDATE FILES TO REFRESH DISPLAY
      </p>
    </div>
  )
}
