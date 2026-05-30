# 🌐 RaDeTCh Ecosystem (Web App, BotBas & Raphael Bot)

ยินดีต้อนรับสู่โครงการ **RaDeTCh** - ระบบนิเวศอัจฉริยะแบบบูรณาการที่รวมเว็บพอร์ตโฟลิโอส่วนตัวและบอท AI อัตโนมัติ เพื่อขับเคลื่อนและดูแลการใช้ชีวิตประจำวัน ตลอดจนการลงทุนอย่างสมบูรณ์แบบ

---

## 🚀 ส่วนประกอบภายในระบบนิเวศ (Ecosystem Components)

### 1. 🌐 [RaDeTCh Web Application (Next.js)](file:///c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/01_Code_Projects/radetch/README.md)
*   **คำอธิบาย:** เว็บบอร์ดพอร์ตโฟลิโอส่วนตัว คอยแสดงทรัพย์สิน หุ้น & Crypto รวมถึงบันทึกและวิเคราะห์ประวัติการท่องเที่ยว เมนูอาหาร ประจำวัน และการทักษะวินัยชีวิต (Routine / Anki)
*   **Tech Stack:** Next.js, TypeScript, React 19, TailwindCSS, SQLite/Turso
*   **การรันเว็บ:** `npm run dev` เพื่อเข้าถึง [http://localhost:3000](http://localhost:3000)

### 2. 📊 [บอทบาส (BotBas) - Discord Investment Scanner](file:///c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/01_Code_Projects/radetch/bot/README.md)
*   **คำอธิบาย:** AI บอทสแกนรูปภาพสลิปธุรกรรมการลงทุน (หุ้น/Crypto) ใน Discord โดยใช้ Gemini Vision API แกะสลักมูลค่า ยอดเงิน ราคาเฉลี่ย และอัปเดตตรงเข้าสู่ Database ของระบบ RaDeTCh ทันทีเมื่อผู้ใช้กดยืนยันผ่านปุ่มโต้ตอบ
*   **โฟลเดอร์:** `bot/`

### 3. 🛡️ [บอทราฟาเอล (Raphael) - AI เลขาส่วนตัวอัจฉริยะ](file:///c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/01_Code_Projects/radetch/bot_raphael/README.md)
*   **คำอธิบาย:** บอทเลขาส่วนตัวในชีวิตประจำวันของนายท่าน ตอบสนองด้วยวาจาสุภาพสตรี/บุรุษนอบน้อม ( butler Persona ) มีคลังข้อมูลอาหารแนะนำ (`menu.json`), ตารางรูทีนการฝึกวินัยชีวิตประจำวัน, วันหยุดสำคัญ, แนะนำจุดพักผ่อนท่องเที่ยว (`travel-spots.json`) และระบบฐานข้อมูล To-Do List กับ Reminder ในตัวด้วย SQLite
*   **โฟลเดอร์:** `bot_raphael/`

---

## 🛠️ วิธีการตั้งค่าใช้งานบอทราฟาเอล (Raphael Quick Start)

1.  เข้าสู่โฟลเดอร์ `bot_raphael`
2.  ติดตั้ง Dependencies ด้วย:
    ```bash
    pip install -r requirements.txt
    ```
3.  ใส่โทเคนบอทของคุณในไฟล์ `.env` (หัวข้อ `DISCORD_BOT_TOKEN`)
4.  รันบอทเลขาส่วนตัว:
    ```bash
    python main.py
    ```

กระผมราฟาเอลและระบบนิเวศ RaDeTCh ยินดีรับใช้คุณท่านในการพัฒนาคุณภาพชีวิตและการจัดการทรัพย์สินอย่างดีที่สุดครับกระผม! 🛡️💼

