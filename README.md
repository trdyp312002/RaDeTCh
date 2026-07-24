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

### P0 — ทำให้ Daily OS เชื่อถือได้

- [ ] เพิ่ม `scheduled_date`, `start_time`, `end_time`, `priority` และ `completed_at` ให้ action
- [ ] แยก Daily Goal ออกจาก Mandala main goal แต่เชื่อม Daily Goal กลับไปยัง subgoal ได้
- [ ] แก้ตารางข้ามเที่ยงคืนให้ช่วงนอน 22:00–06:00 คำนวณเป็น 8 ชั่วโมง
- [ ] แก้ช่วงเวลาซ้อนกันระหว่างอาหารเย็น 19:30–20:10 และ Self-Development 20:00–21:30
- [ ] ทำ Daily Schedule เป็นข้อมูลกลางเดียวกันระหว่าง Routine กับ Dashboard
- [ ] แสดงสถานะรายแหล่งข้อมูล: loaded, empty, stale และ failed ให้แตกต่างกัน

### P1 — เพิ่มคุณค่ารายวัน

- [ ] เชื่อม Google Calendar หรือ Outlook Calendar เพื่อรวม meeting/event จริงในตารางวันนี้
- [ ] ทำ greeting ให้เปลี่ยนตามเวลา: morning, afternoon, evening และ night
- [ ] ทำ first viewport ให้เห็นทั้ง Today Goal และสรุป Calendar โดยไม่ต้องเลื่อนมาก
- [ ] เพิ่ม metadata เสื้อผ้า: ประเภท สี วัสดุ ฤดูกาล formal/casual และสภาพอากาศที่เหมาะสม
- [ ] เปลี่ยน Outfit Recommendation จากการหมุนรูปตามลำดับเป็นการจัดอันดับตาม weather + schedule + clothing metadata
- [ ] เพิ่ม location setting แทนค่าเริ่มต้น Tokyo
- [ ] เพิ่มปุ่มลบภาพ Closet พร้อม confirmation และ undo window

### P2 — รองรับการเติบโต

- [ ] ย้ายรูป Closet ไป Object Storage เช่น R2/S3 และเก็บเฉพาะ URL ใน Turso
- [ ] เพิ่ม source freshness และ last successful sync ใน Dashboard
- [ ] เพิ่ม event log สำหรับ AI generation, save failure และ API latency
- [ ] เพิ่ม automated tests สำหรับ schedule, cross-midnight duration, API failure และ responsive states
- [ ] แยก schedule constants ออกจากหน้า Routine ไปเป็น shared domain module

---

## 🔎 Website Analysis — Production Audit

ตรวจเว็บไซต์ production จากหน้าที่ผู้ใช้เห็นจริงเมื่อวันที่ **24 กรกฎาคม 2026** ครอบคลุม Dashboard, Routine, Closet, navigation, data flow และ deployment architecture

### Executive assessment

RaDeTCh มีทิศทางผลิตภัณฑ์ที่ชัดขึ้นจาก “หน้ารวมหลายฟีเจอร์” ไปเป็น **Daily Personal Operating System** จุดแข็งคือ visual identity ที่สงบ สม่ำเสมอ และมีโมดูลชีวิตที่ครอบคลุม แต่ระบบข้อมูลรายวันยังไม่แข็งแรงพอที่จะตอบคำถามหลักว่า “วันนี้ต้องทำอะไร และเสร็จหรือยัง” อย่างแม่นยำ

| ด้าน | ระดับปัจจุบัน | วิเคราะห์ |
|---|---:|---|
| Product direction | 8/10 | เป้าหมาย Today-first ชัดและแตกต่างจาก dashboard ทั่วไป |
| Visual design | 8/10 | ลำดับชั้นดี โทน Life OS สม่ำเสมอ และ card system ดูเป็นผลิตภัณฑ์เดียวกัน |
| Daily planning model | 4/10 | Mandala action ยังไม่มีวันที่ เวลา priority หรือความหมายว่าเป็นงานของวันนี้ |
| Data reliability | 5/10 | มี Turso และ API จริง แต่ empty/failure/stale ยังแยกไม่ชัด |
| Personalization | 5/10 | มี Health, Closet และ Weather แต่คำแนะนำยังใช้ rule แบบกว้าง |
| Persistence | 6/10 | ข้อมูลหลักอยู่ Turso แล้ว แต่ binary image ในฐานข้อมูลจะเป็นข้อจำกัดเมื่อโต |
| Deployment | 8/10 | GitHub main → Railway production ทำงานอัตโนมัติและตรวจสอบสถานะได้ |
| Accessibility/responsive | 7/10 | semantic controls และ responsive layout ค่อนข้างดี แต่ยังต้องทดสอบ keyboard/focus/mobile จริงครบทุก flow |

