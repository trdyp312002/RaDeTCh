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
    force_agent_run: bool = False
    total_pnl: float = 0.0
    win_count: int = 0
    loss_count: int = 0
    agents_state: dict = field(default_factory=lambda: {
        "Observer": {"status": "Sleeping", "message": "Zzz..."},
        "Questioner": {"status": "Sleeping", "message": "Zzz..."},
        "Advocate": {"status": "Sleeping", "message": "Zzz..."},
        "Summarizer": {"status": "Sleeping", "message": "Zzz..."},
        "Executor": {"status": "Sleeping", "message": "Zzz..."},
        "Supervisor": {"status": "Watching", "message": "Monitoring operation loop..."}
    })

state = BotState()
