"""
TradingView webhook endpoint.

Expected JSON payload from Pine Script alert:
{
  "action":  "buy" | "sell" | "close",
  "symbol":  "BTCUSDT",
  "price":   {{close}},
  "secret":  "YOUR_SECRET"          (optional but recommended)
}
"""

import os
import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from trader import _execute_buy, _execute_sell
from state import state

router  = APIRouter()
logger  = logging.getLogger("webhook")
SECRET  = os.getenv("WEBHOOK_SECRET", "")


class TVPayload(BaseModel):
    action: str           # buy | sell | close
    symbol: str = "BTC/USDT"
    price:  float = 0.0
    secret: str = ""


@router.post("/webhook")
async def tradingview_webhook(payload: TVPayload, request: Request):
    # optional secret check
    if SECRET and payload.secret != SECRET:
        logger.warning("Webhook: invalid secret from %s", request.client.host if request.client else "unknown")
        raise HTTPException(status_code=403, detail="Invalid secret")

    action = payload.action.lower()
    price  = payload.price
    logger.info("Webhook received: action=%s symbol=%s price=%.2f", action, payload.symbol, price)

    if action == "buy":
        if state.position is not None:
            return {"status": "skipped", "reason": "position already open"}
        await _execute_buy(price or 0)
        return {"status": "ok", "action": "buy", "price": price}

    elif action in ("sell", "close"):
        if state.position is None:
            return {"status": "skipped", "reason": "no open position"}
        await _execute_sell(price or 0, "tradingview")
        return {"status": "ok", "action": "sell", "price": price}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@router.get("/webhook")
async def webhook_health():
    return {
        "status":   "ready",
        "position": state.position.side if state.position else None,
        "secret_required": bool(SECRET),
    }
