---
title: "Execution Module"
ability: "Swift Strike"
icon: "⚡"
color: "yellow"
level: 48
status: "ONLINE"
latency: "45ms"
description: "Translates strategy signals into real exchange orders with precision and speed"
responsibilities:
  - "Receive trade signals from Strategy Engine"
  - "Route orders to target exchange via REST/WebSocket API"
  - "Handle order types: Market, Limit, Stop-Limit"
  - "Track order fill status and report back to Portfolio Manager"
  - "Implement retry logic and partial fill handling"
dependencies:
  - "strategy-engine"
  - "risk-portfolio-manager"
---

## Module Overview

Swift Strike is the trigger finger of OmniTrade. Once Risk clears a signal, Execution fires. Speed matters: in liquid markets, the difference between 50ms and 500ms can be the difference between profit and slippage.

## Order Flow

Signal → Risk Check → Order Construction → Exchange API → Fill Confirmation → Ledger Update