### สิ่งที่ทำได้ดี

1. **Dashboard มีลำดับข้อมูลที่ถูกทิศทาง** — Today Goal, action status และ schedule ถูกยกระดับเหนือ Health/Closet/Books
2. **Visual hierarchy ชัด** — primary goal ใช้พื้นที่และ contrast สูง ส่วนข้อมูลรองลดน้ำหนักลงอย่างเหมาะสม
3. **Routine เป็น editing source เดียว** — Dashboard ไม่สร้าง checkbox ซ้ำ ลดโอกาส state ขัดแย้งกัน
4. **Closet มี workflow ครบวงจร** — upload → AI generation → durable save → full-image view → download
5. **ระบบ production มีพื้นฐานดี** — Next.js, Turso, GitHub และ Railway เชื่อมกันเป็นเส้นทาง deploy ที่ตรวจสอบได้
6. **Empty state มีคำแนะนำต่อ** — เมื่อยังไม่มี goal/action/closet ระบบพาไปหน้าที่ควรเริ่มทำ
7. **Navigation มี mental model คงที่** — Dashboard, Health, Closet, Routine และห้องชีวิตอื่นอยู่ใน Life OS family เดียวกัน

### ข้อค้นพบสำคัญ

#### 1. Daily Goal ยังไม่ใช่ daily จริง

Dashboard นำ `mandala_charts.main_goal` มาแสดงเป็น Today’s Primary Goal และนำ action ที่มีข้อความทั้งหมดมาเป็น Today’s Actions แต่ schema ปัจจุบันไม่มีวันที่, due date, priority หรือ recurrence ดังนั้นรายการที่เห็นอาจเป็นเป้าหมายระยะยาว ไม่ใช่งานของวันที่เปิด Dashboard

**ผลกระทบ:** progress ของ “วันนี้” อาจดูถูกต้องทางตัวเลขแต่ผิดความหมาย

**ข้อเสนอ:** เพิ่ม domain model `daily_plans` และ `daily_actions` หรือเพิ่ม scheduling fields ให้ `mandala_actions` พร้อม query ตาม timezone ของผู้ใช้

#### 2. ตารางเวลาข้ามเที่ยงคืนคำนวณผิด

Routine ระบุเป้าหมายนอน `22:00 → 06:00 (8 ชั่วโมง)` แต่ block ใช้ `1320 → 1440` จึงแสดง `22:00 → 00:00` และคำนวณเพียง 2 ชั่วโมง ทั้งใน Routine และ Dashboard

**ผลกระทบ:** ตารางไม่สอดคล้องกับเป้าหมายสุขภาพและ readiness

**ข้อเสนอ:** รองรับ block ที่ `end < start` หรือใช้ timestamp ของวันจริงแทน minute-of-day เพียงอย่างเดียว

#### 3. ตารางมีช่วงเวลาซ้อนกันโดยไม่แจ้ง conflict

อาหารเย็นกำหนด `19:30–20:10` ขณะที่ Self-Development เริ่ม `20:00` ทำให้ซ้อนกัน 10 นาที

**ผลกระทบ:** ตารางดูแน่นแต่ทำจริงไม่ได้ตามเวลาที่กำหนด

**ข้อเสนอ:** เพิ่ม validation ตอนบันทึก schedule และแสดง conflict badge หากช่วงเวลาทับกัน

#### 4. Greeting ไม่สัมพันธ์กับเวลาจริง

Production เวลา 23:15 ยังแสดง `Good morning, RaDeTCh.`

**ผลกระทบ:** ลดความรู้สึกว่า Dashboard เข้าใจบริบทปัจจุบัน

**ข้อเสนอ:** map greeting จาก local hour และใช้ timezone setting เดียวกับ calendar/weather

#### 5. First viewport ยังใช้พื้นที่มาก

Today Goal hero มีความชัดเจน แต่สูงจนตารางวันนี้เริ่มอยู่ใต้ขอบจอ desktop ส่วนใหญ่ ผู้ใช้ต้องเลื่อนจึงเห็น schedule ซึ่งเป็นข้อมูลหลักลำดับที่สอง

