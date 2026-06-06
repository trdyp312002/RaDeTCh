import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import '../../globals.css'
import Navbar from '@/components/Navbar'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'OmniTrade — Algorithmic Trading System',
  description: 'Professional algorithmic trading operations platform',
}

export default function OmnitradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`omnitrade-theme ${geistMono.variable} min-h-screen flex flex-col antialiased relative`} style={{ background: 'var(--bg-dark)' }}>
      <div className="space-bg" aria-hidden="true">
        <div className="space-stars" />
        <div className="space-nebula" />
      </div>
      <Navbar />
      <main className="flex-1 relative z-10">{children}</main>
      <footer
        className="relative z-10 border-t-2 py-3 text-center font-pixel"
        style={{ borderColor: 'var(--border-dim)', color: 'var(--text-dim)', fontSize: '7px' }}
      >
        OMNITRADE SYSTEM v2.4 &nbsp;|&nbsp; ALL SYSTEMS NOMINAL &nbsp;|&nbsp; 2026
      </footer>
    </div>
  )
}
