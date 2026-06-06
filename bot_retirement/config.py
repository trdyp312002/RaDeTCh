import os
from dotenv import load_dotenv

load_dotenv()

BINANCE_API_KEY   = os.getenv("BINANCE_API_KEY", "")
BINANCE_SECRET    = os.getenv("BINANCE_SECRET", "")
TESTNET           = os.getenv("TESTNET", "true").lower() == "true"
DISCORD_WEBHOOK   = os.getenv("DISCORD_WEBHOOK", "")
BUY_AMOUNT_USDT   = float(os.getenv("BUY_AMOUNT_USDT", "50.0")) # Amount to buy on each green signal
