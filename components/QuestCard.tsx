interface QuestCardProps {
  step: number
  title: string
  subtitle: string
  icon: string
  color: string
  status: string
  xpReward: number
  duration: string
  tasks: string[]
}

const colorVars: Record<string, { border: string; text: string; badge: string }> = {
  blue: { border: '#3b82f6', text: '#60a5fa', badge: 'rgba(59,130,246,0.12)' },
  purple: { border: '#a855f7', text: '#c084fc', badge: 'rgba(168,85,247,0.12)' },
  cyan: { border: '#00f5ff', text: '#00f5ff', badge: 'rgba(0,245,255,0.12)' },
  green: { border: '#10b981', text: '#34d399', badge: 'rgba(16,185,129,0.12)' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: '✓ COMPLETED', color: '#00ff41' },
  IN_PROGRESS: { label: '► IN PROGRESS', color: '#ffd700' },
  LOCKED: { label: '🔒 LOCKED', color: '#4a4a6a' },
}

export default function QuestCard({
  step,
  title,
  subtitle,
  icon,
  color,
  status,
  xpReward,
  duration,
  tasks,
}: QuestCardProps) {
  const c = colorVars[color] ?? colorVars.blue
  const s = statusConfig[status] ?? { label: status, color: '#9ca3af' }
  const locked = status === 'LOCKED'

  return (
    <div
      className="flex gap-4 p-5 card-hover"
      style={{
        background: 'var(--bg-card)',
        border: `2px solid ${locked ? 'var(--border-dim)' : c.border}`,
        boxShadow: locked ? 'none' : `4px 4px 0 ${c.border}`,
        opacity: locked ? 0.6 : 1,
      }}
    >
      {/* Step number */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div
          className="w-10 h-10 flex items-center justify-center font-pixel text-base"
          style={{
            background: locked ? 'var(--border-dim)' : c.badge,
            border: `2px solid ${locked ? 'var(--border-dim)' : c.border}`,
            color: locked ? 'var(--text-dim)' : c.text,
          }}
        >
          {step}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-pixel mb-0.5" style={{ color: c.text, fontSize: '8px' }}>
              QUEST {step.toString().padStart(2, '0')}
            </p>
            <h3 className="font-bold text-white text-base">{title}</h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="font-pixel" style={{ color: s.color, fontSize: '7px' }}>
              {s.label}
            </span>
            <span className="font-pixel" style={{ color: '#ffd700', fontSize: '7px' }}>
              +{xpReward} XP
            </span>
            <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
              {duration}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="font-pixel mt-0.5 flex-shrink-0"
                style={{
                  color: status === 'COMPLETED' ? '#00ff41' : 'var(--text-dim)',
                  fontSize: '8px',
                }}
              >
                {status === 'COMPLETED' ? '☑' : '☐'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                {task}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
