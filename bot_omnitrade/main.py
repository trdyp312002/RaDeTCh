import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import BOT_PORT
from state import state
from trader import run_strategy_loop
from routes.status    import router as status_router
from routes.balance   import router as balance_router
from routes.trades    import router as trades_router
from routes.command   import router as command_router
from routes.positions import router as positions_router
from routes.webhook   import router as webhook_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(run_strategy_loop())
    yield
    state.running = False
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="OmniTrade Bot", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status_router,    tags=["status"])
app.include_router(balance_router,   tags=["balance"])
app.include_router(trades_router,    tags=["trades"])
app.include_router(command_router,   tags=["command"])
app.include_router(positions_router, tags=["positions"])
app.include_router(webhook_router,   tags=["webhook"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=BOT_PORT, reload=False)
