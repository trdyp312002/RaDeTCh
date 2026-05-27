import requests
import datetime

class RadetchAPI:
    def __init__(self, base_url="http://localhost:3000"):
        """
        คลาสเชื่อมโยงสำหรับยิงข้อมูลและคำสั่งตรงหา Next.js API ของโครงการ RaDeTCh
        :param base_url: URL ของเซิร์ฟเวอร์เว็บไซต์ RaDeTCh (ค่าเริ่มต้นคือ http://localhost:3000)
        """
        self.base_url = base_url.rstrip("/")

    def get_or_create_holding(self, symbol, asset_name=None, asset_type="stock"):
        """
        ค้นหาข้อมูล Holding ในเว็บ RaDeTCh หากยังไม่มี จะทำการสร้างขึ้นมาใหม่โดยอัตโนมัติ
        :param symbol: สัญลักษณ์สินทรัพย์ (เช่น BTC, AAPL, PTT)
        :param asset_name: ชื่อเต็ม (หากเว้นว่างไว้จะใช้ตาม symbol)
        :param asset_type: ประเภท เช่น crypto หรือ stock
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
                    if holding.get("symbol") == symbol:
                        print(f"[API] พบข้อมูลของ {symbol} เดิมในระบบ (ID: {holding.get('id')})")
                        return holding.get("id")
            
            # 2. หากยังไม่พบข้อมูลเดิม ให้ยิงคำสั่ง POST เพื่อสร้าง Holding ใหม่
            print(f"[API] ไม่พบข้อมูลของ {symbol} ในระบบ กำลังสร้าง Holding ใหม่ให้...")
            payload = {
                "symbol": symbol,
                "name": asset_name,
                "type": asset_type,
                "portfolio": "long_term"  # กำหนดค่าพอร์ตเป็น long_term
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
        """
        asset = data.get("asset", "").upper()
        if not asset:
            print("[API Error] ข้อมูลธุรกรรมไม่พบข้อมูล Asset")
            return False
            
        # ระบุประเภทสินทรัพย์เบื้องต้นตามชื่อ
        asset_type = "crypto" if asset in ["BTC", "ETH", "USDT", "BNB", "ADA", "XRP"] else "stock"
        
        # 1. ดึงหรือสร้าง Holding ID
        holding_id = self.get_or_create_holding(asset, asset_type=asset_type)
        if not holding_id:
            print("[API Error] ไม่พบหรือสร้าง Holding ID ไม่สำเร็จ")
            return False
            
        # 2. เตรียมข้อมูลธุรกรรมสำหรับส่งไป POST
        # ฟอร์แมตวันเวลา หากข้อมูลจาก AI เป็น null ให้ใช้วันเวลาปัจจุบันแทน
        tx_date = data.get("timestamp")
        if not tx_date:
            tx_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
        payload = {
            "holdingId": holding_id,
            "type": data.get("transaction_type", "BUY"),
            "quantity": float(data.get("quantity", 0)),
            "price": float(data.get("price", 0)),
            "fees": 0.0,
            "date": tx_date,
            "notes": f"บันทึกอัตโนมัติด้วย AI จากบอทแชท Discord (BotBas) บนแพลตฟอร์ม {data.get('platform', 'ไม่ระบุ')}"
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
