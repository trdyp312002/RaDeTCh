import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

type Block = { id:string; start:number; end:number; label:string; type:string; note?:string }
type Schedule = { regular:Block[]; overtime:Block[] }

const defaults: Schedule = {
  regular: [
    {id:"wake",start:330,end:340,label:"ตื่นนอน ดื่มน้ำเปล่า 1 แก้ว",type:"prepare"},
    {id:"exercise",start:340,end:370,label:"ออกกำลังกายตอนเช้า",type:"health",note:"30 นาที"},
    {id:"morning",start:370,end:420,label:"อาบน้ำ แต่งตัว และทานมื้อเช้า",type:"meal"},
    {id:"work",start:420,end:1020,label:"เดินทาง ทำงาน มื้อกลางวัน",type:"work"},
    {id:"home",start:1020,end:1080,label:"ถึงบ้าน / อาบน้ำ ทำมื้อเย็น",type:"meal"},
    {id:"dinner",start:1080,end:1140,label:"ทานมื้อเย็น",type:"meal",note:"เน้นโปรตีนและผัก"},
    {id:"rest",start:1140,end:1200,label:"พักผ่อนตามอัธยาศัย / ทำงานบ้าน",type:"rest"},
    {id:"winddown",start:1200,end:1290,label:"เคลียร์ตัวเอง เตรียมตัวนอน",type:"rest"},
    {id:"sleep",start:1290,end:1770,label:"เข้านอน",type:"sleep",note:"นอนเต็มอิ่ม 8 ชั่วโมง"},
  ],
  overtime: [
    {id:"wake",start:330,end:340,label:"ตื่นนอน ดื่มน้ำเปล่า 1 แก้ว",type:"prepare"},
    {id:"exercise",start:340,end:370,label:"ออกกำลังกายตอนเช้า",type:"health",note:"30 นาที"},
    {id:"morning",start:370,end:420,label:"อาบน้ำ แต่งตัว และทานมื้อเช้า",type:"meal"},
    {id:"work",start:420,end:1155,label:"เดินทาง ทำงาน มื้อกลางวัน",type:"work",note:"อยู่ทำงานโอที"},
    {id:"commute",start:1155,end:1200,label:"เดินทางกลับบ้าน",type:"travel"},
    {id:"dinner",start:1200,end:1260,label:"ถึงบ้าน / ทานมื้อเย็นเบาๆ",type:"meal",note:"ย่อยง่าย"},
    {id:"winddown",start:1260,end:1290,label:"อาบน้ำ เคลียร์ตัวเอง เตรียมตัวนอน",type:"rest"},
    {id:"sleep",start:1290,end:1770,label:"เข้านอน",type:"sleep",note:"นอนเต็มอิ่ม 8 ชั่วโมง"},
  ],
}

async function table(){ await db.execute("CREATE TABLE IF NOT EXISTS routine_schedule (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))" ) }
async function load():Promise<Schedule>{ await table(); const result=await db.execute("SELECT data FROM routine_schedule WHERE id='default'"); if(!result.rows.length){await db.execute({sql:"INSERT INTO routine_schedule (id,data) VALUES (?,?)",args:["default",JSON.stringify(defaults)]});return defaults} try{return JSON.parse(String(result.rows[0].data))}catch{return defaults} }
function valid(schedule:any):schedule is Schedule{return ["regular","overtime"].every(key=>Array.isArray(schedule?.[key])&&schedule[key].every((b:any)=>typeof b.id==="string"&&typeof b.label==="string"&&Number.isFinite(b.start)&&Number.isFinite(b.end)&&b.end>b.start))}
export async function GET(){try{return NextResponse.json({schedule:await load()})}catch(error){return NextResponse.json({error:String(error)},{status:500})}}
export async function PUT(request:NextRequest){try{await table();const {schedule}=await request.json();if(!valid(schedule))return NextResponse.json({error:"ตารางไม่ถูกต้อง"},{status:400});await db.execute({sql:"INSERT INTO routine_schedule (id,data,updated_at) VALUES ('default',?,datetime('now')) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=datetime('now')",args:[JSON.stringify(schedule)]});return NextResponse.json({schedule})}catch(error){return NextResponse.json({error:String(error)},{status:500})}}