**ข้อเสนอ:** ลด hero height, จำกัด action preview 3–5 รายการ และวาง “Now / Next” ข้าง goal เพื่อให้ summary ของ calendar อยู่เหนือ fold

#### 6. Empty, failed และ stale data ยังคล้ายกัน

ใน production หลายโมดูลแสดงค่า `0`, `—` หรือ “ยังไม่มีข้อมูล” แต่ผู้ใช้ไม่ทราบว่าไม่มี record จริง, session/API ล้มเหลว หรือข้อมูล sync ไม่ทัน

**ข้อเสนอ:** ทุก source ควรมี `status`, `lastUpdated`, `recordCount` และ error boundary เฉพาะส่วน

#### 7. Outfit recommendation ยังไม่เข้าใจเสื้อผ้า

Dashboard หมุนเลือกภาพจาก Closet ตามลำดับและใช้ weather rule สร้างคำอธิบาย แต่ยังไม่มี metadata ว่าเสื้อเป็นประเภทใด สีอะไร หนาหรือบาง และเหมาะกับกิจกรรมใด

**ผลกระทบ:** คำแนะนำ “มาจาก Closet” จริง แต่ยังไม่ใช่ recommendation engine ที่เลือกชุดเหมาะที่สุด

**ข้อเสนอ:** ตอนสร้างภาพให้ AI ส่ง structured metadata คู่กับภาพ แล้ว rank ด้วย weather, schedule และ dress code

#### 8. การเก็บรูปใน Turso มีเพดานการเติบโต

การเก็บ JPEG เป็น data URL ใน `closet_creations.image_data` ทำให้ใช้งานง่ายและ durable ในระยะเริ่มต้น แต่เพิ่มขนาดฐานข้อมูล, response payload และ memory usage ทุกครั้งที่โหลด gallery

**ข้อเสนอ:** ย้ายภาพไป Object Storage, ทำ thumbnail และ paginate gallery

#### 9. Schedule มี source ซ้ำใน code

Dashboard และ Routine มี schedule constants คนละชุด แม้เนื้อหาปัจจุบันตรงกัน แต่การแก้หน้าเดียวอาจทำให้อีกหน้าไม่อัปเดต

**ข้อเสนอ:** สร้าง `lib/dailySchedule.ts` หรือ table/API กลาง แล้วให้ทั้งสองหน้าอ่านจาก source เดียว

#### 10. Dashboard breadth ดี แต่บางห้องยังเป็นเพียงทางลัด

Relations ไม่มี metric จริง ส่วน Music/Menu ใช้เพียงจำนวนรายการ จึงยังไม่ช่วยตัดสินใจเท่า Today Goal, Health หรือ Schedule

**ข้อเสนอ:** แสดงเฉพาะ signal ที่นำไปสู่การกระทำ เช่น คนที่ควรติดต่อวันนี้, เมนูที่เหมาะกับ calorie target หรือ playlist สำหรับ focus block ปัจจุบัน

### สถาปัตยกรรมเป้าหมาย

```text
Routine / Calendar / Health / Closet
              │
              ▼
       Daily Context API
  date · timezone · goal · actions
  events · readiness · weather · outfit
              │
              ▼
        Dashboard (read model)
  Now → Next → Today → Secondary signals
```

Dashboard ควรอ่านจาก endpoint เดียว เช่น `/api/daily-context` ซึ่งรวมและ normalize ข้อมูลจากหลาย source ฝั่ง server เพื่อให้ freshness, error handling, timezone และ metric definitions สอดคล้องกัน

### Definition of done สำหรับ Daily Dashboard

- ผู้ใช้รู้ภายใน 5 วินาทีว่าเป้าหมายวันนี้คืออะไร
- ผู้ใช้เห็นจำนวนงานที่เหลือและงานสำคัญถัดไปโดยไม่ต้องเลื่อน
- ตารางแสดง `Now`, `Next` และ conflict อย่างถูกต้อง
- action ทุกตัวมีวันที่หรือกฎ recurrence ที่ตรวจสอบได้
- การติ๊กใน Routine สะท้อนบน Dashboard หลัง refresh โดยไม่มี state ซ้ำ
- ข้อมูลว่าง, stale และ error มีหน้าตา/ข้อความต่างกัน
- Outfit ที่แนะนำมีเหตุผลจาก weather + schedule + garment metadata
- หน้า mobile แสดง goal, next action และ next calendar event ใน first viewport

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
