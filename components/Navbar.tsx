'use client'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav
      className="relative z-50 border-b-2 glass-card"
      style={{ borderColor: 'var(--border-dim)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/omnitrade" className="flex items-center gap-2">
            <span
              className="font-pixel text-sm glow-cyan"
              style={{ color: 'var(--cyan)', letterSpacing: '2px' }}
            >
              OMNI
            </span>
            <span
              className="font-pixel text-sm glow-magenta"
              style={{ color: 'var(--magenta)' }}
            >
              TRADE
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {[
              { href: '/omnitrade/team', label: '[ PARTY ]' },
              { href: '/omnitrade/architecture', label: '[ SYSTEM ]' },
              { href: '/omnitrade/quest', label: '[ QUESTS ]' },
              { href: '/omnitrade/skills', label: '[ SKILLS ]' },
              { href: '/omnitrade/guide', label: '[ CODEX ]' },
              { href: '/omnitrade/agent', label: '[ AGENT ]' },
              { href: '/omnitrade/dashboard', label: '[ HUD ]' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-pixel text-xs px-3 py-2 transition-colors"
                style={{ color: 'var(--text-dim)', fontSize: '9px' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--cyan)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-dim)'
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full blink"
              style={{ background: 'var(--green)' }}
            />
            <span
              className="font-pixel"
              style={{ color: 'var(--green)', fontSize: '8px' }}
            >
              LIVE
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}
