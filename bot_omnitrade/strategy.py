def _ema(prices: list[float], period: int) -> list[float]:
    k = 2 / (period + 1)
    result = [prices[0]]
    for p in prices[1:]:
        result.append(p * k + result[-1] * (1 - k))
    return result


def check_signal(ohlcv: list) -> str | None:
    """
    ohlcv: list of [ts, open, high, low, close, volume]
    Returns 'buy', 'sell', or None
    """
    if len(ohlcv) < 22:
        return None

    closes = [c[4] for c in ohlcv]
    ema9  = _ema(closes, 9)
    ema21 = _ema(closes, 21)

    prev_diff = ema9[-2] - ema21[-2]
    curr_diff = ema9[-1] - ema21[-1]

    if prev_diff < 0 and curr_diff > 0:
        return "buy"
    if prev_diff > 0 and curr_diff < 0:
        return "sell"
    return None


def current_emas(ohlcv: list) -> dict:
    closes = [c[4] for c in ohlcv]
    ema9  = _ema(closes, 9)
    ema21 = _ema(closes, 21)
    return {"ema9": round(ema9[-1], 2), "ema21": round(ema21[-1], 2)}
