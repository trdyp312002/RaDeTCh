import asyncio
import logging
from datetime import datetime, timezone

import urllib.request
import json

from config import DISCORD_WEBHOOK, TESTNET

logger = logging.getLogger("discord")

LABEL = "🧪 TESTNET" if TESTNET else "🔴 LIVE"


def _post(payload: dict) -> None:
    if not DISCORD_WEBHOOK:
        return
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        DISCORD_WEBHOOK,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "OmniTrade/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5):
            pass
    except Exception as e:
        logger.warning("Discord notify failed: %s", e)


async def notify(payload: dict) -> None:
    await asyncio.to_thread(_post, payload)


def _ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


async def alert_buy(symbol: str, price: float, amount: float, stop_loss: float) -> None:
    cost = price * amount
    await notify({
        "embeds": [{
            "title": f"🟢 BUY EXECUTED — {symbol}",
            "color": 0x00FF41,
            "fields": [
                {"name": "Price",      "value": f"${price:,.2f}",     "inline": True},
                {"name": "Amount",     "value": f"{amount:.6f} BTC",  "inline": True},
                {"name": "Cost",       "value": f"${cost:,.2f}",      "inline": True},
                {"name": "Stop Loss",  "value": f"${stop_loss:,.2f}", "inline": True},
                {"name": "Network",    "value": LABEL,                 "inline": True},
            ],
            "footer": {"text": _ts()},
        }]
    })


async def alert_sell(
    symbol: str, entry: float, exit_price: float,
    amount: float, pnl: float, pnl_pct: float, reason: str
) -> None:
    color  = 0x00FF41 if pnl >= 0 else 0xFF4444
    emoji  = "💰" if pnl >= 0 else "📉"
    reason_label = {"signal": "EMA Signal", "stop_loss": "⚠️ Stop Loss"}.get(reason, reason)

    await notify({
        "embeds": [{
            "title": f"{emoji} SELL EXECUTED — {symbol}",
            "color": color,
            "fields": [
                {"name": "Entry",    "value": f"${entry:,.2f}",                       "inline": True},
                {"name": "Exit",     "value": f"${exit_price:,.2f}",                  "inline": True},
                {"name": "PnL",      "value": f"${pnl:+.4f} ({pnl_pct:+.2f}%)",      "inline": True},
                {"name": "Amount",   "value": f"{amount:.6f} BTC",                    "inline": True},
                {"name": "Reason",   "value": reason_label,                            "inline": True},
                {"name": "Network",  "value": LABEL,                                   "inline": True},
            ],
            "footer": {"text": _ts()},
        }]
    })


async def alert_startup() -> None:
    await notify({
        "embeds": [{
            "title": "🤖 OmniTrade Bot Started",
            "color": 0x5865F2,
            "description": "Strategy: **EMA 9/21 Crossover** — BTC/USDT 1h",
            "fields": [
                {"name": "Network",   "value": LABEL,   "inline": True},
                {"name": "Interval",  "value": "60s",   "inline": True},
                {"name": "Stop Loss", "value": "2%",    "inline": True},
                {"name": "Size",      "value": "10% of USDT", "inline": True},
            ],
            "footer": {"text": _ts()},
        }]
    })
