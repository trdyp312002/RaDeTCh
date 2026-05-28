import requests
import datetime

# Fallback rates (USD-based) used when FX API is unreachable
_FALLBACK_RATES = {"THB": 35.5, "JPY": 150.0, "USD": 1.0}

class RadetchAPI:
    def __init__(self, base_url="http://localhost:3000"):
        """
        คลาสเชื่อมโยงสำหรับยิงข้อมูลและคำสั่งตรงหา Next.js API ของโครงการ RaDeTCh
        :param base_url: URL ของเซิร์ฟเวอร์เว็บไซต์ RaDeTCh (ค่าเริ่มต้นคือ http://localhost:3000)
        """
        self.base_url = base_url.rstrip("/")

    def get_fx_rates(self):
        """Fetch USD-based FX rates from RaDeTCh /api/fx. Falls back to hardcoded rates."""
        try:
            response = requests.get(f"{self.base_url}/api/fx", timeout=5)
            if response.status_code == 200:
                return response.json().get("rates", _FALLBACK_RATES)
        except Exception as e:
            print(f"[FX] ไม่สามารถดึง FX rates ได้: {e}")
        return _FALLBACK_RATES

    def convert_currency(self, amount, from_currency, to_currency, rates):
        """
        Convert amount between currencies using USD-based rates dict.
        Returns converted amount, or original amount if currency unknown.
        """
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        if from_currency == to_currency:
            return amount
        from_rate = rates.get(from_currency)
        to_rate = rates.get(to_currency)
        if not from_rate or not to_rate:
            print(f"[FX] ไม่รู้จักสกุลเงิน {from_currency} หรือ {to_currency}")
            return amount
        # amount / from_rate = amount in USD; * to_rate = amount in target currency
        return amount / from_rate * to_rate

    def get_or_create_holding(self, symbol, asset_name=None, asset_type="stock", portfolio="long_term"):
        """
        ค้นหาข้อมูล Holding ในเว็บ RaDeTCh หากยังไม่มี จะทำการสร้างขึ้นมาใหม่โดยอัตโนมัติ
        :param symbol: สัญลักษณ์สินทรัพย์ (เช่น BTC-USD, AAPL, PTT)
        :param asset_name: ชื่อเต็ม (หากเว้นว่างไว้จะใช้ตาม symbol)
        :param asset_type: ประเภท เช่น crypto หรือ stock
        :param portfolio: long_term | short_term | retirement
        :return: string ID ของ holding หรือ None หากเกิดข้อผิดพลาด
        """
        symbol = symbol.upper()
        if not asset_name:
            asset_name = symbol

        try:
            # 1. ค้นหารายการ Holding ทั้งหมดจากเว็บไซต์ RaDeTCh
            url = f"{self.base_url}/api/holdings"
            response = requests.get(url, timeout=5)

            if response.status_code == 200:
                holdings = response.json()
                # วนลูปหาว่าสัญลักษณ์นี้ถูกแอดในระบบหรือยัง
                for holding in holdings:
                    if holding.get("symbol") == symbol and holding.get("portfolio") == portfolio:
                        print(f"[API] พบข้อมูลของ {symbol} ใน {portfolio} (ID: {holding.get('id')})")
                        return holding.get("id")

            # 2. หากยังไม่พบข้อมูลเดิม ให้ยิงคำสั่ง POST เพื่อสร้าง Holding ใหม่
            print(f"[API] ไม่พบข้อมูลของ {symbol} ในระบบ กำลังสร้าง Holding ใหม่ให้...")
            payload = {
                "symbol": symbol,
                "name": asset_name,
                "type": asset_type,
                "portfolio": portfolio
            }
            
            post_response = requests.post(url, json=payload, timeout=5)
            if post_response.status_code == 201:
                new_holding = post_response.json()
                print(f"[API] สร้าง Holding สำหรับ {symbol} สำเร็จ! (ID: {new_holding.get('id')})")
                return new_holding.get("id")
            else:
                print(f"[API Error] ไม่สามารถสร้าง Holding ใหม่ได้: {post_response.text}")
                return None
                
        except Exception as e:
            print(f"[API Connection Error] ไม่สามารถติดต่อเว็บ RaDeTCh ได้: {e}")
            return None

    def insert_transaction(self, data):
        """
        เพิ่มข้อมูลธุรกรรมการซื้อขายเข้าไปในฐานข้อมูลเว็บไซต์ RaDeTCh
        ราคาที่บันทึกจะถูกแปลงเป็น THB อัตโนมัติหากสกุลเงินต้นทางไม่ใช่ THB
        """
        asset = data.get("asset", "").upper()
        if not asset:
            print("[API Error] ข้อมูลธุรกรรมไม่พบข้อมูล Asset")
            return False

        # BTC → normalize symbol and force retirement portfolio
        if asset in ("BTC", "BITCOIN"):
            asset = "BTC-USD"
        is_btc = asset == "BTC-USD"

        # ระบุประเภทสินทรัพย์เบื้องต้นตามชื่อ
        crypto_symbols = {"BTC-USD", "ETH", "USDT", "BNB", "ADA", "XRP"}
        asset_type = "crypto" if asset in crypto_symbols else "stock"
        portfolio = "retirement" if is_btc else "long_term"

        # 1. ดึงหรือสร้าง Holding ID
        holding_id = self.get_or_create_holding(asset, asset_type=asset_type, portfolio=portfolio)
        if not holding_id:
            print("[API Error] ไม่พบหรือสร้าง Holding ID ไม่สำเร็จ")
            return False

        # 2. แปลงสกุลเงินเป็น THB หากจำเป็น
        orig_currency = (data.get("currency") or "THB").upper()
        orig_price = float(data.get("price", 0))
        orig_total = float(data.get("total_amount", 0))

        currency_note = ""
        if orig_currency not in ("THB", ""):
            rates = self.get_fx_rates()
            price_thb = self.convert_currency(orig_price, orig_currency, "THB", rates)
            total_thb = self.convert_currency(orig_total, orig_currency, "THB", rates)
            price_usd = self.convert_currency(orig_price, orig_currency, "USD", rates)
            jpy_thb_rate = rates.get("THB", 35.5) / rates.get(orig_currency, 1)
            print(f"[FX] แปลง {orig_currency}→THB: {orig_price:,.2f} {orig_currency} = {price_thb:,.2f} THB")
            currency_note = (
                f" | ต้นทาง: {orig_price:,.2f} {orig_currency}"
                f" | THB: {price_thb:,.2f}"
                f" | USD: {price_usd:,.2f}"
                f" | rate 1 {orig_currency} = {jpy_thb_rate:.4f} THB"
            )
            final_price = price_thb
        else:
            final_price = orig_price

        # 3. เตรียมข้อมูลธุรกรรมสำหรับส่งไป POST
        # ฟอร์แมตวันเวลา หากข้อมูลจาก AI เป็น null ให้ใช้วันเวลาปัจจุบันแทน
        tx_date = data.get("timestamp")
        if not tx_date:
            tx_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        payload = {
            "holdingId": holding_id,
            "type": data.get("transaction_type", "BUY"),
            "quantity": float(data.get("quantity", 0)),
            "price": final_price,
            "fees": 0.0,
            "date": tx_date,
            "notes": (
                f"บันทึกอัตโนมัติด้วย AI จากบอทแชท Discord (BotBas) บนแพลตฟอร์ม {data.get('platform', 'ไม่ระบุ')}"
                + currency_note
            )
        }
        
        try:
            url = f"{self.base_url}/api/transactions"
            response = requests.post(url, json=payload, timeout=5)
            
            if response.status_code == 201:
                print(f"[API SUCCESS] บันทึกธุรกรรมการ {payload['type']} ของ {asset} เข้าสู่ RaDeTCh สำเร็จ!")
                return True
            else:
                print(f"[API ERROR] ไม่สามารถบันทึกธุรกรรมได้: {response.text}")
                return False
                
        except Exception as e:
            print(f"[API Connection Error] ไม่สามารถส่งธุรกรรมไปที่ RaDeTCh ได้: {e}")
            return False
