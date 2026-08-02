---
title: "Risk & Portfolio Manager"
ability: "Iron Shield"
icon: "🛡️"
color: "orange"
level: 50
status: "ONLINE"
latency: "3ms"
description: "Guardian module — validates every trade signal against risk rules before execution is allowed"
responsibilities:
  - "Evaluate all signals against position sizing limits"
  - "Enforce max drawdown, daily loss, and exposure caps"
  - "Track real-time portfolio state across all open positions"
  - "Trigger Kill Switch if any critical threshold is breached"
  - "Log all risk decisions for compliance and audit"
dependencies:
  - "strategy-engine"
  - "data-handler"
---

## Module Overview

No signal passes to Execution without Iron Shield's approval. This is the last line of defense before real money moves. It operates faster than any human can react — in microseconds, it decides GO or BLOCK.

## Risk Rules (Always Active)

- Max position size: 2% of portfolio per trade
- Max daily loss: -5% triggers trading halt
- Max drawdown: -15% triggers full system shutdown
- Correlation limit: No more than 60% in correlated assets

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/architecture/execution-module|execution-module]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/strategy-engine|strategy-engine]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/backtesting-engine|backtesting-engine]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/data-handler|data-handler]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

