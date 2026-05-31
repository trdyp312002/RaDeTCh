import datetime
import os
import json
from garminconnect import Garmin
from dotenv import load_dotenv

load_dotenv()

GARMIN_EMAIL = os.getenv("GARMIN_EMAIL")
GARMIN_PASSWORD = os.getenv("GARMIN_PASSWORD")

class GarminHelper:
    def __init__(self):
        self.email = GARMIN_EMAIL
        self.password = GARMIN_PASSWORD
        self.client = None

    def connect(self):
        if not self.email or not self.password:
            return False, "ไม่พบข้อมูล GARMIN_EMAIL หรือ GARMIN_PASSWORD ในไฟล์ .env ครับเจ้านาย"
        
        try:
            self.client = Garmin(self.email, self.password)
            self.client.login()
            return True, "เชื่อมต่อ Garmin สำเร็จแล้วครับ"
        except Exception as e:
            self.client = None
            return False, f"เชื่อมต่อ Garmin ล้มเหลว: {e}"

    def fetch_today_data(self):
        if not self.client:
            success, msg = self.connect()
            if not success:
                return None, msg
        
        today = datetime.date.today().isoformat()
        try:
            # ดึงข้อมูลสถิติพื้นฐาน (แคลอรี่, ก้าวเดิน, หัวใจ)
            stats = self.client.get_stats(today)
            # ดึงข้อมูลการนอนหลับ
            sleep_data = self.client.get_sleep_data(today)
            
            result = {
                "date": today,
                "sleep_hours": None,
                "sleep_score": None,
                "calories_in": None, # Garmin มักให้แต่ Active/Resting calories, calories_in ปกติมาจาก MyFitnessPal ถ้าเชื่อมไว้
                "calories_out": None,
                "resting_heart_rate": None,
                "steps": None
            }

            if stats:
                result["calories_out"] = stats.get('totalKilocalories')
                result["resting_heart_rate"] = stats.get('restingHeartRate')
                result["steps"] = stats.get('totalSteps')

            if sleep_data:
                # คำนวณเวลานอนรวมเป็นชั่วโมง
                sleep_seconds = sleep_data.get("dailySleepDTO", {}).get("sleepTimeSeconds")
                if sleep_seconds:
                    result["sleep_hours"] = round(sleep_seconds / 3600, 2)
                
                result["sleep_score"] = sleep_data.get("dailySleepDTO", {}).get("sleepScores", {}).get("overall", {}).get("value")

            notes_parts = []
            if result['sleep_score']:
                notes_parts.append(f"Sleep Score: {result['sleep_score']}")
            if result['steps']:
                notes_parts.append(f"Steps: {result['steps']}")
            if result['resting_heart_rate']:
                notes_parts.append(f"Resting HR: {result['resting_heart_rate']} bpm")

            result['notes'] = "ซิงก์อัตโนมัติจาก Garmin Connect (" + ", ".join(notes_parts) + ")"

            return result, "ดึงข้อมูลจาก Garmin สำเร็จ"
        except Exception as e:
            return None, f"ดึงข้อมูลล้มเหลว: {e}"
