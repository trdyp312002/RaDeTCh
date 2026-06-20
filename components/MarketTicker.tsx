"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useLivePrice } from "@/hooks/useLivePrice"

const TICKER_SYMBOLS = [
  { symbol: "BTC-USD",   name: "BTC"        },
  { symbol: "GC=F",      name: "Gold"       },
  { symbol: "^GSPC",     name: "S&P 500"    },
  { symbol: "^IXIC",     name: "NASDAQ"     },
  { symbol: "^N225",     name: "Nikkei"     },
  { symbol: "^SET.BK",   name: "SET"        },
  { symbol: "SET50.BK",  name: "SET50"      },
  { symbol: "^KS11",     name: "KOSPI"      },
  { symbol: "^TWII",     name: "Taiwan"     },
  { symbol: "^STOXX50E", name: "Euro Stoxx" },
]

type TickerSeed = {
  symbol: string
  name: string
  price: number
  changePercent: number
}

function fmt(price: number) {
  if (price >= 10000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 })
  if (price >= 100)   return price.toLocaleString("en-US", { maximumFractionDigits: 2 })
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function LiveTickerItem({ seed }: { seed: TickerSeed }) {
  const live  = useLivePrice(seed.symbol, { price: seed.price, changePercent: seed.changePercent })
  const price = live?.price         ?? seed.price
  const pct   = live?.changePercent ?? seed.changePercent
  const up    = pct >= 0

  return (
    <span className="inline-flex items-center gap-2 px-4 shrink-0">
      <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-on-surface-variant)]">
        {seed.name}
      </span>
      <span className={`text-[11px] font-mono font-medium tabular-nums ${
        live?.flash === "up"   ? "price-flash-up"   :
        live?.flash === "down" ? "price-flash-down" : "text-[var(--color-on-surface)]"
      }`}>
        {fmt(price)}
      </span>
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-medium tabular-nums ${up ? "text-emerald-500" : "text-rose-500"}`}>
        {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {up ? "+" : ""}{pct.toFixed(2)}%
      </span>
      <span className="text-[var(--color-outline)]/30 text-[10px] font-light ml-2">|</span>
    </span>
  )
}

export default function MarketTicker() {
  const [seeds, setSeeds] = useState<TickerSeed[]>([])

  useEffect(() => {
    const symbols = TICKER_SYMBOLS.map(s => s.symbol).join(",")
    fetch(`/api/market?symbols=${symbols}`)
      .then(r => r.json())
      .then((data: Record<string, any>) => {
        const result: TickerSeed[] = TICKER_SYMBOLS
          .map(s => {
            const q = data[s.symbol]
            if (!q?.currentPrice) return null
            return { symbol: s.symbol, name: s.name, price: q.currentPrice, changePercent: q.changePercent }
          })
          .filter(Boolean) as TickerSeed[]
        setSeeds(result)
      })
      .catch(() => {})
  }, [])

  if (seeds.length === 0) return null

  const all = [...seeds, ...seeds]

  return (
    <div className="overflow-hidden border-b border-[var(--color-outline)]/20 bg-[var(--color-surface)] select-none">
      <div className="flex animate-ticker whitespace-nowrap py-1.5">
        {all.map((seed, i) => (
          <LiveTickerItem key={`${seed.symbol}-${i}`} seed={seed} />
        ))}
      </div>
    </div>
  )
}
