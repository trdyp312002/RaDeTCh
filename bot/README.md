# 12_BotBas - AI-Powered Discord Transaction Tracker & Controller

โปรเจกต์บอท Discord อัจฉริยะที่ใช้ AI (Gemini Vision API) ในการอ่านและประมวลผลภาพถ่ายรายการธุรกรรมการซื้อขายสินทรัพย์ (หุ้น & Crypto) จากห้องแชท Discord แล้วนำข้อมูลที่สกัดได้ไปเก็บลง Google Sheets (Google Drive) และสั่งการบอทเทรดในอนาคต

## 📁 โครงสร้างโปรเจกต์ (Project Structure)
```text
12_BotBas/
├── README.md             # คู่มือการใช้งานและการตั้งค่าโปรเจกต์
├── main.py               # ไฟล์หลักสำหรับการรันบอท Discord
├── requirements.txt      # รายการ Library ที่จำเป็นต้องใช้
├── config.py             # ตั้งค่าการเรียกใช้ API Key และ Environment Variables
├── .env.example          # ตัวอย่างการตั้งค่าไฟล์ Environment (.env)
└── src/                  # โฟลเดอร์รวมโมดูลการทำงานต่างๆ
    ├── __init__.py
    ├── gemini_analyzer.py # ตัววิเคราะห์รูปภาพด้วย Gemini API
    └── sheets_db.py       # ตัวบันทึกข้อมูลเข้า Google Sheets
```

## ⚙️ เทคโนโลยีที่ใช้ (Tech Stack)
1. **Language:** Python 3.10+
2. **Libraries:**
   - `discord.py` (สำหรับติดต่อสื่อสารกับ Discord API)
   - `google-generativeai` (สำหรับส่งภาพไปวิเคราะห์ด้วย Gemini Pro/Flash Vision)
   - `gspread` (สำหรับบันทึกข้อมูลลง Google Sheets ได้อย่างรวดเร็ว)
   - `python-dotenv` (สำหรับโหลดค่าคอนฟิกจากไฟล์ `.env`)

## 🛠️ ขั้นตอนการเตรียมตัวและรันระบบเบื้องต้น
1. สร้างสภาพแวดล้อมจำลอง (Virtual Environment) และติดตั้ง Library:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # สำหรับ Windows
   pip install -r requirements.txt
   ```
2. คัดลอกไฟล์ `.env.example` เป็น `.env` แล้วใส่คีย์ต่าง ๆ:
   - `DISCORD_BOT_TOKEN`
   - `GEMINI_API_KEY`
3. รันโปรเจกต์:
   ```bash
   python main.py
   ```
