---
title: "Data Handler"
ability: "Market Sight"
icon: "📡"
color: "cyan"
level: 40
status: "ONLINE"
latency: "12ms"
description: "Fetches real-time price and order book data from exchange APIs and WebSocket streams"
responsibilities:
  - "Connect to Exchange WebSocket streams for tick-level data"
  - "Normalize and clean data from multiple exchange sources"
  - "Cache market data in Redis for ultra-low latency reads"
  - "Distribute real-time feeds to Strategy Engine and Risk modules"
  - "Handle reconnection and data gap detection automatically"
dependencies: []
---

## Module Overview

The eyes of OmniTrade. Without reliable, low-latency market data, every other module is blind. Data Handler is always the first module to start and the last to stop.

## Data Sources

- Binance WebSocket (primary)
- Bybit REST fallback
- Internal Redis cache layer

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/architecture/execution-module|execution-module]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/strategy-engine|strategy-engine]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/backtesting-engine|backtesting-engine]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/risk-portfolio-manager|risk-portfolio-manager]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

