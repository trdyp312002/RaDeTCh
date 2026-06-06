import ccxt
from config import BINANCE_API_KEY, BINANCE_SECRET, TESTNET

def make_exchange() -> ccxt.binance:
    ex = ccxt.binance({
        "apiKey": BINANCE_API_KEY,
        "secret": BINANCE_SECRET,
        "options": {"defaultType": "spot"},
    })
    if TESTNET:
        ex.set_sandbox_mode(True)
    return ex

exchange = make_exchange()
