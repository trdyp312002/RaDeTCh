from fastapi import APIRouter, HTTPException
from exchange import exchange

router = APIRouter()

@router.get("/balance")
async def get_balance():
    try:
        bal = exchange.fetch_balance()
        total = bal.get("total", {})
        free  = bal.get("free", {})
        # only assets with balance > 0
        assets = [
            {"asset": k, "total": total[k], "free": free.get(k, 0)}
            for k in total
            if total[k] and total[k] > 0
        ]
        return {"assets": assets}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
