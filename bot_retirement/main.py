import asyncio
import logging
from trader import run_strategy_loop, state

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

async def main():
    try:
        await run_strategy_loop()
    except KeyboardInterrupt:
        logging.info("Shutting down bot...")
        state.running = False

if __name__ == "__main__":
    asyncio.run(main())
