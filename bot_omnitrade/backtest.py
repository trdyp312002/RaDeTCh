"""
Backtest: EMA 9/21 Crossover — BTC/USDT 1h
Run: python backtest.py
"""

import time
import math
import ccxt

# ── Config ────────────────────────────────────────────────────────────────────
SYMBOL           = "BTC/USDT"
TIMEFRAME        = "1h"
MONTHS           = 6
INITIAL_CAPITAL  = 10_000.0   # USDT
POSITION_SIZE    = 0.10        # 10% per trade
STOP_LOSS_PCT    = 0.02        # 2%
FEE_PCT          = 0.001       # 0.1% Binance taker fee
EMA_FAST         = 9
EMA_SLOW         = 21

# ── EMA ───────────────────────────────────────────────────────────────────────
def _ema(prices: list[float], period: int) -> list[float]:
    k = 2 / (period + 1)
    res = [prices[0]]
    for p in prices[1:]:
        res.append(p * k + res[-1] * (1 - k))
    return res

# ── Fetch data ────────────────────────────────────────────────────────────────
def fetch_ohlcv(symbol: str, timeframe: str, months: int) -> list:
    ex = ccxt.binance({"options": {"defaultType": "spot"}})
    limit      = months * 30 * 24
    since_ms   = int((time.time() - months * 30 * 24 * 3600) * 1000)
    all_candles: list = []
    since = since_ms

    print(f"Fetching {limit} candles for {symbol} {timeframe}...")
    while len(all_candles) < limit:
        candles = ex.fetch_ohlcv(symbol, timeframe, since=since, limit=1000)
        if not candles:
            break
        all_candles += candles
        since = candles[-1][0] + 1
        if len(candles) < 1000:
            break
        time.sleep(0.2)

    print(f"  Got {len(all_candles)} candles")
    return all_candles

# ── Backtest ──────────────────────────────────────────────────────────────────
def run(candles: list) -> dict:
    closes = [c[4] for c in candles]
    ema9   = _ema(closes, EMA_FAST)
    ema21  = _ema(closes, EMA_SLOW)

    capital   = INITIAL_CAPITAL
    position  = None   # {"entry": price, "amount": btc, "sl": price}
    trades: list[dict] = []
    equity    = [capital]

    for i in range(EMA_SLOW + 1, len(candles)):
        price      = closes[i]
        prev_diff  = ema9[i-1] - ema21[i-1]
        curr_diff  = ema9[i]   - ema21[i]
        ts         = candles[i][0]

        # stop-loss check
        if position and price <= position["sl"]:
            pnl     = (price - position["entry"]) * position["amount"]
            fee     = price * position["amount"] * FEE_PCT
            capital += pnl - fee
            trades.append({
                "entry": position["entry"], "exit": price,
                "amount": position["amount"],
                "pnl": round(pnl - fee, 4), "reason": "stop_loss", "ts": ts,
            })
            position = None

        # signal
        signal = None
        if prev_diff < 0 and curr_diff > 0:
            signal = "buy"
        elif prev_diff > 0 and curr_diff < 0:
            signal = "sell"

        if signal == "buy" and position is None:
            spend  = capital * POSITION_SIZE
            fee    = spend * FEE_PCT
            amount = (spend - fee) / price
            position = {"entry": price, "amount": amount, "sl": price * (1 - STOP_LOSS_PCT)}

        elif signal == "sell" and position is not None:
            pnl     = (price - position["entry"]) * position["amount"]
            fee     = price * position["amount"] * FEE_PCT
            capital += pnl - fee
            trades.append({
                "entry": position["entry"], "exit": price,
                "amount": position["amount"],
                "pnl": round(pnl - fee, 4), "reason": "signal", "ts": ts,
            })
            position = None

        equity.append(capital)

    # ── Stats ─────────────────────────────────────────────────────────────────
    total_trades = len(trades)
    wins   = [t for t in trades if t["pnl"] > 0]
    losses = [t for t in trades if t["pnl"] <= 0]
    win_rate = len(wins) / total_trades * 100 if total_trades else 0
    total_pnl = sum(t["pnl"] for t in trades)
    total_return_pct = total_pnl / INITIAL_CAPITAL * 100

    # max drawdown
    peak = equity[0]
    max_dd = 0.0
    for e in equity:
        if e > peak:
            peak = e
        dd = (peak - e) / peak
        if dd > max_dd:
            max_dd = dd

    # Sharpe (hourly returns → annualised)
    hourly_returns = [(equity[i] - equity[i-1]) / equity[i-1] for i in range(1, len(equity))]
    if len(hourly_returns) > 1:
        mean_r  = sum(hourly_returns) / len(hourly_returns)
        std_r   = math.sqrt(sum((r - mean_r)**2 for r in hourly_returns) / len(hourly_returns))
        sharpe  = (mean_r / std_r * math.sqrt(8760)) if std_r else 0
    else:
        sharpe = 0

    best  = max(trades, key=lambda t: t["pnl"]) if trades else None
    worst = min(trades, key=lambda t: t["pnl"]) if trades else None

    return {
        "candles":        len(candles),
        "total_trades":   total_trades,
        "wins":           len(wins),
        "losses":         len(losses),
        "win_rate":       round(win_rate, 1),
        "total_pnl":      round(total_pnl, 2),
        "total_return":   round(total_return_pct, 2),
        "final_capital":  round(capital, 2),
        "max_drawdown":   round(max_dd * 100, 2),
        "sharpe":         round(sharpe, 3),
        "best_trade":     best,
        "worst_trade":    worst,
        "trades":         trades,
    }

