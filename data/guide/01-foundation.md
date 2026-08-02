---
chapter: 1
title: "The Foundation"
subtitle: "Technical Infrastructure"
icon: "🏗️"
color: "cyan"
xpReward: 400
topics:
  - name: "Programming Language"
    detail: "Python is #1 — strong libraries for data & finance: Pandas, NumPy, CCXT for exchange connectivity"
  - name: "Environment"
    detail: "Server running 24/7 required — AWS, Google Cloud, or VPS. No laptop trading."
  - name: "API Management"
    detail: "NEVER hardcode API keys. Use environment variables. Leaked keys = instant liquidation."
tools:
  - "Python 3.10+"
  - "CCXT"
  - "Pandas"
  - "NumPy"
  - "dotenv"
  - "AWS / GCP / VPS"
---

## Chapter Overview

The foundation is what every other component runs on. A shaky foundation means the entire system fails when you need it most — during high volatility, when fast execution matters most.

## Critical Rule

API keys must NEVER appear in source code files. Use `.env` files and environment variables. A leaked API key on GitHub is a total account loss.

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/guide/02-logic-execution|02-logic-execution]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/03-safety-risk|03-safety-risk]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/04-testing-workflow|04-testing-workflow]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/guide/05-strategy-tips|05-strategy-tips]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

