interface CharacterCardProps {
  title: string
  className: string
  shortTitle: string
  icon: string
  color: string
  rarity: string
  level: number
  xp: number
  maxXp: number
  hp: number
  maxHp: number
  responsibilities: string[]
  skills: string[]
  isSecretary?: boolean
}

const colorVars: Record<string, { border: string; glow: string; text: string; badge: string; gradFrom: string; gradTo: string }> = {
  blue: {
    border: '#3b82f6',
    glow: 'rgba(59,130,246,0.4)',
    text: '#60a5fa',
    badge: 'rgba(59,130,246,0.15)',
    gradFrom: 'rgba(15,25,80,0.9)',
    gradTo: 'rgba(5,10,40,0.95)',
  },
  purple: {
    border: '#a855f7',
    glow: 'rgba(168,85,247,0.4)',
    text: '#c084fc',
    badge: 'rgba(168,85,247,0.15)',
    gradFrom: 'rgba(40,10,80,0.9)',
    gradTo: 'rgba(15,5,35,0.95)',
  },
  orange: {
    border: '#f97316',
    glow: 'rgba(249,115,22,0.4)',
    text: '#fb923c',
    badge: 'rgba(249,115,22,0.15)',
    gradFrom: 'rgba(80,30,5,0.9)',
    gradTo: 'rgba(30,10,2,0.95)',
  },
  green: {
    border: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    text: '#34d399',
    badge: 'rgba(16,185,129,0.15)',
    gradFrom: 'rgba(5,50,30,0.9)',
    gradTo: 'rgba(2,20,12,0.95)',
  },
  gold: {
    border: '#ffd700',
    glow: 'rgba(255,215,0,0.5)',
    text: '#ffd700',
    badge: 'rgba(255,215,0,0.15)',
    gradFrom: 'rgba(60,45,0,0.9)',
    gradTo: 'rgba(20,15,0,0.95)',
  },
}

const rarityColor: Record<string, string> = {
  COMMON: '#9ca3af',
  RARE: '#60a5fa',
  EPIC: '#a855f7',
  LEGENDARY: '#f97316',
  MYTHIC: '#ffd700',
}

const GRID_PATTERN =
  'repeating-linear-gradient(0deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 14px),' +
  'repeating-linear-gradient(90deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 14px)'

const SCANLINE =
  'repeating-linear-gradient(0deg,rgba(0,0,0,0.12) 0px,rgba(0,0,0,0.12) 1px,transparent 1px,transparent 3px)'

