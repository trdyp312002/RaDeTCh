# RaDeTCh Design System

> มาตรฐานกลางสำหรับการออกแบบและพัฒนา RaDeTCh — Personal Life & Wealth OS

## 1. Design principles

1. **Calm clarity** — ข้อมูลต้องอ่านง่าย ลำดับชั้นชัด และไม่สร้างความกดดันเกินจำเป็น
2. **Contextual worlds** — แต่ละ OS มีบุคลิกของตัวเอง แต่ Navigation, spacing และ interaction ต้องรู้สึกว่าอยู่ในผลิตภัณฑ์เดียวกัน
3. **Data first** — ตัวเลข สถานะ และการตัดสินใจเป็นพระเอก การตกแต่งมีไว้ช่วยสื่อสาร
4. **Progressive disclosure** — แสดงสาระสำคัญก่อน รายละเอียดลึกใช้ card, panel, filter หรือหน้ารอง
5. **Mobile complete** — ทุกความสามารถหลักต้องใช้งานได้บนมือถือ ไม่ใช่เพียงย่อหน้าจอ desktop

## 2. Product design families

RaDeTCh ใช้ design family ตามบริบท ไม่ควรผสม palette ระหว่าง family ภายในหน้าเดียว

### Life OS — Mindful Clarity

- บุคลิก: สงบ อบอุ่น เป็นส่วนตัว และอ่านได้นาน
- Background: `#F5F2ED`
- Text: `#1A1A1A`


- Secondary text: `#5C564E`
- Subtle border: `rgba(26, 26, 26, 0.10)`

- Hover surface: `#FAF8F5`
- Serif accent: `EB Garamond`
- Body/UI: `Inter`

### Wealth OS — Financial Intelligence

- บุคลิก: แม่นยำ ทันสมัย น่าเชื่อถือ และเป็น data terminal ที่เข้าถึงง่าย
- Page background: `#070B14` หรือ gradient `#0D1E30 → #0A0F18`
- Surface: `#0D1421`, `#0F172A`
- Elevated surface: `#111A2A`
- Border: `#1B293C` หรือ `rgba(255,255,255,0.05)`
- Primary text: `#FFFFFF`
- Secondary text: `#94A3B8`
- Muted text: `#64748B`
- Primary accent: `#2DD4BF`
- Information: `#3B82F6`
- Attention: `#F59E0B`
- Positive: `#34D399` / `#4ADE80`
- Negative: `#F87171`
- Body/UI: `Inter`
- Display headings: `Outfit`
- Financial/code values: `JetBrains Mono`

### OmniTrade — Tactical System

- บุคลิก: game-like, technical และ operational
- ใช้ dark foundation ของ Wealth OS
- ใช้ cyan/magenta/green glow อย่างจำกัดสำหรับ status และ active state
- Pixel font ใช้เฉพาะ label หรือ HUD ขนาดเล็ก ห้ามใช้กับเนื้อหายาว

## 3. Typography

| Role | Font | Desktop | Mobile | Weight |
|---|---|---:|---:|---:|
| Display | Outfit / Inter | 48–64px | 34–40px | 700 |
| Page title | Outfit / Inter | 32–40px | 26–32px | 700 |
| Section title | Inter | 20–24px | 18–22px | 600–700 |
| Card title | Inter | 14–18px | 14–17px | 600 |
| Body | Inter | 14–16px | 14–16px | 400 |
| Supporting | Inter | 11–13px | 11–13px | 400–500 |
| Data | JetBrains Mono | 14–32px | 13–26px | 500–700 |
| Eyebrow | Inter | 10–12px | 10–11px | 700–800 |

- Body line-height: `1.5–1.7`
- Eyebrow ใช้ uppercase และ letter-spacing `0.10–0.16em`
- หลีกเลี่ยงข้อความสีเทาขนาดต่ำกว่า 11px สำหรับข้อมูลสำคัญ
- ตัวเลขในกลุ่มเดียวกันควรใช้ tabular/monospace เพื่อเปรียบเทียบง่าย

## 4. Spacing and layout

ใช้ฐาน 4px โดยให้ 8px เป็นจังหวะหลัก

- Micro: `4px`
- Compact: `8px`
- Component gap: `12px`
- Standard gap: `16px`
- Section gap: `24px`
- Page rhythm: `32px`
- Large separation: `48px`
- Desktop page padding: `32–60px`
- Mobile page padding: `14–20px`
- Maximum content width: `1500px`; เนื้อหาอ่านยาวใช้ `720–800px`

Breakpoints:

- Mobile: `< 768px`
- Tablet/small desktop: `768–1050px`
- Desktop: `> 1050px`

Grid ที่แนะนำ: desktop 3 columns, tablet 2 columns, mobile 1 column

## 5. Shape, depth and surfaces

