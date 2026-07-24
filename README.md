# 🌐 RaDeTCh — Personal Life & Wealth OS

RaDeTCh คือระบบปฏิบัติการส่วนตัวที่รวมข้อมูลสำคัญของชีวิตไว้ในเว็บเดียว เพื่อช่วยตอบคำถามว่า **วันนี้ต้องทำอะไร สุขภาพพร้อมแค่ไหน ควรแต่งตัวอย่างไร และแต่ละเป้าหมายคืบหน้าไปถึงไหนแล้ว**

Production: [https://radetch-production.up.railway.app](https://radetch-production.up.railway.app)

---

## 🎯 เป้าหมายของโครงการ

1. **Today first** — เมื่อเปิด Dashboard ต้องเห็นเป้าหมาย งาน และตารางเวลาของวันนี้ก่อนข้อมูลอื่น
2. **Single source of truth** — สถานะ action แก้ไขจาก Routine จุดเดียว ส่วน Dashboard ทำหน้าที่สรุป
3. **All rooms, one view** — รวม Health, Routine, Diary, Closet, Books, Music, Menu, Relations และ Travel ในหน้าเดียว
4. **Personal recommendations** — ใช้ข้อมูลจริงของผู้ใช้เพื่อแนะนำการแต่งตัวและสิ่งที่ควรทำในแต่ละวัน
5. **Durable personal archive** — ข้อมูลและรูปที่สร้างต้องบันทึกถาวรและเปิดดูได้จากหลายอุปกรณ์
6. **Mobile complete** — ความสามารถหลักต้องใช้งานได้ทั้งมือถือและเดสก์ท็อป

---

## ✅ สถานะปัจจุบัน — อัปเดต 24 กรกฎาคม 2026

### Dashboard หลัก

- [x] แสดงเป้าหมายหลักจาก Routine เป็นข้อมูลอันดับแรก
- [x] แสดง action วันนี้ พร้อมสถานะเสร็จ/ยังไม่เสร็จแบบอ่านอย่างเดียว
- [x] แสดง progress เป็นเปอร์เซ็นต์และจำนวนรายการที่เหลือ
- [x] เชื่อมกลับไป Routine สำหรับแก้ไขและติ๊กงาน
- [x] แสดงตารางเวลาของวันนี้ แยกวันธรรมดา วันเสาร์ และวันอาทิตย์
- [x] ไฮไลต์ช่วงเวลาปัจจุบันด้วย `NOW`
- [x] แสดงเวลาปัจจุบันและกิจกรรมถัดไป
- [x] สรุป Sleep, Steps, Resting Heart Rate, Routine และจำนวนลุคใน Closet
- [x] รวมทางลัดและข้อมูลสรุปจากทุกห้องของ Life OS
- [x] แสดงคำแนะนำการแต่งตัวตามพยากรณ์ 3 วัน
- [x] ใช้ Open-Meteo สำหรับอากาศ Tokyo โดยไม่ต้องใช้ API key

### Closet 3D Studio

- [x] เพิ่มห้อง `/health/closet` ใน Health OS
- [x] อัปโหลดหรือลากวางรูป JPG, PNG และ WEBP สูงสุด 8 MB
- [x] ใช้ Google Gemini Image สร้างภาพเสื้อผ้าบน mannequin 3D
- [x] เสื้อผ้าสีเข้มใช้ mannequin สีขาว
- [x] เสื้อผ้าสีขาวหรือสีอ่อนใช้ mannequin สีดำ/charcoal
- [x] มีท่า 3D หลายรูปแบบ เช่น Front, Soft Turn, Editorial Walk และ Ghost Mannequin
- [x] แสดงเวลาที่ใช้ระหว่างสร้างภาพ และรอได้สูงสุด 3 นาที
- [x] ดาวน์โหลดผลงานเป็น JPEG
- [x] บันทึกภาพถาวรใน Turso แทนการพึ่ง `localStorage`
- [x] ย้ายภาพเก่าจาก `localStorage` เข้า Turso อัตโนมัติเมื่อเปิด Closet
- [x] เปิดภาพเก่าแบบเต็มจอ พร้อมสไตล์ วันที่ แหล่งรูป และปุ่มดาวน์โหลด
- [x] ใช้ภาพจาก Closet เป็นลุคแนะนำบน Dashboard

### ระบบเดิมที่ยังใช้งานอยู่

- [x] Health และ Garmin data
- [x] Routine, Mandala Goal และ Life Timeline
- [x] Diary
- [x] Books Library
- [x] Music Library
- [x] Menu
- [x] Relationships
- [x] Travel Map
- [x] Wealth OS, Portfolio และ Stock Discovery
- [x] Discord Bot และ daily sync scripts

---

## 🏗️ สถาปัตยกรรม

| ส่วน | เทคโนโลยี/บริการ | หน้าที่ |
|---|---|---|
| Web | Next.js 16, React 19, TypeScript | Life OS และ Wealth OS |
| UI | Tailwind CSS 4, CSS Modules | Responsive interface และ design system |
| Database | Turso / libSQL | Health, Routine, Closet archive และข้อมูลถาวร |
| AI Image | Google Gemini Image API | แปลงรูปเสื้อผ้าเป็น mannequin 3D |
| Weather | Open-Meteo Forecast API | พยากรณ์สำหรับแนะนำลุคประจำวัน |
| Hosting | Railway | Build และ production deployment |
| Source | GitHub `trdyp312002/RaDeTCh` | Source of truth และ auto-deploy จาก `main` |
| Bot | Discord.js, Gemini/AI services | Assistant, scanner และ notification |

---

## 🔌 API ที่เพิ่มล่าสุด

| Endpoint | Method | หน้าที่ |
|---|---|---|
| `/api/closet/generate` | `POST` | รับรูปต้นฉบับ สร้าง mannequin 3D และบันทึกลง Turso |
| `/api/closet` | `GET` | โหลดคลัง Closet แบบถาวร |
| `/api/closet` | `POST` | ย้าย/อัปโหลดภาพเก่าจาก browser เข้า Turso |
| `/api/closet` | `DELETE` | รองรับการลบผลงานตาม ID |
| `/api/weather` | `GET` | พยากรณ์ Tokyo 3 วันสำหรับ Dashboard |

ตาราง Turso ที่เพิ่ม:

```sql
closet_creations (
  id TEXT PRIMARY KEY,
  image_data TEXT NOT NULL,
  style TEXT NOT NULL,
  source_name TEXT,
  created_at TEXT NOT NULL
)
```

> ปัจจุบันเก็บภาพเป็น JPEG data URL ใน Turso เหมาะกับคลังส่วนตัวขนาดเล็ก หากจำนวนภาพเพิ่มมากควรย้าย binary ไป Object Storage เช่น Cloudflare R2 หรือ S3 และเก็บเฉพาะ URL ในฐานข้อมูล

---

## 🔐 Environment Variables

ค่าหลักที่ต้องมีใน `.env.local` และ Railway Variables:

```env
APP_PASSWORD=
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
GOOGLE_AI_API_KEY=
```

ค่าที่เลือกตั้งเพิ่มได้:

```env
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
WEATHER_LATITUDE=35.6762
WEATHER_LONGITUDE=139.6503
```

ห้าม commit ค่า secret จริงลง GitHub

---

## 🚀 การติดตั้งและรันในเครื่อง

ต้องมี Node.js 16 ขึ้นไป โดย production ปัจจุบันใช้ Node.js 22

```bash
npm install
npm run dev
```

เปิดเว็บที่ [http://localhost:3000](http://localhost:3000)

คำสั่งสำคัญ:

```bash
npm run build       # ตรวจ production build
npm run start       # รันเฉพาะเว็บ production
npm run dev:all     # เว็บ + Discord bot + diary sync
npm run start:all   # เว็บ production + Discord bot
npm run bot         # รัน Discord bot
npm run sync:diary  # sync diary
npm run sync:stocks # refresh stock discovery
```

---

## 🚂 Railway

ติดตั้ง Railway CLI แบบ global แล้วด้วย:

```bash
npm install -g @railway/cli
```

เวอร์ชันที่ตรวจล่าสุด: `railway 5.28.1`

สถานะการเชื่อมปัจจุบัน:

| รายการ | ค่า |
|---|---|
| Workspace | `trdyp312002's Projects` |
| Project | `hospitable-emotion` |
| Environment | `production` |
| Service | `RaDeTCh` |
| Region | Southeast Asia |
| Repository | `trdyp312002/RaDeTCh` |
| Branch | `main` |
| Production URL | `https://radetch-production.up.railway.app` |

ตั้งค่าใน `railway.toml`:

```toml
[build]
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:all"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

คำสั่ง Railway ที่ใช้:

```bash
railway login
railway link --project <PROJECT_ID> --environment production --service RaDeTCh
railway status
railway deployment list --json
railway logs
railway variables --json
```

เมื่อ push commit ไปที่ GitHub สาขา `main` Railway จะ build และ deploy อัตโนมัติ

---

## 📌 งานถัดไป

- [ ] เพิ่มการกำหนดว่า action ใดเป็น “งานของวันนี้” โดยมีวันที่จริง แทนการแสดง action ที่มีข้อความทั้งหมด
- [ ] ทำ Daily Schedule ให้แก้ไขได้และใช้ข้อมูลกลางเดียวกันระหว่าง Routine กับ Dashboard
- [ ] เชื่อม Google Calendar หรือ Outlook Calendar เพื่อรวม meeting/event จริงในตารางวันนี้
- [ ] เพิ่ม metadata เสื้อผ้า เช่น ประเภท สี ฤดูกาล และโอกาสใช้งาน เพื่อให้คำแนะนำลุคแม่นยำขึ้น
- [ ] เพิ่มปุ่มลบภาพ Closet พร้อม confirmation ใน UI
- [ ] ย้ายรูป Closet ไป Object Storage เมื่อคลังภาพมีขนาดใหญ่
- [ ] เพิ่ม location setting สำหรับพยากรณ์อากาศแทนค่าเริ่มต้น Tokyo
- [ ] เพิ่ม dashboard QA สำหรับข้อมูลที่ stale หรือ API บางห้องโหลดไม่สำเร็จ

---

## 🎨 Design Direction

RaDeTCh ใช้แนวทาง **Calm Clarity**:

- Dashboard ต้องตอบคำถามสำคัญก่อน: เป้าหมายวันนี้ งานวันนี้ และตารางวันนี้
- Life OS ใช้โทนอบอุ่น สงบ และอ่านได้นาน
- ข้อมูลรองใช้ progressive disclosure และ card ที่กดไปหน้ารายละเอียดได้
- ทุกฟีเจอร์หลักต้องรองรับมือถือ

มาตรฐานการออกแบบฉบับเต็มอยู่ที่ [`design.md`](./design.md)

---

<!-- related-notes:start -->
## Related Notes

- [[BRAIN/02-Projects/radetch/AGENTS|AGENTS]] — คำแนะนำสำหรับ agent
- [[BRAIN/02-Projects/radetch/CLAUDE|CLAUDE]] — บริบทการพัฒนาเดิม
- [[BRAIN/02-Projects/comvest-web/README|README]] — โปรเจกต์ใน design family เดียวกัน
- [[BRAIN/02-Projects/comvest-web/AGENTS|AGENTS]] — แนวทางที่เกี่ยวข้อง
<!-- related-notes:end -->
