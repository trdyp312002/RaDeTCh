interface Topic {
  name: string
  detail: string
}

interface GuideCardProps {
  chapter: number
  title: string
  subtitle: string
  icon: string
  color: string
  xpReward: number
  topics: Topic[]
  tools: string[]
}

const colorVars: Record<string, { border: string; text: string; badge: string; glow: string }> = {
  cyan:   { border: '#00f5ff', text: '#00f5ff', badge: 'rgba(0,245,255,0.08)',   glow: 'rgba(0,245,255,0.25)' },
  purple: { border: '#a855f7', text: '#c084fc', badge: 'rgba(168,85,247,0.08)', glow: 'rgba(168,85,247,0.25)' },
  orange: { border: '#f97316', text: '#fb923c', badge: 'rgba(249,115,22,0.08)', glow: 'rgba(249,115,22,0.25)' },
  green:  { border: '#10b981', text: '#34d399', badge: 'rgba(16,185,129,0.08)', glow: 'rgba(16,185,129,0.25)' },
  gold:   { border: '#ffd700', text: '#ffd700', badge: 'rgba(255,215,0,0.08)',   glow: 'rgba(255,215,0,0.25)' },
}

export default function GuideCard({ chapter, title, subtitle, icon, color, xpReward, topics, tools }: GuideCardProps) {
  const c = colorVars[color] ?? colorVars.cyan

  return (
    <div
      className="flex flex-col gap-5 p-6 card-hover"
      style={{
        background: 'var(--bg-card)',
        border: `2px solid ${c.border}`,
        boxShadow: `4px 4px 0 ${c.border}, 0 0 24px ${c.glow}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="flex flex-col items-center justify-center w-14 h-14 flex-shrink-0"
          style={{ background: c.badge, border: `2px solid ${c.border}` }}
        >
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>CH.</span>
          <span className="font-pixel" style={{ color: c.text, fontSize: '18px' }}>{chapter.toString().padStart(2, '0')}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{icon}</span>
            <span className="font-pixel" style={{ color: '#ffd700', fontSize: '7px' }}>+{xpReward} XP</span>
          </div>
          <h2 className="font-bold text-white text-lg leading-tight">{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>
        </div>
      </div>

      {/* Topics */}
      <div className="flex flex-col gap-3">
        {topics.map((t, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${c.border}`, paddingLeft: '12px' }}>
            <p className="font-pixel mb-1" style={{ color: c.text, fontSize: '8px' }}>{t.name}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{t.detail}</p>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div>
        <p className="font-pixel mb-2" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>TOOLS & TECH</p>
        <div className="flex flex-wrap gap-1.5">
          {tools.map((tool, i) => (
            <span
              key={i}
              className="font-pixel px-2 py-1"
              style={{ color: c.text, background: c.badge, border: `1px solid ${c.border}`, fontSize: '7px' }}
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
