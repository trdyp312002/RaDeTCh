import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export type AgentStatus = "idle" | "coding" | "reading" | "waiting" | "done" | "spawning" | "error"

export interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  task: string
  progress: number // 0–100
  spawnedBy?: string
  updatedAt: string
}

// In-memory store — reset on server restart
// Wire to real system by POSTing from your agent runner
const store: Map<string, Agent> = new Map()

const DEFAULTS: Agent[] = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Manager",
    status: "idle",
    task: "Waiting for instructions",
    progress: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "researcher",
    name: "Researcher",
    role: "Research",
    status: "idle",
    task: "Standing by",
    progress: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "coder",
    name: "Coder",
    role: "Engineering",
    status: "idle",
    task: "Standing by",
    progress: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "reviewer",
    name: "Reviewer",
    role: "QA",
    status: "idle",
    task: "Standing by",
    progress: 0,
    updatedAt: new Date().toISOString(),
  },
]

function ensureDefaults() {
  if (store.size === 0) {
    DEFAULTS.forEach((a) => store.set(a.id, a))
  }
}

export async function GET() {
  ensureDefaults()
  return NextResponse.json(Array.from(store.values()))
}

// POST — upsert agent (create or full replace)
export async function POST(req: NextRequest) {
  ensureDefaults()
  try {
    const body = await req.json()
    const { id, name, role, status, task, progress, spawnedBy } = body
    if (!id || !name) {
      return NextResponse.json({ error: "id and name required" }, { status: 400 })
    }
    const agent: Agent = {
      id,
      name,
      role: role ?? "Agent",
      status: status ?? "idle",
      task: task ?? "",
      progress: progress ?? 0,
      spawnedBy,
      updatedAt: new Date().toISOString(),
    }
    store.set(id, agent)
    return NextResponse.json(agent, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

// PATCH — partial update
export async function PATCH(req: NextRequest) {
  ensureDefaults()
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const existing = store.get(id)
    if (!existing) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    const updated: Agent = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    store.set(id, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

// DELETE — remove agent by id (?id=xxx)
export async function DELETE(req: NextRequest) {
  ensureDefaults()
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const existed = store.delete(id)
  if (!existed) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ deleted: id })
}
