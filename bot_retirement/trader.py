import asyncio
import logging
import time

from config import BUY_AMOUNT_USDT
from exchange import exchange
from strategy import check_cdc_action_zone, current_emas

logger = logging.getLogger("retirement_trader")

SYMBOL    = "BTC/USDT"
TIMEFRAME = "1d" # CDC Action Zone is traditionally used on Daily timeframe
LOOP_INTERVAL = 3600 # Check every 1 hour

class State:
    def __init__(self):
        self.running = False
        self.last_signal_time = 0

state = State()

async def run_strategy_loop():
    state.running = True
    logger.info("Retirement Strategy started — CDC Action Zone on %s %s", SYMBOL, TIMEFRAME)
    logger.info("Bot will ONLY BUY on Green. It will NEVER SELL.")
    
    while state.running:
        try:
            await _tick()
        except Exception as exc:
            logger.error("Tick error: %s", exc)
        await asyncio.sleep(LOOP_INTERVAL)

async def _tick():
    ohlcv = await asyncio.to_thread(exchange.fetch_ohlcv, SYMBOL, TIMEFRAME, None, 50)
    signal = check_cdc_action_zone(ohlcv)
    emas   = current_emas(ohlcv)
    price  = ohlcv[-1][4]
    current_time = ohlcv[-1][0] # Timestamp of current candle

    logger.info(f"Price: {price} | EMA12: {emas['ema12']} | EMA26: {emas['ema26']} | Signal: {signal}")

    # Buy logic
    if signal == "green":
        # Check if we already bought on this exact daily candle to avoid duplicate buys
        if state.last_signal_time != current_time:
            logger.info("🟢 CDC Action Zone GREEN SIGNAL! Executing Buy...")
            await _execute_buy(price)
            state.last_signal_time = current_time
    
    elif signal == "red":
        logger.info("🔴 CDC Action Zone RED SIGNAL! Ignoring (We NEVER sell).")

async def _execute_buy(ref_price: float):
    try:
        # Calculate amount of BTC to buy using BUY_AMOUNT_USDT
        amount_btc = exchange.amount_to_precision(SYMBOL, BUY_AMOUNT_USDT / ref_price)
        
        logger.info(f"Placing Market Buy Order for {amount_btc} {SYMBOL} (~{BUY_AMOUNT_USDT} USDT)")
        
        # Uncomment to enable real trading
        # order = await asyncio.to_thread(
        #     exchange.create_market_buy_order, SYMBOL, float(amount_btc)
        # )
        # logger.info(f"Order successful: {order}")
        logger.info("Order simulation successful (uncomment create_market_buy_order to execute real trades).")
        
    except Exception as exc:
        logger.error("Buy failed: %s", exc)
