'use client'

import { useEffect, useState } from 'react'

interface BotStatus {
  status: string
  testnet: boolean
  uptime: string
  btc_price: number | null
  exchange: string
}

export default function LiveStatus() {
  const [data, setData] = useState<BotStatus | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  async function fetchStatus() {
    try {
      const res = await fetch('/api/bot/status', { cache: 'no-store' })
      const json = await res.json()
      setData(json)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch {
      setData({ status: 'OFFLINE', testnet: false, uptime: '--', btc_price: null, exchange: '--' })
    }
  }

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 10_000)
    return () => clearInterval(id)
  }, [])

  const online = data?.status === 'ONLINE'
  const statusColor = online ? 'var(--green)' : data?.status === 'OFFLINE' ? '#ff4444' : 'var(--gold)'

  return (
    <div
      className="flex flex-col gap-3 p-4 glass-card"
      style={{ border: '1px solid var(--border-bright)' }}
    >
      <div className="flex items-center justify-between">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
          ◈ LIVE BOT STATUS
        </p>
        {lastUpdate && (
          <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>
            SYNC {lastUpdate}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1 items-center">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>STATUS</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span className="font-pixel" style={{ color: statusColor, fontSize: '9px' }}>
              {data?.status ?? '...'}
            </span>
          </div>
          {data?.testnet && (
            <span className="font-pixel" style={{ color: 'var(--gold)', fontSize: '6px' }}>TESTNET</span>
          )}
        </div>

        <div className="flex flex-col gap-1 items-center">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>BTC PRICE</span>
          <span className="font-pixel" style={{ color: 'var(--cyan)', fontSize: '11px' }}>
            {data?.btc_price != null
              ? `$${data.btc_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              : '--'}
          </span>
        </div>

        <div className="flex flex-col gap-1 items-center">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>UPTIME</span>
          <span className="font-pixel" style={{ color: 'var(--purple-bright)', fontSize: '11px' }}>
            {data?.uptime ?? '--'}
          </span>
        </div>

        <div className="flex flex-col gap-1 items-center">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>EXCHANGE</span>
          <span className="font-pixel" style={{ color: 'var(--gold)', fontSize: '9px' }}>
            {data?.exchange ?? '--'}
          </span>
        </div>
      </div>
    </div>
  )
}
