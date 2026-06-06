'use client'

import { useEffect, useState } from 'react'

interface Asset {
  asset: string
  total: number
  free: number
}

interface Position {
  symbol: string
  side: string
  entry_price: number
  amount: number
  stop_loss: number
  held: string
}

interface PnlEntry {
  datetime: string
  symbol: string
  entry: number
  exit: number
  pnl: number
  pnl_pct: number
  reason: string
}

interface LogEntry {
  datetime: string
  price: number
  signal: string | null
  ema9: number
  ema21: number
  position: string | null
}

interface Trade {
  id: string
  side: string
  price: number
  amount: number
  cost: number
  datetime: string
}

const ASSET_COLOR: Record<string, string> = {
  USDT:  'var(--green)',
  BTC:   'var(--gold)',
  ETH:   'var(--purple-bright)',
  BNB:   '#f3ba2f',
  SOL:   'var(--magenta)',
  FDUSD: 'var(--cyan)',
}

export default function LiveHUD() {
  const [assets, setAssets]     = useState<Asset[]>([])
  const [trades, setTrades]     = useState<Trade[]>([])
  const [position, setPosition] = useState<Position | null>(null)
  const [pnlHistory, setPnlHistory] = useState<PnlEntry[]>([])
  const [log, setLog]           = useState<LogEntry[]>([])
  const [pnlStats, setPnlStats] = useState({ total_pnl: 0, win_rate: 0, total_trades: 0 })
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  async function refresh() {
    try {
      const [balRes, tradeRes, posRes] = await Promise.all([
        fetch('/api/bot/balance', { cache: 'no-store' }),
        fetch('/api/bot/trades', { cache: 'no-store' }),
        fetch('/api/bot/positions', { cache: 'no-store' }),
      ])
      const balData   = await balRes.json()
      const tradeData = await tradeRes.json()
      const posData   = await posRes.json()

      setAssets(balData.assets ?? [])
      setTrades(tradeData.trades ?? [])
      setPosition(posData.position ?? null)
      setPnlHistory(posData.history ?? [])
      setLog((posData.log ?? []).slice().reverse())
      setPnlStats({
        total_pnl:    posData.total_pnl ?? 0,
        win_rate:     posData.win_rate ?? 0,
        total_trades: posData.total_trades ?? 0,
      })
      setLastUpdate(new Date().toLocaleTimeString())
    } catch {
      // keep previous data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      {/* Portfolio */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            ■ LIVE PORTFOLIO — BINANCE TESTNET
          </p>
          {lastUpdate && (
            <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>
              SYNC {lastUpdate} · AUTO 30s
            </p>
          )}
        </div>

        {loading ? (
          <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>LOADING...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {assets.map((a) => (
              <div
                key={a.asset}
                className="flex flex-col gap-2 p-4 glass-card"
                style={{ border: `1px solid ${ASSET_COLOR[a.asset] ?? 'var(--border-bright)'}40` }}
              >
                <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>{a.asset}</p>
                <p className="font-pixel" style={{ color: ASSET_COLOR[a.asset] ?? 'var(--text-primary)', fontSize: '16px' }}>
                  {a.total.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </p>
                <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>
                  FREE {a.free.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'TOTAL PNL', value: `$${pnlStats.total_pnl.toFixed(2)}`, color: pnlStats.total_pnl >= 0 ? 'var(--green)' : '#ff4444' },
          { label: 'WIN RATE',  value: `${pnlStats.win_rate}%`,              color: 'var(--cyan)' },
          { label: 'TRADES',    value: pnlStats.total_trades.toString(),      color: 'var(--gold)' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-2 p-4 glass-card" style={{ border: `1px solid ${s.color}40` }}>
            <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>{s.label}</p>
            <p className="font-pixel" style={{ color: s.color, fontSize: '18px' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active position */}
      <div>
        <p className="font-pixel mb-3" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>■ ACTIVE POSITION</p>
        {position ? (
          <div className="p-4 glass-card" style={{ border: '1px solid #00ff4140' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: 'SYMBOL',      v: position.symbol,                   c: 'var(--cyan)' },
                { l: 'ENTRY',       v: `$${position.entry_price.toLocaleString()}`, c: 'var(--text-primary)' },
                { l: 'STOP LOSS',   v: `$${position.stop_loss.toLocaleString('en-US',{maximumFractionDigits:0})}`, c: '#ff4444' },
                { l: 'HELD',        v: position.held,                      c: 'var(--gold)' },
              ].map((f) => (
                <div key={f.l}>
                  <p className="font-pixel mb-1" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>{f.l}</p>
                  <p className="font-pixel" style={{ color: f.c, fontSize: '10px' }}>{f.v}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>NO OPEN POSITION</p>
        )}
      </div>

      {/* Strategy log */}
      <div>
        <p className="font-pixel mb-3" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>■ STRATEGY LOG — EMA 9/21</p>
        <div className="overflow-x-auto glass-card" style={{ border: '1px solid var(--border-bright)', maxHeight: '240px', overflowY: 'auto' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                {['TIME', 'PRICE', 'EMA9', 'EMA21', 'SIGNAL', 'POSITION'].map((h) => (
                  <th key={h} className="text-left font-pixel px-4 py-2" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-4 font-pixel text-center" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>WAITING FOR FIRST TICK...</td></tr>
              ) : log.slice(0, 20).map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  <td className="px-4 py-2" style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{l.datetime}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>${l.price.toLocaleString()}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--cyan)' }}>{l.ema9}</td>
                  <td className="px-4 py-2" style={{ color: 'var(--purple-bright)' }}>{l.ema21}</td>
                  <td className="px-4 py-2 font-pixel" style={{ fontSize: '7px', color: l.signal === 'buy' ? '#00ff41' : l.signal === 'sell' ? '#ff4444' : 'var(--text-dim)' }}>
                    {l.signal?.toUpperCase() ?? '—'}
                  </td>
                  <td className="px-4 py-2 font-pixel" style={{ fontSize: '7px', color: l.position ? '#00ff41' : 'var(--text-dim)' }}>
                    {l.position?.toUpperCase() ?? 'NONE'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade history */}
      <div>
        <p className="font-pixel mb-4" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ■ RECENT TRADES — BTC/USDT
        </p>
        <div
          className="overflow-x-auto glass-card"
          style={{ border: '1px solid var(--border-bright)' }}
        >
          {trades.length === 0 ? (
            <p
              className="font-pixel p-6 text-center"
              style={{ color: 'var(--text-dim)', fontSize: '8px' }}
            >
              NO TRADES YET — BOT HAS NOT EXECUTED ANY ORDERS
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {['ID', 'SIDE', 'PRICE', 'AMOUNT', 'COST', 'TIME'].map((h) => (
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
                {trades.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td className="px-4 py-3 font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
                      {t.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-pixel" style={{ fontSize: '8px' }}>
                      <span
                        style={{
                          color: t.side === 'buy' ? '#00ff41' : '#ff4444',
                          border: `1px solid ${t.side === 'buy' ? '#00ff41' : '#ff4444'}`,
                          padding: '1px 6px',
                        }}
                      >
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      ${t.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-dim)' }}>
                      {t.amount}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      ${t.cost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                      {new Date(t.datetime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
