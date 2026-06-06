import os
from dotenv import load_dotenv

load_dotenv()

BINANCE_API_KEY   = os.getenv("BINANCE_API_KEY", "")
BINANCE_SECRET    = os.getenv("BINANCE_SECRET", "")
TESTNET           = os.getenv("TESTNET", "true").lower() == "true"
BOT_PORT          = int(os.getenv("BOT_PORT", "8000"))
DISCORD_WEBHOOK   = os.getenv("DISCORD_WEBHOOK", "")
