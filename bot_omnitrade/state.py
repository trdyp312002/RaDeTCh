from dataclasses import dataclass, field
from typing import Optional
import time


@dataclass
class Position:
    symbol: str
    side: str
    entry_price: float
    amount: float
    stop_loss: float
    entry_time: float = field(default_factory=time.time)


@dataclass
class BotState:
    position: Optional[Position] = None
    pnl_history: list = field(default_factory=list)
    strategy_log: list = field(default_factory=list)
    running: bool = False
    total_pnl: float = 0.0
    win_count: int = 0
    loss_count: int = 0


state = BotState()
