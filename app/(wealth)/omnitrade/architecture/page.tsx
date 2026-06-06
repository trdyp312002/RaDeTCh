import { readAllMarkdown } from '@/lib/markdown'
import ModuleCard from '@/components/ModuleCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OmniTrade — System Architecture' }

interface ModuleMeta {
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

const moduleOrder = [
  'data-handler',
  'strategy-engine',
  'risk-portfolio-manager',
  'execution-module',
  'backtesting-engine',
]

export default function ArchitecturePage() {
  const all = readAllMarkdown('architecture')
  const modules = moduleOrder
    .map((slug) => all.find((m) => m.slug === slug))
    .filter(Boolean) as typeof all

  const onlineCount = modules.filter((m) => (m.meta as ModuleMeta).status === 'ONLINE').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ SYSTEM CORE
        </p>
        <h1 className="font-pixel glow-cyan" style={{ color: 'var(--cyan)', fontSize: '18px' }}>
          BOT ARCHITECTURE
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {onlineCount}/{modules.length} modules ONLINE
        </p>
      </div>

      {/* Flow diagram label */}
      <div
        className="p-3 font-pixel text-center"
        style={{
          border: '1px solid var(--border-dim)',
          color: 'var(--text-dim)',
          fontSize: '8px',
          letterSpacing: '2px',
        }}
      >
        DATA HANDLER → STRATEGY ENGINE → RISK MANAGER → EXECUTION → [EXCHANGE]
        <br />
        <span style={{ color: '#4a4a6a' }}>
          BACKTESTING ENGINE (offline simulation — reads from Data Handler)
        </span>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const m = mod.meta as ModuleMeta
          return (
            <ModuleCard
              key={mod.slug}
              title={m.title}
              ability={m.ability}
              icon={m.icon}
              color={m.color}
              level={m.level}
              status={m.status}
              latency={m.latency}
              description={m.description}
              responsibilities={m.responsibilities}
              dependencies={m.dependencies}
            />
          )
        })}
      </div>
    </div>
  )
}
