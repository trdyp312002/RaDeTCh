---
title: "Backtesting Engine"
ability: "Time Vision"
icon: "⏳"
color: "purple"
level: 43
status: "STANDBY"
latency: "N/A"
description: "Simulate strategies against years of historical data before a single dollar goes live"
responsibilities:
  - "Load and preprocess historical OHLCV data from multiple exchanges"
  - "Replay market data through Strategy Engine in simulation mode"
  - "Calculate full performance stats: PnL, Win Rate, Drawdown, Sharpe"
  - "Generate visual backtest reports with trade-by-trade breakdown"
  - "Support parameter optimization (grid search, Bayesian)"
dependencies:
  - "strategy-engine"
---

## Module Overview

Time Vision is the secret weapon. Before risking real capital, every strategy must survive the gauntlet of historical data. A strategy that cannot survive the past has no place in the present.

## Key Metrics Reported

- Total Return, CAGR
- Max Drawdown (peak-to-trough)
- Sharpe / Sortino / Calmar Ratio
- Win Rate, Profit Factor, Avg Win/Loss
- Number of trades, average holding period

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/data/architecture/strategy-engine|strategy-engine]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/data-handler|data-handler]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/risk-portfolio-manager|risk-portfolio-manager]] — อยู่ในกลุ่มข้อมูลเดียวกัน
- [[BRAIN/02-Projects/radetch/data/architecture/execution-module|execution-module]] — อยู่ในกลุ่มข้อมูลเดียวกัน
<!-- related-notes:end -->

