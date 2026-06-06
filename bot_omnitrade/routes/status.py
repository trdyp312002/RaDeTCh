from fastapi import APIRouter
from exchange import exchange
import time

router = APIRouter()

_start_time = time.time()

@router.get("/status")
async def get_status():
    uptime_seconds = int(time.time() - _start_time)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    try:
        ticker = exchange.fetch_ticker("BTC/USDT")
        btc_price = ticker["last"]
        connected = True
    except Exception as e:
        btc_price = None
        connected = False

    return {
        "status": "ONLINE" if connected else "DEGRADED",
        "testnet": getattr(exchange, "sandbox", False),
        "uptime": f"{hours:02d}:{minutes:02d}:{seconds:02d}",
        "btc_price": btc_price,
        "exchange": "Binance" + (" Testnet" if getattr(exchange, "sandbox", False) else ""),
    }