def print_report(r: dict) -> None:
    sep  = "=" * 52
    line = "-" * 52
    print(f"\n{sep}")
    print(f"  BACKTEST REPORT -- EMA {EMA_FAST}/{EMA_SLOW} -- {SYMBOL} {TIMEFRAME}")
    print(f"  Period: {MONTHS} months   Initial: ${INITIAL_CAPITAL:,.0f}")
    print(sep)
    print(f"  Candles analysed  : {r['candles']:,}")
    print(f"  Total trades      : {r['total_trades']}")
    print(f"  Wins / Losses     : {r['wins']} / {r['losses']}")
    print(f"  Win Rate          : {r['win_rate']}%")
    print(line)
    print(f"  Total PnL         : ${r['total_pnl']:+,.2f}")
    print(f"  Return            : {r['total_return']:+.2f}%")
    print(f"  Final Capital     : ${r['final_capital']:,.2f}")
    print(line)
    print(f"  Max Drawdown      : {r['max_drawdown']}%")
    print(f"  Sharpe Ratio      : {r['sharpe']}")
    print(line)
    if r["best_trade"]:
        b = r["best_trade"]
        print(f"  Best Trade        : ${b['pnl']:+.4f}  (entry ${b['entry']:,.0f} -> exit ${b['exit']:,.0f})")
    if r["worst_trade"]:
        w = r["worst_trade"]
        print(f"  Worst Trade       : ${w['pnl']:+.4f}  (entry ${w['entry']:,.0f} -> exit ${w['exit']:,.0f})")
    print(f"{sep}\n")

    if r["total_return"] > 5 and r["win_rate"] > 45 and r["max_drawdown"] < 20:
        print("  [OK] VERDICT: Strategy looks viable for testnet continuation")
    elif r["total_return"] > 0:
        print("  [!!] VERDICT: Marginally profitable -- consider parameter tuning")
    else:
        print("  [XX] VERDICT: Negative return -- do NOT go live without improvement")
    print()


if __name__ == "__main__":
    candles = fetch_ohlcv(SYMBOL, TIMEFRAME, MONTHS)
    result  = run(candles)
    print_report(result)
