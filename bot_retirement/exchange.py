import ccxt
from config import BINANCE_API_KEY, BINANCE_SECRET, TESTNET

exchange = ccxt.binance({
    "apiKey": BINANCE_API_KEY,
    "secret": BINANCE_SECRET,
    "enableRateLimit": True,
    "options": {
        "defaultType": "spot",
    }
})

if TESTNET:
    exchange.set_sandbox_mode(True)
