"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export type LivePrice = {
  price: number
  changePercent: number
  change: number
  flash: "up" | "down" | null
}

const YAHOO_TO_BINANCE: Record<string, string> = {
  "BTC-USD": "btcusdt",
  "ETH-USD": "ethusdt",
  "BNB-USD": "bnbusdt",
  "SOL-USD": "solusdt",
}

export function isBinanceSupported(yahooSymbol: string): boolean {
  return yahooSymbol in YAHOO_TO_BINANCE
}

export function useBinancePrice(yahooSymbol: string): LivePrice | null {
  const [live, setLive] = useState<LivePrice | null>(null)
  const prevPriceRef = useRef<number | null>(null)
  const wsRef        = useRef<WebSocket | null>(null)
  const retryRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const flashRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const connect = useCallback(() => {
    const stream = YAHOO_TO_BINANCE[yahooSymbol]
    if (!stream) return

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}@ticker`)
    wsRef.current = ws

    ws.onmessage = (evt) => {
      try {
        const d = JSON.parse(evt.data as string)
        const price = parseFloat(d.c)
        const changePercent = parseFloat(d.P)
        const change = parseFloat(d.p)

        const prev = prevPriceRef.current
        let flash: "up" | "down" | null = null
        if (prev !== null && price !== prev) {
          flash = price > prev ? "up" : "down"
          clearTimeout(flashRef.current)
          flashRef.current = setTimeout(() => {
            setLive(cur => cur ? { ...cur, flash: null } : null)
          }, 600)
        }

        prevPriceRef.current = price
        setLive({ price, changePercent, change, flash })
      } catch { /* skip malformed message */ }
    }

    ws.onclose = () => {
      retryRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }, [yahooSymbol])

  useEffect(() => {
    if (!isBinanceSupported(yahooSymbol)) return
    connect()
    return () => {
      clearTimeout(retryRef.current)
      clearTimeout(flashRef.current)
      wsRef.current?.close()
    }
  }, [yahooSymbol, connect])

  return live
}
