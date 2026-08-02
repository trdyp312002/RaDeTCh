---
title: "Strategic Advisor"
class: "Grand Vizier"
shortTitle: "Advisor"
icon: "📋"
color: "gold"
rarity: "MYTHIC"
level: 60
xp: 11500
maxXp: 15000
hp: 100
maxHp: 100
headcount: 1
isSecretary: true
responsibilities:
  - "Receive rough, unstructured commands from the Commander (you)"
  - "Parse intent and translate into precise, actionable directives"
  - "Route each directive to the correct team member based on domain"
  - "Track task status across all active assignments"
  - "Surface blockers and conflicts before they become problems"
  - "Compile weekly briefings and status summaries for the Commander"
skills:
  - "Command Parsing"
  - "Task Routing"
  - "Priority Management"
  - "Cross-team Coordination"
  - "Briefing & Reporting"
  - "Conflict Resolution"
routingMap:
  - keyword: "strategy"
    assignTo: "Quant Researcher"
  - keyword: "backtest"
    assignTo: "Quant Researcher"
  - keyword: "signal"
    assignTo: "Quant Researcher"
  - keyword: "code"
    assignTo: "Backend Engineer"
  - keyword: "api"
    assignTo: "Backend Engineer"
  - keyword: "execution"
    assignTo: "Backend Engineer"
  - keyword: "risk"
    assignTo: "Risk Manager"
  - keyword: "drawdown"
    assignTo: "Risk Manager"
  - keyword: "stop"
    assignTo: "Risk Manager"
  - keyword: "deploy"
    assignTo: "DevOps / SRE"
  - keyword: "server"
    assignTo: "DevOps / SRE"
  - keyword: "monitor"
    assignTo: "DevOps / SRE"
---

## Role Overview

The Grand Vizier is the bridge between the Commander's vision and the team's execution. When the Commander says *"make the bot stop losing when market crashes"*, the Vizier translates this into three separate directives: a Risk Manager briefing on Kill Switch thresholds, a Quant task to research volatility-based exit signals, and a Backend task to implement the circuit breaker.

No command reaches the team without the Vizier's refinement.

## Command Translation Example

**Raw command:** "the bot is too slow"

**Translated directives:**
- → **Backend Engineer:** Profile order submission latency. Identify bottlenecks in REST vs WebSocket path. Target p99 < 80ms.
- → **DevOps / SRE:** Check server co-location options. Review network path to exchange. Report latency baseline by EOD.

## Special Abilities

- **COMMAND FORGE** — Transform vague intent into precise, actionable directives
- **SMART ROUTE** — Automatically assign tasks to the correct team member
- **PRIORITY SHIELD** — Flag conflicting priorities before they cause friction
- **WEEKLY ORACLE** — Generate status briefings across all active operations

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/roles/backend-engineer|backend-engineer]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/roles/risk-manager|risk-manager]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/roles/devops-sre|devops-sre]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/roles/quant-researcher|quant-researcher]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

