"use client"

import { useState, useEffect, useRef } from "react"
import { useBinancePrice, isBinanceSupported, type LivePrice } from "./useBinancePrice"

const POLL_INTERVAL_MS = 15_000

// Deterministic stagger: spread symbols across the poll window so they don't all fire together
function symbolStagger(sym: string): number {
  let h = 0
  for (let i = 0; i < sym.length; i++) h = ((h * 31) + sym.charCodeAt(i)) >>> 0
  return h % POLL_INTERVAL_MS // 0 to POLL_INTERVAL_MS ms offset
}

function usePollingPrice(yahooSymbol: string, seed?: { price: number; changePercent: number }): LivePrice | null {
  const [live, setLive] = useState<LivePrice | null>(
    seed ? { price: seed.price, changePercent: seed.changePercent, change: 0, flash: null } : null
  )
  const prevRef  = useRef<number | null>(seed?.price ?? null)
  const flashRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval>

    const poll = async () => {
      try {
        const res  = await fetch(`/api/market?symbols=${encodeURIComponent(yahooSymbol)}&live=1`)
        const data = await res.json()
        const q    = data[yahooSymbol]
        if (!q || cancelled) return

        const newPrice = q.currentPrice as number
        const prev     = prevRef.current
        let flash: "up" | "down" | null = null

        if (prev !== null && newPrice !== prev) {
          flash = newPrice > prev ? "up" : "down"
          clearTimeout(flashRef.current)
          flashRef.current = setTimeout(() => {
            setLive(cur => cur ? { ...cur, flash: null } : null)
          }, 600)
        }
        prevRef.current = newPrice
        setLive({ price: newPrice, changePercent: q.changePercent, change: newPrice - (q.previousClose ?? newPrice), flash })
      } catch { /* network hiccup — keep last value */ }
    }

    // Stagger initial poll so symbols don't all fire at once
    const staggerId = setTimeout(() => {
      poll()
      intervalId = setInterval(poll, POLL_INTERVAL_MS)
    }, symbolStagger(yahooSymbol))

    return () => {
      cancelled = true
      clearTimeout(staggerId)
      clearInterval(intervalId)
      clearTimeout(flashRef.current)
    }
  }, [yahooSymbol])

  return live
}

// Unified hook: WebSocket for crypto, polling for everything else
export function useLivePrice(
  yahooSymbol: string,
  seed?: { price: number; changePercent: number }
): LivePrice | null {
  const binance = useBinancePrice(yahooSymbol)
  const polled  = usePollingPrice(
    isBinanceSupported(yahooSymbol) ? "__skip__" : yahooSymbol,
    seed
  )
  return isBinanceSupported(yahooSymbol) ? binance : polled
}

export type { LivePrice }
