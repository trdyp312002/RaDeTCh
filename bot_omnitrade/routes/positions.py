from fastapi import APIRouter
from state import state
import time

router = APIRouter()


@router.get("/positions")
async def get_positions():
    pos = state.position
    if pos is None:
        return {"position": None}

    hold_seconds = int(time.time() - pos.entry_time)
    h, rem = divmod(hold_seconds, 3600)
    m, s   = divmod(rem, 60)

    return {
        "position": {
            "symbol":      pos.symbol,
            "side":        pos.side,
            "entry_price": pos.entry_price,
            "amount":      pos.amount,
            "stop_loss":   pos.stop_loss,
            "held":        f"{h:02d}:{m:02d}:{s:02d}",
        }
    }


@router.get("/pnl")
async def get_pnl():
    total   = state.win_count + state.loss_count
    win_rate = (state.win_count / total * 100) if total else 0
    return {
        "total_pnl":    round(state.total_pnl, 4),
        "win_count":    state.win_count,
        "loss_count":   state.loss_count,
        "win_rate":     round(win_rate, 1),
        "total_trades": total,
        "history":      state.pnl_history[-20:],
    }


@router.get("/log")
async def get_log():
    return {"log": state.strategy_log[-50:]}
