from fastapi import APIRouter, HTTPException
from exchange import exchange

router = APIRouter()

@router.get("/trades")
async def get_trades(symbol: str = "BTC/USDT", limit: int = 20):
    try:
        trades = exchange.fetch_my_trades(symbol, limit=limit)
        return {
            "symbol": symbol,
            "trades": [
                {
                    "id": t["id"],
                    "side": t["side"],
                    "price": t["price"],
                    "amount": t["amount"],
                    "cost": t["cost"],
                    "timestamp": t["timestamp"],
                    "datetime": t["datetime"],
                }
                for t in trades
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
