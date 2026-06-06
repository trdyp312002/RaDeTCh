interface MetricCardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean | null
  icon?: string
  color?: string
}

export default function MetricCard({ label, value, sub, positive, icon, color = '#00f5ff' }: MetricCardProps) {
  const valColor = positive === true ? '#00ff41' : positive === false ? '#ff4444' : color

  return (
    <div
      className="flex flex-col gap-2 p-4 glass-card"
      style={{
        border: `1px solid ${color}60`,
        boxShadow: `0 0 20px ${color}30`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
          {label}
        </span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <span
        className="font-pixel"
        style={{ color: valColor, fontSize: '16px', textShadow: `0 0 10px ${valColor}` }}
      >
        {value}
      </span>
      {sub && (
        <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
          {sub}
        </span>
      )}
    </div>
  )
}
