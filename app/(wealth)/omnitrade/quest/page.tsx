import { readAllMarkdown } from '@/lib/markdown'
import QuestCard from '@/components/QuestCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OmniTrade — Quest Log' }

interface WorkflowMeta {
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

export default function QuestPage() {
  const quests = readAllMarkdown('workflow').sort(
    (a, b) => (a.meta as WorkflowMeta).step - (b.meta as WorkflowMeta).step
  )

  const completed = quests.filter((q) => (q.meta as WorkflowMeta).status === 'COMPLETED').length
  const totalXp = quests
    .filter((q) => (q.meta as WorkflowMeta).status === 'COMPLETED')
    .reduce((sum, q) => sum + (q.meta as WorkflowMeta).xpReward, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ OPERATIONS LOG
        </p>
        <h1 className="font-pixel glow-gold" style={{ color: 'var(--gold)', fontSize: '18px' }}>
          QUEST LOG
        </h1>
        <div className="flex items-center gap-6 mt-1">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            PROGRESS:{' '}
            <span style={{ color: 'var(--green)' }}>
              {completed}/{quests.length}
            </span>
          </span>
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            XP EARNED:{' '}
            <span style={{ color: 'var(--gold)' }}>{totalXp.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-3" style={{ background: 'var(--border-dim)' }}>
          <div
            className="h-3 transition-all duration-1000"
            style={{
              width: `${(completed / quests.length) * 100}%`,
              background: 'var(--gold)',
              boxShadow: '0 0 10px var(--gold)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
            CAMPAIGN PROGRESS
          </span>
          <span className="font-pixel" style={{ color: 'var(--gold)', fontSize: '7px' }}>
            {Math.round((completed / quests.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Quests */}
      <div className="flex flex-col gap-4">
        {quests.map((q) => {
          const m = q.meta as WorkflowMeta
          return (
            <QuestCard
              key={q.slug}
              step={m.step}
              title={m.title}
              subtitle={m.subtitle}
              icon={m.icon}
              color={m.color}
              status={m.status}
              xpReward={m.xpReward}
              duration={m.duration}
              tasks={m.tasks}
            />
          )
        })}
      </div>
    </div>
  )
}
