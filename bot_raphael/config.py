import os
from dotenv import load_dotenv

# โหลดไฟล์ .env ของบอทบราฟาเอล
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# ดึงค่าคอนฟิกต่าง ๆ
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
RADETCH_API_URL = os.getenv("RADETCH_API_URL", "https://radetch.vercel.app")

# ตรวจสอบความถูกต้องเบื้องต้น
if not DISCORD_BOT_TOKEN or "YOUR_RAPHAEL" in DISCORD_BOT_TOKEN:
    print("[WARNING] กรุณาตั้งค่า DISCORD_BOT_TOKEN ในไฟล์ .env ของ bot_raphael")

if not GEMINI_API_KEY:
    print("[WARNING] กรุณาตั้งค่า GEMINI_API_KEY ในไฟล์ .env ของ bot_raphael")
