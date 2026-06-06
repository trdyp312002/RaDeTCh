def _ema(prices: list[float], period: int) -> list[float]:
    k = 2 / (period + 1)
    result = [prices[0]]
    for p in prices[1:]:
        result.append(p * k + result[-1] * (1 - k))
    return result

def check_cdc_action_zone(ohlcv: list) -> str | None:
    """
    ohlcv: list of [ts, open, high, low, close, volume]
    Returns 'green' (buy), 'red' (sell/ignore), or None
    CDC Action Zone is fundamentally EMA12 crossing EMA26
    """
    if len(ohlcv) < 27:
        return None

    closes = [c[4] for c in ohlcv]
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)

    prev_ema12 = ema12[-2]
    prev_ema26 = ema26[-2]
    curr_ema12 = ema12[-1]
    curr_ema26 = ema26[-1]

    # Green signal: EMA12 crosses above EMA26
    if prev_ema12 <= prev_ema26 and curr_ema12 > curr_ema26:
        return "green"
    
    # Red signal: EMA12 crosses below EMA26
    if prev_ema12 >= prev_ema26 and curr_ema12 < curr_ema26:
        return "red"
        
    return None

def current_emas(ohlcv: list) -> dict:
    closes = [c[4] for c in ohlcv]
    ema12  = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    return {"ema12": round(ema12[-1], 2), "ema26": round(ema26[-1], 2)}
