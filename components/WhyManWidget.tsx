'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface Message {
  role: 'user' | 'ai'
  text: string
}

export default function WhyManWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageTipLoaded, setPageTipLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load page-specific advice whenever the panel opens on a new page
  useEffect(() => {
    if (!open || pageTipLoaded) return
    setPageTipLoaded(true)
    setLoading(true)
    fetch('/api/life-secretary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'page_advice', page: pathname }),
    })
      .then((r) => r.json())
      .then((d) => {
        setMessages([{ role: 'ai', text: d.message || '...' }])
      })
      .catch(() => {
        setMessages([{ role: 'ai', text: '❌ ไม่สามารถโหลด advice ได้' }])
      })
      .finally(() => setLoading(false))
  }, [open, pathname, pageTipLoaded])

  // Reset tip when navigating to a new page
  useEffect(() => {
    setPageTipLoaded(false)
    setMessages([])
  }, [pathname])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await fetch('/api/life-secretary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, page: pathname }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'ai', text: data.message || '...' }])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: '❌ Error connecting to WhyMan' }])
    } finally {
      setLoading(false)
    }
  }

  // Don't show on login page
  if (pathname === '/login') return null

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Open WhyMan"
        >
          <span className="text-2xl">🧠</span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-200 bg-white overflow-hidden"
          style={{ maxHeight: 'min(540px, calc(100vh - 48px))' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🧠</span>
              <div>
                <div className="text-[14px] font-semibold leading-tight">WhyMan</div>
                <div className="text-[11px] text-slate-400 leading-tight truncate max-w-[200px]">
                  {pathname === '/' ? 'Home' : pathname.split('/').filter(Boolean).join(' › ')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && !loading && (
              <p className="text-center text-[13px] text-slate-400 pt-6">กำลังวิเคราะห์เพจนี้...</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[14px] shrink-0 mr-2 mt-0.5">🧠</span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[14px] shrink-0">🧠</span>
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="ถามอะไรก็ได้..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[13.5px] outline-none focus:border-slate-400 transition-colors placeholder:text-slate-400"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