- Input/button radius: `10–12px`
- Card radius: `14–20px`
- Primary panel radius: `20–24px`
- Pill/filter radius: `20–30px`
- ใช้ border บางเพื่อแยกชั้นก่อนใช้ shadow
- Wealth OS ใช้ glass effect ได้เฉพาะ navigation หรือ floating control: blur `10–16px`
- Life OS เน้น flat surface และ border อ่อน หลีกเลี่ยง glow
- Hover card: translateY สูงสุด `-3px`, duration `200–300ms`

## 6. Components

### Navigation

- Desktop: logo ซ้าย, primary routes กลาง, utility ด้านขวา
- Active route ต้องมีทั้งสีและพื้นหลัง/ขอบ ไม่พึ่งสีอย่างเดียว
- Mobile: sticky top header และ fixed bottom navigation
- จำนวน bottom-nav itemsควรไม่เกิน 6 รายการ

### Cards

- หนึ่ง card มีหนึ่งหน้าที่หลัก
- ลำดับ: identity/status → primary value → context → action
- Card ที่กดได้ต้องมี hover/focus state และ cursor ที่เหมาะสม
- ไม่ใช้ card ซ้อน card เกิน 2 ชั้น

### Filters and search

- Search มาก่อน filters เมื่อรายการมีจำนวนมาก
- แสดงจำนวนผลลัพธ์และปุ่มล้างตัวกรองเสมอ
- Filter label ต้องอยู่เหนือค่าหรือมี accessible label
- Mobile ใช้ 1–2 columns และต้องแตะได้อย่างน้อย 44px

### Status and financial values

- Positive: green; negative: red; neutral: slate
- สีต้องมาพร้อม label, icon หรือลูกศรเสมอ
- แยก `Research Score`, market performance และ recommendation ออกจากกันอย่างชัดเจน
- ข้อมูลวิเคราะห์หุ้นต้องมี disclaimer เมื่ออาจถูกตีความเป็นคำแนะนำลงทุน

### Empty, loading and error states

- Loading: ใช้ skeleton หรือข้อความสั้น ไม่ทำให้ layout กระโดด
- Empty: อธิบายว่าไม่พบอะไรและเสนอ action ต่อไป
- Error: บอกผลกระทบและวิธีลองใหม่ ห้ามแสดง raw stack trace

## 7. Interaction and accessibility

- Touch target ขั้นต่ำ `44 × 44px`
- Keyboard focus ต้องมองเห็นได้ด้วย outline/accent ที่ contrast ชัด
- Text ปกติต้องมี contrast อย่างน้อย WCAG AA
- Icon-only button ต้องมี `aria-label` หรือ `title`
- Animation ปกติ `150–300ms`; รองรับ `prefers-reduced-motion`
- ห้ามใช้สีเพียงอย่างเดียวในการสื่อสารสถานะ
- ตารางกว้างบนมือถือควรเปลี่ยนเป็น cards หรือมี horizontal scroll ที่ชัดเจน

## 8. Content language

- ภาษาไทยใช้สำหรับคำอธิบายและ action ที่เกี่ยวกับชีวิตผู้ใช้
- ภาษาอังกฤษใช้กับ ticker, metric, technical term และชื่อระบบ
- ใช้คำเดียวกันทั้งระบบ เช่น `Portfolio`, `Balance Sheet`, `Stock Discovery`
- หัวข้อสั้นและ answer-first; หลีกเลี่ยงศัพท์การตลาดที่ไม่เพิ่มข้อมูล

## 9. Rules for new pages

ก่อนเพิ่มหน้าใหม่:

1. ระบุว่าอยู่ใน Life OS, Wealth OS หรือ OmniTrade
2. ใช้ layout และ navigation ของ OS นั้น
3. ใช้ token ในเอกสารนี้ก่อนสร้างสีหรือ spacing ใหม่
4. ออกแบบ mobile state พร้อม desktop
5. เพิ่ม loading, empty และ error state เมื่อมีข้อมูล dynamic
6. ตรวจ keyboard, contrast และ touch targets
7. รัน production build ก่อนส่งมอบ

หากจำเป็นต้องสร้าง pattern ใหม่ ให้เพิ่มเหตุผลและ token ใหม่กลับมายัง `design.md` เพื่อไม่ให้มาตรฐานกระจายอยู่เฉพาะใน component

## 10. Source of truth

- มาตรฐานเชิงหลักการ: `design.md` (ไฟล์นี้)
- Global tokens/themes: `app/globals.css`
- Wealth OS implementation: `app/wealth-os/styles.css`
- Component-specific styles: CSS Module ที่อยู่ข้าง component
- โครงสร้างหน้าและ behavior จริงมีสิทธิ์เหนือ mockup เก่า แต่ต้องอัปเดตเอกสารนี้เมื่อเปลี่ยนระบบ

---

**Last updated:** 2026-07-18