export default function CharacterCard({
  title,
  className,
  shortTitle,
  icon,
  color,
  rarity,
  level,
  xp,
  maxXp,
  hp,
  maxHp,
  responsibilities,
  skills,
  isSecretary,
}: CharacterCardProps) {
  const c = colorVars[color] ?? colorVars.blue
  const xpPct = Math.round((xp / maxXp) * 100)
  const hpPct = Math.round((hp / maxHp) * 100)
  const rc = rarityColor[rarity] ?? '#fff'

  return (
    <div
      className="relative flex flex-col card-hover glass-card overflow-hidden"
      style={{
        border: `1px solid ${c.border}60`,
        boxShadow: `0 0 30px ${c.glow}`,
      }}
    >
      {/* ── Portrait ─────────────────────────────────────────── */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{
          height: '190px',
          background: `linear-gradient(160deg, ${c.gradFrom} 0%, ${c.gradTo} 100%)`,
          backgroundImage: GRID_PATTERN,
        }}
      >
        {/* scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: SCANLINE, zIndex: 1 }}
        />

        {/* corner accent lines */}
        <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none" style={{ borderTop: `2px solid ${c.border}`, borderLeft: `2px solid ${c.border}`, opacity: 0.7 }} />
        <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none" style={{ borderTop: `2px solid ${c.border}`, borderRight: `2px solid ${c.border}`, opacity: 0.7 }} />
        <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none" style={{ borderBottom: `2px solid ${c.border}`, borderLeft: `2px solid ${c.border}`, opacity: 0.7 }} />
        <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none" style={{ borderBottom: `2px solid ${c.border}`, borderRight: `2px solid ${c.border}`, opacity: 0.7 }} />

        {/* glow circle behind icon */}
        <div
          className="absolute"
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
            zIndex: 1,
          }}
        />

        {/* icon */}
        <span
          className="relative z-10 select-none"
          style={{
            fontSize: '5rem',
            lineHeight: 1,
            filter: `drop-shadow(0 0 18px ${c.border}) drop-shadow(0 0 36px ${c.glow})`,
          }}
        >
          {icon}
        </span>

        {/* rarity badge top-left */}
        <div
          className="absolute top-2.5 left-3 font-pixel z-10"
          style={{ color: rc, fontSize: '7px', textShadow: `0 0 8px ${rc}` }}
        >
          ◆ {rarity}
        </div>

        {/* SPECIAL / level badge top-right */}
        {isSecretary ? (
          <div
            className="absolute top-2.5 right-3 font-pixel z-10"
            style={{ color: 'var(--gold)', fontSize: '7px', textShadow: '0 0 8px var(--gold)' }}
          >
            ★ SPECIAL
          </div>
        ) : (
          <div
            className="absolute top-2.5 right-3 font-pixel z-10 px-2 py-0.5"
            style={{ background: c.badge, border: `1px solid ${c.border}60`, color: c.text, fontSize: '7px' }}
          >
            LVL {level}
          </div>
        )}

        {/* class name bottom */}
        <div
          className="absolute bottom-2.5 left-0 right-0 text-center font-pixel z-10 pointer-events-none"
          style={{ color: c.text, fontSize: '7px', opacity: 0.6, letterSpacing: '0.15em' }}
        >
          {className}
        </div>
      </div>

      {/* ── Info ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-5">
        {/* title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white text-sm leading-tight">{title}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {shortTitle}
            </p>
          </div>
          {isSecretary && (
            <div
              className="flex flex-col items-center px-3 py-2 shrink-0"
              style={{ background: c.badge, border: `1px solid ${c.border}` }}
            >
              <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '6px' }}>LVL</span>
              <span className="font-pixel text-lg leading-tight" style={{ color: c.text }}>{level}</span>
            </div>
          )}
        </div>

        {/* HP */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-pixel" style={{ color: '#ff4444', fontSize: '7px' }}>HP</span>
            <span className="font-pixel" style={{ color: '#ff4444', fontSize: '7px' }}>{hp}/{maxHp}</span>
          </div>
          <div className="h-2 w-full" style={{ background: 'var(--border-dim)' }}>
            <div
              className="h-2 transition-all duration-1000"
              style={{ width: `${hpPct}%`, background: '#ff4444', boxShadow: '0 0 6px #ff4444' }}
            />
          </div>
        </div>

        {/* XP */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-pixel" style={{ color: c.text, fontSize: '7px' }}>XP</span>
            <span className="font-pixel" style={{ color: c.text, fontSize: '7px' }}>
              {xp.toLocaleString()}/{maxXp.toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full" style={{ background: 'var(--border-dim)' }}>
            <div
              className="h-2 transition-all duration-1000"
              style={{ width: `${xpPct}%`, background: c.text, boxShadow: `0 0 6px ${c.text}` }}
            />
          </div>
        </div>

        {/* Duties */}
        <div>
          <p className="font-pixel mb-2" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>DUTIES</p>
          <ul className="space-y-1.5">
            {responsibilities.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: c.text, flexShrink: 0 }}>▸</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Skills */}
        <div>
          <p className="font-pixel mb-2" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>ABILITIES</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="font-pixel px-2 py-1"
                style={{
                  color: c.text,
                  background: c.badge,
                  border: `1px solid ${c.border}`,
                  fontSize: '7px',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
