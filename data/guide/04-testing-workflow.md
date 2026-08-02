---
chapter: 4
title: "Testing Workflow"
subtitle: "Trial Protocol Before the Arena"
icon: "⚗️"
color: "green"
xpReward: 700
topics:
  - name: "Paper Trading"
    detail: "Run bot with simulated money in live market first. Verify order logic and API reliability without real risk."
  - name: "Latency Check"
    detail: "Measure gap between price received and order sent. In volatile markets, milliseconds impact fill quality."
  - name: "Small Real Trading"
    detail: "Start with minimum allowed capital. Test portfolio management, fees, and spread in real conditions before scaling."
tools:
  - "Exchange Paper Trading"
  - "Wireshark (latency)"
  - "Pytest"
  - "Locust (load test)"
  - "Grafana (monitoring)"
---

## Chapter Overview

No strategy goes live without surviving the full trial protocol. Each phase eliminates a different class of failure. Skipping any phase introduces risks that cost real money.

## Trial Sequence

```
Backtest (historical) → Paper Trade (live, fake money) → Latency Test → Small Real ($50-100) → Scale
```

Minimum 2 weeks of paper trading with zero crashes before advancing to real capital.

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/guide/02-logic-execution|02-logic-execution]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/03-safety-risk|03-safety-risk]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/05-strategy-tips|05-strategy-tips]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/01-foundation|01-foundation]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

