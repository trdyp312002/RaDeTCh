import asyncio
import json
import logging
import os
import time
from pathlib import Path

from exchange import exchange
from state import state, Position
from strategy import check_signal, current_emas
from discord_notify import alert_buy, alert_sell, alert_startup

logger = logging.getLogger("trader")

_LOG_DIR = Path(__file__).parent / "logs"
_LOG_DIR.mkdir(exist_ok=True)
_TICK_LOG  = _LOG_DIR / "ohlcv_log.jsonl"
_TRADE_LOG = _LOG_DIR / "trades_log.jsonl"


def _append_jsonl(path: Path, record: dict) -> None:
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

SYMBOL           = "BTC/USDT"
TIMEFRAME        = "1h"
POSITION_SIZE_PCT = 0.10   # 10% of free USDT
STOP_LOSS_PCT     = 0.02   # 2% stop loss
LOOP_INTERVAL     = 60     # seconds


async def run_strategy_loop():
    state.running = True
    logger.info("Strategy loop started — EMA 9/21 on %s %s", SYMBOL, TIMEFRAME)
    await alert_startup()
    while state.running:
        try:
            await _tick()
        except Exception as exc:
            logger.error("Tick error: %s", exc)
        await asyncio.sleep(LOOP_INTERVAL)


async def _tick():
    ohlcv = await asyncio.to_thread(exchange.fetch_ohlcv, SYMBOL, TIMEFRAME, None, 50)
    signal = check_signal(ohlcv)
    emas   = current_emas(ohlcv)
    price  = ohlcv[-1][4]

    log = {
        "time":     time.time(),
        "datetime": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
        "price":    price,
        "signal":   signal,
        "ema9":     emas["ema9"],
        "ema21":    emas["ema21"],
        "position": state.position.side if state.position else None,
    }
    state.strategy_log.append(log)
    state.strategy_log = state.strategy_log[-200:]
    _append_jsonl(_TICK_LOG, log)

    action_to_take = None
    reason_for_action = signal
    
    # Trigger AI validation only when mechanical signal is active to save tokens
    if signal in ["buy", "sell"] or state.force_agent_run:
        from agentic_strategy import run_6_agents
        state.force_agent_run = False
        pos_str = state.position.side if state.position else None
        logger.info("Signal '%s' or Force-run detected. Waking up agents...", signal)
        agent_decision = await run_6_agents(SYMBOL, price, emas, pos_str)
        action_to_take = agent_decision.get("action")
        reason_for_action = agent_decision.get("reason", signal)
    
    if action_to_take == "buy" and state.position is None:
        await _execute_buy(price)
    elif action_to_take == "sell" and state.position is not None:
        await _execute_sell(price, f"Agent: {reason_for_action}")
    elif state.position and price <= state.position.stop_loss:
        logger.warning("Stop-loss triggered at %.2f", price)
        await _execute_sell(price, "stop_loss")


async def _execute_buy(ref_price: float):
    try:
        bal = await asyncio.to_thread(exchange.fetch_balance)
        usdt_free   = bal["free"].get("USDT", 0)
        amount_usdt = usdt_free * POSITION_SIZE_PCT
        amount_btc  = exchange.amount_to_precision(
            SYMBOL, amount_usdt / ref_price
        )

        order = await asyncio.to_thread(
            exchange.create_market_buy_order, SYMBOL, float(amount_btc)
        )
        entry = order.get("average") or order.get("price") or ref_price
        sl    = float(entry) * (1 - STOP_LOSS_PCT)

        state.position = Position(
            symbol=SYMBOL, side="long",
            entry_price=float(entry), amount=float(amount_btc), stop_loss=sl,
        )
        logger.info("BUY %.6f BTC @ %.2f  SL: %.2f", amount_btc, entry, sl)
        await alert_buy(SYMBOL, float(entry), float(amount_btc), sl)
    except Exception as exc:
        logger.error("Buy failed: %s", exc)


async def _execute_sell(ref_price: float, reason: str):
    if state.position is None:
        return
    pos = state.position
    try:
        order = await asyncio.to_thread(
            exchange.create_market_sell_order, SYMBOL, pos.amount
        )
        exit_price = order.get("average") or order.get("price") or ref_price
        exit_price = float(exit_price)

        pnl     = (exit_price - pos.entry_price) * pos.amount
        pnl_pct = (exit_price - pos.entry_price) / pos.entry_price * 100

        state.total_pnl += pnl
        if pnl >= 0:
            state.win_count  += 1
        else:
            state.loss_count += 1

        state.pnl_history.append({
            "time":      time.time(),
            "datetime":  time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "symbol":    SYMBOL,
            "entry":     pos.entry_price,
            "exit":      exit_price,
            "amount":    pos.amount,
            "pnl":       round(pnl, 4),
            "pnl_pct":   round(pnl_pct, 3),
            "reason":    reason,
        })
        state.pnl_history = state.pnl_history[-500:]
        _append_jsonl(_TRADE_LOG, state.pnl_history[-1])
        state.position = None
        logger.info(
            "SELL %.6f BTC @ %.2f  PnL: $%.2f (%.2f%%)  reason=%s",
            pos.amount, exit_price, pnl, pnl_pct, reason
        )
        await alert_sell(SYMBOL, pos.entry_price, exit_price, pos.amount, pnl, pnl_pct, reason)
    except Exception as exc:
        logger.error("Sell failed: %s", exc)
