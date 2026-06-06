'use client'

import { useEffect, useState } from 'react'
import MetricCard from './MetricCard'

interface Stats {
  total_pnl: number
  win_rate: number
  total_trades: number
  win_count: number
  loss_count: number
  uptime: string
  btc_price: number | null
  bot_status: string
}

export default function LiveMetrics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lastSync, setLastSync] = useState('')

  async function refresh() {
    try {
      const [posRes, statusRes] = await Promise.all([
        fetch('/api/bot/positions', { cache: 'no-store' }),
        fetch('/api/bot/status',    { cache: 'no-store' }),
      ])
      const pos    = await posRes.json()
      const status = await statusRes.json()
      setStats({
        total_pnl:    pos.total_pnl    ?? 0,
        win_rate:     pos.win_rate     ?? 0,
        total_trades: pos.total_trades ?? 0,
        win_count:    pos.win_count    ?? 0,
        loss_count:   pos.loss_count   ?? 0,
        uptime:       status.uptime    ?? '--',
        btc_price:    status.btc_price ?? null,
        bot_status:   status.status    ?? 'UNKNOWN',
      })
      setLastSync(new Date().toLocaleTimeString())
    } catch {
      // keep previous
    }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [])

  if (!stats) {
    return (
      <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
        CONNECTING TO BOT...
      </p>
    )
  }

  const pnlPositive = stats.total_pnl >= 0
  const online      = stats.bot_status === 'ONLINE'

  return (
    <div className="flex flex-col gap-4">
      {/* sync badge */}
      <div className="flex items-center justify-between">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
          ◈ LIVE DATA — BOT SERVER
        </p>
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>
          SYNC {lastSync} · AUTO 15s
        </p>
      </div>

      {/* primary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="TOTAL PNL"
          value={`$${stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(4)}`}
          sub={`${stats.win_count}W / ${stats.loss_count}L`}
          positive={pnlPositive}
          icon="💰"
          color={pnlPositive ? '#00ff41' : '#ff4444'}
        />
        <MetricCard
          label="WIN RATE"
          value={`${stats.win_rate}%`}
          sub={`${stats.total_trades} trades closed`}
          icon="🎯"
          color="var(--cyan)"
        />
        <MetricCard
          label="BTC PRICE"
          value={stats.btc_price ? `$${stats.btc_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '--'}
          sub="Binance live"
          icon="₿"
          color="var(--gold)"
        />
        <MetricCard
          label="BOT STATUS"
          value={stats.bot_status}
          sub={`UPTIME ${stats.uptime}`}
          positive={online ? true : false}
          icon="🤖"
          color={online ? '#00ff41' : '#ff4444'}
        />
      </div>
    </div>
  )
}
