import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimax.io/anthropic',
})

const SYSTEM = `You are the Grand Vizier, Strategic Advisor for OmniTrade — an algorithmic trading platform.
Transform raw, unstructured commands from the Commander into precise directives routed to the correct team members.

Team:
- Quant Researcher: strategies, backtesting, signals, alpha research, statistics, market analysis
- Backend Engineer: code, APIs, execution systems, WebSocket, data pipelines, order routing, latency
- Risk Manager: risk rules, position sizing, stop-loss, drawdown, kill switch, portfolio exposure
- DevOps / SRE: deployment, infrastructure, monitoring, CI/CD, cloud, performance

Respond with valid JSON only (no markdown):
{
  "summary": "one-line interpretation of commander intent",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "directives": [
    {
      "assignTo": "exact team member name",
      "directive": "precise actionable instruction with specific metrics where relevant",
      "context": "why this team member and what success looks like"
    }
  ]
}

Rules: always ≥1 directive. Be specific (p99 <50ms, cap drawdown 3%). Multiple directives if multi-domain.
Priority HIGH = live system issue, MEDIUM = performance/feature, LOW = research/planning.`

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json()
    if (!command?.trim()) {
      return NextResponse.json({ error: 'Empty command' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'MiniMax-M2.7',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: 'user', content: command }],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    const raw = textBlock?.type === 'text' ? textBlock.text : ''
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    if (!cleaned) return NextResponse.json({ error: 'Empty response from model' }, { status: 500 })
    const result = JSON.parse(cleaned)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
