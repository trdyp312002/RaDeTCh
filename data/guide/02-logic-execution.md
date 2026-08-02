---
chapter: 2
title: "The Logic & Execution"
subtitle: "Brain & Combat Mechanics"
icon: "🧠"
color: "purple"
xpReward: 600
topics:
  - name: "Data Feed"
    detail: "Real-time price data via WebSocket (faster than REST). Latency matters — milliseconds decide profit."
  - name: "Strategy Module"
    detail: "Calculates BUY/SELL signals. Examples: RSI divergence, Moving Average crossover, ML models."
  - name: "Execution Engine"
    detail: "Sends orders via Exchange API. Must handle order queue, retry logic, and API failures gracefully."
tools:
  - "WebSocket"
  - "CCXT"
  - "TA-Lib"
  - "scikit-learn"
  - "asyncio"
  - "Redis (queue)"
---

## Chapter Overview

The logic layer is where alpha is generated and where it is lost. Even a perfect strategy fails if the execution engine is slow or crashes under load. Treat execution as seriously as the strategy itself.

## Order of Operations

```
Market Data → Signal Calculation → Risk Check → Order Construction → Exchange API → Fill Confirmation
```

Every step can fail. Every step needs error handling.

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/guide/04-testing-workflow|04-testing-workflow]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/03-safety-risk|03-safety-risk]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/05-strategy-tips|05-strategy-tips]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/01-foundation|01-foundation]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

