interface ModuleCardProps {
  title: string
  ability: string
  icon: string
  color: string
  level: number
  status: string
  latency: string
  description: string
  responsibilities: string[]
  dependencies: string[]
}

const colorVars: Record<string, { border: string; glow: string; text: string; badge: string }> = {
  cyan: { border: '#00f5ff', glow: 'rgba(0,245,255,0.3)', text: '#00f5ff', badge: 'rgba(0,245,255,0.1)' },
  blue: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', text: '#60a5fa', badge: 'rgba(59,130,246,0.1)' },
  yellow: { border: '#ffd700', glow: 'rgba(255,215,0,0.3)', text: '#ffd700', badge: 'rgba(255,215,0,0.1)' },
  orange: { border: '#f97316', glow: 'rgba(249,115,22,0.3)', text: '#fb923c', badge: 'rgba(249,115,22,0.1)' },
  purple: { border: '#a855f7', glow: 'rgba(168,85,247,0.3)', text: '#c084fc', badge: 'rgba(168,85,247,0.1)' },
}

const statusColor: Record<string, string> = {
  ONLINE: '#00ff41',
  STANDBY: '#ffd700',
  OFFLINE: '#ff4444',
  ERROR: '#ff4444',
}

export default function ModuleCard({
  title,
  ability,
  icon,
  color,
  level,
  status,
  latency,
  description,
  responsibilities,
  dependencies,
}: ModuleCardProps) {
  const c = colorVars[color] ?? colorVars.cyan
  const sc = statusColor[status] ?? '#9ca3af'

  return (
    <div
      className="flex flex-col gap-4 p-5 card-hover"
      style={{
        background: 'var(--bg-card)',
        border: `2px solid ${c.border}`,
        boxShadow: `4px 4px 0 ${c.border}, 0 0 16px ${c.glow}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="font-pixel mb-1" style={{ color: c.text, fontSize: '8px' }}>
              ABILITY: {ability}
            </p>
            <h3 className="font-bold text-white text-sm">{title}</h3>
          </div>
        </div>
        <div
          className="flex flex-col items-center px-2 py-1 flex-shrink-0"
          style={{ background: c.badge, border: `1px solid ${c.border}` }}
        >
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>LV</span>
          <span className="font-pixel" style={{ color: c.text, fontSize: '14px' }}>{level}</span>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full blink" style={{ background: sc }} />
          <span className="font-pixel" style={{ color: sc, fontSize: '7px' }}>{status}</span>
        </div>
        {latency !== 'N/A' && (
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
            LATENCY: {latency}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
        {description}
      </p>

      {/* Responsibilities */}
      <div>
        <p className="font-pixel mb-2" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>FUNCTIONS</p>
        <ul className="space-y-1">
          {responsibilities.slice(0, 4).map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: c.text, flexShrink: 0 }}>▸</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div>
          <p className="font-pixel mb-2" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>REQUIRES</p>
          <div className="flex flex-wrap gap-1">
            {dependencies.map((dep, i) => (
              <span
                key={i}
                className="font-pixel px-2 py-1"
                style={{ color: c.text, background: c.badge, border: `1px solid ${c.border}`, fontSize: '7px' }}
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
