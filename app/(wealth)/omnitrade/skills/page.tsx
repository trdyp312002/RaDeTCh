import { readMarkdown } from '@/lib/markdown'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'OmniTrade — Skill Tree' }

interface SkillNode {
  id: string
  label: string
  status: 'MASTERED' | 'AVAILABLE' | 'LOCKED'
  xp: number
  requires: string[]
}

interface SkillTree {
  id: string
  label: string
  color: string
  icon: string
  nodes: SkillNode[]
}

const statusStyle: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  MASTERED:  { border: '#00ff41', bg: 'rgba(0,255,65,0.12)',  text: '#00ff41', dot: '#00ff41' },
  AVAILABLE: { border: '#ffd700', bg: 'rgba(255,215,0,0.12)', text: '#ffd700', dot: '#ffd700' },
  LOCKED:    { border: '#2a2a4a', bg: 'rgba(0,0,0,0.2)',      text: '#4a4a6a', dot: '#2a2a4a' },
}

function NodeBadge({ node, color }: { node: SkillNode; color: string }) {
  const s = statusStyle[node.status]
  return (
    <div
      className="flex flex-col items-center gap-1.5 p-3 text-center"
      style={{
        background: s.bg,
        border: `2px solid ${node.status === 'AVAILABLE' ? color : s.border}`,
        boxShadow: node.status === 'MASTERED' ? `0 0 10px ${color}40` : 'none',
        minWidth: '100px',
        maxWidth: '120px',
        opacity: node.status === 'LOCKED' ? 0.5 : 1,
      }}
    >
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: node.status === 'MASTERED' ? color : s.dot }}
      />
      <span className="font-pixel leading-tight" style={{ color: node.status === 'LOCKED' ? '#4a4a6a' : color, fontSize: '7px' }}>
        {node.label}
      </span>
      <span className="font-pixel" style={{ color: '#ffd700', fontSize: '6px' }}>
        {node.xp} XP
      </span>
      <span className="font-pixel" style={{ color: s.text, fontSize: '6px' }}>
        {node.status === 'MASTERED' ? '✓ DONE' : node.status === 'AVAILABLE' ? '▶ READY' : '🔒'}
      </span>
    </div>
  )
}

export default function SkillsPage() {
  const { meta } = readMarkdown('skilltree', 'nodes')
  const trees = (meta as { trees: SkillTree[] }).trees

  const allNodes = trees.flatMap((t) => t.nodes)
  const mastered = allNodes.filter((n) => n.status === 'MASTERED').length
  const totalXp = allNodes.filter((n) => n.status === 'MASTERED').reduce((s, n) => s + n.xp, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>▶ PROGRESSION</p>
        <h1 className="font-pixel glow-magenta" style={{ color: 'var(--magenta)', fontSize: '18px' }}>
          SKILL TREE
        </h1>
        <div className="flex gap-6 mt-1">
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            MASTERED: <span style={{ color: '#00ff41' }}>{mastered}/{allNodes.length}</span>
          </span>
          <span className="font-pixel" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>
            TOTAL XP: <span style={{ color: 'var(--gold)' }}>{totalXp.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: '✓ MASTERED', color: '#00ff41' },
          { label: '▶ AVAILABLE', color: '#ffd700' },
          { label: '🔒 LOCKED', color: '#4a4a6a' },
        ].map((l) => (
          <span key={l.label} className="font-pixel" style={{ color: l.color, fontSize: '7px' }}>
            {l.label}
          </span>
        ))}
      </div>

      {/* Trees */}
      <div className="flex flex-col gap-8">
        {trees.map((tree) => {
          const masteredInTree = tree.nodes.filter((n) => n.status === 'MASTERED').length
          return (
            <div
              key={tree.id}
              className="p-5 flex flex-col gap-5"
              style={{ border: `2px solid ${tree.color}30`, background: 'var(--bg-card)' }}
            >
              {/* Tree header */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tree.icon}</span>
                <div>
                  <h2 className="font-pixel" style={{ color: tree.color, fontSize: '10px' }}>
                    {tree.label}
                  </h2>
                  <p className="font-pixel mt-1" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
                    {masteredInTree}/{tree.nodes.length} skills mastered
                  </p>
                </div>
                {/* Progress bar */}
                <div className="flex-1 ml-4">
                  <div className="h-2" style={{ background: 'var(--border-dim)' }}>
                    <div
                      className="h-2"
                      style={{
                        width: `${(masteredInTree / tree.nodes.length) * 100}%`,
                        background: tree.color,
                        boxShadow: `0 0 6px ${tree.color}`,
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Nodes — horizontal scroll on small screens */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-start gap-3 min-w-max">
                  {tree.nodes.map((node, i) => (
                    <div key={node.id} className="flex items-center">
                      <NodeBadge node={node} color={tree.color} />
                      {i < tree.nodes.length - 1 && (
                        <div
                          className="w-6 h-0.5 flex-shrink-0"
                          style={{
                            background:
                              node.status === 'MASTERED' ? tree.color : 'var(--border-dim)',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="font-pixel text-center" style={{ color: 'var(--text-dim)', fontSize: '7px' }}>
        UPDATE /data/skilltree/nodes.md TO CHANGE NODE STATUS
      </p>
    </div>
  )
}
