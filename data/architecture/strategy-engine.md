---
title: "Strategy Engine"
ability: "Alpha Core"
icon: "🧠"
color: "blue"
level: 55
status: "ONLINE"
latency: "8ms"
description: "The brain of OmniTrade — calculates BUY/SELL signals based on configured strategies"
responsibilities:
  - "Process incoming market data from Data Handler"
  - "Execute strategy logic to generate trade signals"
  - "Support multiple concurrent strategies with isolation"
  - "Emit signals to Execution Module with full metadata"
  - "Log all signal decisions for audit and research"
dependencies:
  - "data-handler"
---

## Module Overview

The Strategy Engine is the core intelligence. It receives a stream of market data and continuously evaluates whether conditions are met for a trade. Every decision is logged, timestamped, and auditable.

## Supported Strategy Types

- Trend Following (EMA crossover, Breakout)
- Mean Reversion (Bollinger Bands, RSI)
- DCA (Dollar Cost Averaging)
- Arbitrage (Cross-exchange spread)

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/architecture/backtesting-engine|backtesting-engine]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/execution-module|execution-module]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/data-handler|data-handler]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/risk-portfolio-manager|risk-portfolio-manager]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

