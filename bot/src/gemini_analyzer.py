import google.generativeai as genai
from PIL import Image
import json
import io

class GeminiAnalyzer:
    def __init__(self, api_key):
        """
        เตรียมใช้งานโมเดล Gemini Vision สำหรับการอ่านข้อมูลจากภาพสลิป
        """
        genai.configure(api_key=api_key)
        # ใช้ gemini-2.5-flash ที่สนับสนุนสำหรับบัญชีผู้ใช้งานชำระเงิน Tier 1 ปี 2026
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def analyze_transaction(self, image_bytes):
        """
        วิเคราะห์ภาพสลิปการเทรด (หุ้น/คริปโต)
        :param image_bytes: bytes ของรูปภาพสลิป
        :return: dict ข้อมูลสลิปในรูปแบบ JSON
        """
        try:
            # โหลดรูปภาพจาก Bytes
            img = Image.open(io.BytesIO(image_bytes))
            
            prompt = """
            วิเคราะห์ภาพสลิปการซื้อขายหุ้นหรือคริปโต (Transaction Screenshot/Receipt)
            กรุณาแกะข้อมูลธุรกรรมและส่งผลลัพธ์กลับมาในรูปแบบโครงสร้าง JSON เท่านั้น (ห้ามเขียนข้อความอธิบายใดๆ เพิ่มเติมเด็ดขาด)
            
            โครงสร้าง JSON ที่ต้องส่งกลับมามีดังนี้:
            {
                "asset": "ชื่อหุ้นหรือชื่อเหรียญคริปโต เช่น BTC, ETH, AAPL, PTT (ถ้าเป็นคำภาษาไทย ให้แปลงเป็นสัญลักษณ์ทางการ)",
                "transaction_type": "BUY หรือ SELL",
                "price": float (ราคาต่อหน่วย เช่น 2250000.00 หรือ 150.50),
                "quantity": float (จำนวนเหรียญหรือจำนวนหุ้นที่ทำการซื้อขาย),
                "total_amount": float (ยอดเงินรวมที่จ่ายหรือได้รับจริง),
                "timestamp": "วันเวลาที่ระบุในสลิปตามฟอร์แมต YYYY-MM-DD HH:MM (หากไม่ระบุเวลา ให้ใช้ YYYY-MM-DD หรือถ้าไม่เห็นเลยให้ระบุ null)",
                "platform": "ชื่อแพลตฟอร์มที่ใช้เทรด เช่น Bitkub, Binance, Streaming, InnovestX (หากไม่แน่ใจให้ใส่ null)"
            }
            """
            
            # ยิงข้อมูลภาพพร้อมคำสั่งให้ Gemini
            response = self.model.generate_content([prompt, img])
            text_response = response.text.strip()
            
            # จัดการตัดส่วนหัวท้ายกรณีที่โมเดลครอบ Markdown code block มาให้
            if text_response.startswith("```json"):
                text_response = text_response.split("```json")[1]
            elif text_response.startswith("```"):
                text_response = text_response.split("```")[1]
                
            if text_response.endswith("```"):
                text_response = text_response.rsplit("```", 1)[0]
                
            # แปลงเป็น Python dictionary
            data = json.loads(text_response.strip())
            return data
            
        except Exception as e:
            print(f"[ERROR] เกิดข้อผิดพลาดในระบบวิเคราะห์ภาพ: {e}", flush=True)
            return {
                "error": True,
                "message": f"ไม่สามารถวิเคราะห์ภาพได้เนื่องจาก: {str(e)}"
            }

    def chat(self, prompt):
        """
        โต้ตอบบทสนทนาทั่วไปกับผู้ใช้งานผ่านข้อความตัวอักษร
        :param prompt: คำถามหรือข้อความของผู้ใช้
        :return: ข้อความคำตอบภาษาไทยที่เป็นมิตรจาก AI
        """
        try:
            # กำหนดเอกลักษณ์และการสวมบทบาทของบอทให้ตอบเป็นมิตรและเป็นสไตล์ BotBas
            system_instruction = (
                "คุณคือ BotBas (บอทบาส) AI บอทผู้ช่วยดูแลพอร์ตการลงทุนและการเงินที่น่ารัก เป็นกันเอง และสุภาพมาก "
                "คุณทำงานร่วมกับเว็บไซต์พอร์ตโฟลิโอชื่อ RaDeTCh คอยให้ความรู้เรื่องหุ้น คริปโต และช่วยวิเคราะห์ข้อมูลการลงทุนอย่างชาญฉลาด "
                "จงตอบคำถามผู้ใช้เป็นภาษาไทยอย่างกระชับ สุภาพ ได้ประโยชน์ และมีความเป็นบอทผู้ช่วยแสนดี"
            )
            
            full_prompt = f"{system_instruction}\n\nผู้ใช้พูดว่า: {prompt}"
            
            response = self.model.generate_content(full_prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"[ERROR] เกิดข้อผิดพลาดในการสนทนา: {e}", flush=True)
            return f"🤖 ขออภัยด้วยครับ พอดีระบบเชื่อมต่อสมองกลขัดข้องชั่วคราว: {str(e)}"

