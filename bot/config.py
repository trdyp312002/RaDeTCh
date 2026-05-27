import os
from dotenv import load_dotenv

# โหลดไฟล์ .env
load_dotenv()

# ดึงค่าคอนฟิกต่าง ๆ
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
RADETCH_API_URL = os.getenv("RADETCH_API_URL", "http://localhost:3000")

# ตรวจสอบความถูกต้องเบื้องต้น
if not DISCORD_BOT_TOKEN:
    print("[WARNING] กรุณาตั้งค่า DISCORD_BOT_TOKEN ในไฟล์ .env")

if not GEMINI_API_KEY:
    print("[WARNING] กรุณาตั้งค่า GEMINI_API_KEY ในไฟล์ .env")

