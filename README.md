# 🌐 RaDeTCh — Personal Life OS

ระบบนิเวศส่วนตัวที่รวม **เว็บแอป** และ **Discord Bot** เพื่อจัดการชีวิต การเงิน สุขภาพ และการลงทุน

---

## 🚀 ส่วนประกอบ

### 1. 🌐 RaDeTCh Web Application (Next.js)
- **คำอธิบาย:** Life OS ส่วนตัว แสดงทรัพย์สิน หุ้น & Crypto บันทึกสุขภาพ ท่องเที่ยว เมนูอาหาร ประจำวัน และ Routine
- **Tech Stack:** Next.js, TypeScript, React 19, TailwindCSS, Turso (libSQL)
- **รันเว็บ:** `npm run dev` → [http://localhost:3000](http://localhost:3000)

### 2. 📊 บอทบาส (BotBas) — Discord Investment Scanner
- **คำอธิบาย:** AI บอทสแกนสลิปธุรกรรมการลงทุน (หุ้น/Crypto) ใน Discord ด้วย Gemini Vision API แล้วอัปเดตเข้า Database อัตโนมัติ
- **โฟลเดอร์:** `bot/`
- **รัน:** `npm run bot`

---

## 🛠️ Quick Start

```bash
npm install
npm run dev
```

รัน Web + Bot พร้อมกัน:
```bash
npm run dev:all
```
