import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os

class SheetsDB:
    def __init__(self, sheet_name, credentials_path="credentials.json"):
        """
        ตัวเชื่อมต่อและบันทึกข้อมูลเข้า Google Sheets
        :param sheet_name: ชื่อของ Google Sheet ที่ต้องการเก็บข้อมูล
        :param credentials_path: พาทไปยังไฟล์ json คีย์ของบัญชีบริการ Google Cloud
        """
        self.sheet_name = sheet_name
        self.credentials_path = credentials_path
        self.client = None
        self.sheet = None

    def connect(self):
        """
        ทำการเชื่อมต่อเข้าสู่ระบบ Google Sheets API
        """
        if not os.path.exists(self.credentials_path):
            print(f"[INFO] ไม่พบไฟล์ {self.credentials_path} ระบบจะสลับไปใช้งานโหมดจำลอง (Mock Mode) เพื่อใช้ทดสอบ")
            return False
            
        try:
            scope = [
                "https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive"
            ]
            creds = ServiceAccountCredentials.from_json_keyfile_name(self.credentials_path, scope)
            self.client = gspread.authorize(creds)
            
            # เปิดเอกสารชีตตามชื่อ หากยังไม่มีต้องเข้าไปสร้างชีตในบัญชี Google ไดรฟ์ก่อน
            self.sheet = self.client.open(self.sheet_name).sheet1
            print(f"[SUCCESS] เชื่อมต่อกับชีต '{self.sheet_name}' เรียบร้อยแล้ว!")
            return True
        except Exception as e:
            print(f"[ERROR] เกิดข้อผิดพลาดขณะเชื่อมต่อ Google Sheets: {e}")
            return False

    def insert_transaction(self, data):
        """
        บันทึกแถวข้อมูลธุรกรรมใหม่ลงไปในตาราง
        """
        if not self.sheet:
            # ทำงานในโหมดจำลอง (Mock Mode) หากไม่มีสิทธิ์จริง
            print("\n" + "="*50)
            print("[MOCK SAVE - ทำงานในโหมดจำลอง]")
            print(f"บันทึกข้อมูลไปยัง Google Sheet '{self.sheet_name}' จำลอง:")
            for key, val in data.items():
                print(f"  • {key}: {val}")
            print("="*50 + "\n")
            return True
            
        try:
            # เตรียมโครงสร้างการเรียงลำดับคอลัมน์ใน Google Sheets
            # 1. วันที่เวลา, 2. แพลตฟอร์ม, 3. ชื่อเหรียญ/หุ้น, 4. ซื้อหรือขาย, 5. ราคาต่อหน่วย, 6. จำนวน, 7. มูลค่ารวม
            row = [
                data.get("timestamp", ""),
                data.get("platform", ""),
                data.get("asset", ""),
                data.get("transaction_type", ""),
                data.get("price", 0.0),
                data.get("quantity", 0.0),
                data.get("total_amount", 0.0)
            ]
            
            self.sheet.append_row(row)
            print(f"[SUCCESS] บันทึกข้อมูลของ {data.get('asset')} ลง Google Sheet เรียบร้อย!")
            return True
        except Exception as e:
            print(f"[ERROR] บันทึกข้อมูลลงชีตล้มเหลว: {e}")
            return False
