import { readAllMarkdown } from '@/lib/markdown'
import CharacterCard from '@/components/CharacterCard'
import SecretaryCommand from '@/components/SecretaryCommand'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OmniTrade — Party Roster' }

interface RoleMeta {
  title: string
  class: string
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

export default function TeamPage() {
  const roles = readAllMarkdown('roles')

  const sorted = [...roles].sort((a, b) => {
    if ((a.meta as RoleMeta).isSecretary) return -1
    if ((b.meta as RoleMeta).isSecretary) return 1
    return (b.meta as RoleMeta).level - (a.meta as RoleMeta).level
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ OPERATIONS CENTER
        </p>
        <h1 className="font-pixel glow-magenta" style={{ color: 'var(--magenta)', fontSize: '18px' }}>
          PARTY ROSTER
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {sorted.length} specialists deployed — all systems active
        </p>
      </div>

      {/* Secretary spotlight + Command Forge */}
      {sorted
        .filter((r) => (r.meta as RoleMeta).isSecretary)
        .map((r) => {
          const m = r.meta as RoleMeta
          return (
            <div key={r.slug} className="flex flex-col gap-4">
              <p className="font-pixel" style={{ color: 'var(--gold)', fontSize: '8px' }}>
                ★ COMMAND NEXUS — SPECIAL ROLE
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <CharacterCard
                  title={m.title}
                  className={m.class}
                  shortTitle={m.shortTitle}
                  icon={m.icon}
                  color={m.color}
                  rarity={m.rarity}
                  level={m.level}
                  xp={m.xp}
                  maxXp={m.maxXp}
                  hp={m.hp}
                  maxHp={m.maxHp}
                  responsibilities={m.responsibilities}
                  skills={m.skills}
                  isSecretary={true}
                />
                <SecretaryCommand />
              </div>
            </div>
          )
        })}

      {/* Core roster */}
      <div>
        <p className="font-pixel mb-4" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ■ CORE TEAM
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {sorted
            .filter((r) => !(r.meta as RoleMeta).isSecretary)
            .map((r) => {
              const m = r.meta as RoleMeta
              return (
                <CharacterCard
                  key={r.slug}
                  title={m.title}
                  className={m.class}
                  shortTitle={m.shortTitle}
                  icon={m.icon}
                  color={m.color}
                  rarity={m.rarity}
                  level={m.level}
                  xp={m.xp}
                  maxXp={m.maxXp}
                  hp={m.hp}
                  maxHp={m.maxHp}
                  responsibilities={m.responsibilities}
                  skills={m.skills}
                />
              )
            })}
        </div>
      </div>
    </div>
  )
}
