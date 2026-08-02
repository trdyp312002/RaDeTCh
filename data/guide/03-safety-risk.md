---
chapter: 3
title: "Safety & Risk Management"
subtitle: "The Iron Laws — Most Critical"
icon: "🛡️"
color: "orange"
xpReward: 800
topics:
  - name: "Position Sizing"
    detail: "Bot must calculate how much to risk per trade. Rule: never more than 2% of portfolio per position."
  - name: "Kill Switch"
    detail: "Emergency stop system. If loss exceeds threshold OR price moves abnormally — halt all trading and liquidate immediately."
  - name: "Logging & Alerting"
    detail: "Full activity logs + Telegram/Discord alerts on every trade and every anomaly. Silent bots are dangerous bots."
  - name: "Backtesting System"
    detail: "Test strategy on historical data. Key metrics: Win Rate, Max Drawdown, Sharpe Ratio, Profit Factor."
tools:
  - "Python logging"
  - "Telegram Bot API"
  - "Discord Webhooks"
  - "Backtesting.py"
  - "VectorBT"
  - "PostgreSQL (logs)"
---

## Chapter Overview

Risk management is not optional — it IS the product. A trading bot without proper risk controls is not a tool, it's a time bomb. The Kill Switch must be the most reliable, most tested component in the entire system.

## The Iron Laws

1. Max 2% capital risk per trade
2. Max 10% daily loss → trading halt
3. Max 15% drawdown → full shutdown
4. All positions logged with timestamp
5. Alert within 1 second of any anomaly

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/guide/04-testing-workflow|04-testing-workflow]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/05-strategy-tips|05-strategy-tips]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/02-logic-execution|02-logic-execution]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/01-foundation|01-foundation]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

