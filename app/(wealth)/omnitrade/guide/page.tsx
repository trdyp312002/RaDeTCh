import { readAllMarkdown } from '@/lib/markdown'
import GuideCard from '@/components/GuideCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OmniTrade — Knowledge Codex' }

interface GuideMeta {
  chapter: number
  title: string
  subtitle: string
  icon: string
  color: string
  xpReward: number
  topics: { name: string; detail: string }[]
  tools: string[]
}

export default function GuidePage() {
  const chapters = readAllMarkdown('guide').sort(
    (a, b) => (a.meta as GuideMeta).chapter - (b.meta as GuideMeta).chapter
  )

  const totalXp = chapters.reduce((sum, c) => sum + (c.meta as GuideMeta).xpReward, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
          ▶ KNOWLEDGE BASE
        </p>
        <h1 className="font-pixel glow-cyan" style={{ color: 'var(--cyan)', fontSize: '18px' }}>
          TRADING BOT CODEX
        </h1>
        <div className="flex gap-6 mt-1">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            CHAPTERS: <span style={{ color: 'var(--cyan)' }}>{chapters.length}</span>
          </span>
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            TOTAL XP: <span style={{ color: 'var(--gold)' }}>{totalXp.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Intro banner */}
      <div
        className="p-4 font-pixel"
        style={{ border: '1px solid var(--border-bright)', background: 'var(--bg-card)', fontSize: '8px', lineHeight: 2.5 }}
      >
        <p style={{ color: 'var(--cyan)' }}>■ OBJECTIVE</p>
        <p style={{ color: 'var(--text-primary)' }}>
          Build a high-reliability automated trading system — not just code that can buy/sell, but a system with
          real credibility: consistent returns, capital preservation, and zero single points of failure.
        </p>
      </div>

      {/* Chapters */}
      <div className="flex flex-col gap-6">
        {chapters.map((ch) => {
          const m = ch.meta as GuideMeta
          return (
            <GuideCard
              key={ch.slug}
              chapter={m.chapter}
              title={m.title}
              subtitle={m.subtitle}
              icon={m.icon}
              color={m.color}
              xpReward={m.xpReward}
              topics={m.topics}
              tools={m.tools}
            />
          )
        })}
      </div>
    </div>
  )
}
