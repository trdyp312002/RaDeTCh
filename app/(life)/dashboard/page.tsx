"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./Dashboard.module.css";

type Health = { date:string; sleep_hours:number|null; sleep_score:number|null; steps:number|null; resting_heart_rate:number|null };
type Creation = { id:string; image:string; style:string; sourceName?:string; createdAt:string };
type WeatherDay = { date:string; code:number; max:number; min:number; rain:number };
type Book = { id:string; title:string; author:string; status:string; cover_image?:string };
type Diary = { date:string; morning:string; afternoon:string; evening:string };
type Mandala = { chart:{main_goal:string}|null; actions:Array<{completed:number;text:string}> };
type ScheduleItem={start:number;end:number;label:string;type:string};
type DashboardData = { health:Health[]; closet:Creation[]; books:Book[]; diary:Diary[]; mandala:Mandala|null; countries:unknown[]; music:unknown[]; menu:unknown[] };

const EMPTY:DashboardData={health:[],closet:[],books:[],diary:[],mandala:null,countries:[],music:[],menu:[]};
const weatherIcon=(code:number)=>code===0?"sunny":code<4?"partly_cloudy_day":code>=51&&code<=82?"rainy":code>=95?"thunderstorm":"cloud";
const weatherLabel=(code:number)=>code===0?"ฟ้าโปร่ง":code<4?"มีเมฆบางส่วน":code>=51&&code<=82?"มีฝน":code>=95?"พายุฝน":"ครึ้ม";
const todayISO=()=>new Date().toLocaleDateString("en-CA");
const dayName=(iso:string,index:number)=>index===0?"วันนี้":new Date(`${iso}T12:00:00`).toLocaleDateString("th-TH",{weekday:"short"});
const fmtTime=(minutes:number)=>`${String(Math.floor(minutes/60)%24).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`;
const WEEKDAY:ScheduleItem[]=[{start:360,end:390,label:"ออกกำลังกาย",type:"health"},{start:390,end:420,label:"เตรียมตัว + ออกจากบ้าน",type:"prepare"},{start:480,end:1140,label:"ทำงาน",type:"work"},{start:1140,end:1170,label:"เดินทางกลับบ้าน",type:"travel"},{start:1170,end:1210,label:"อาหารเย็น + พัก",type:"meal"},{start:1200,end:1290,label:"Self-Development",type:"focus"},{start:1290,end:1320,label:"เตรียมนอน + ทบทวนวัน",type:"rest"},{start:1320,end:1440,label:"นอนหลับ",type:"sleep"}];
const SATURDAY:ScheduleItem[]=[{start:360,end:390,label:"ออกกำลังกาย",type:"health"},{start:390,end:430,label:"อาหารเช้า",type:"meal"},{start:430,end:720,label:"Deep Focus: ภาษาญี่ปุ่น",type:"focus"},{start:720,end:780,label:"พักกลางวัน",type:"meal"},{start:780,end:1020,label:"English + Financial",type:"focus"},{start:1020,end:1110,label:"พักผ่อน",type:"rest"},{start:1110,end:1200,label:"Review สัปดาห์ + วางแผน",type:"focus"},{start:1200,end:1290,label:"เสริมทักษะ + ผ่อนคลาย",type:"rest"},{start:1290,end:1320,label:"เตรียมนอน",type:"sleep"}];
const SUNDAY:ScheduleItem[]=[{start:360,end:390,label:"ออกกำลังกายเบา ๆ",type:"health"},{start:390,end:430,label:"อาหารเช้า",type:"meal"},{start:430,end:720,label:"Japanese Study",type:"focus"},{start:720,end:810,label:"พักกลางวัน",type:"meal"},{start:810,end:1020,label:"English + Side Project",type:"focus"},{start:1020,end:1110,label:"พักผ่อน / ครอบครัว",type:"rest"},{start:1110,end:1200,label:"เตรียมสัปดาห์ใหม่",type:"focus"},{start:1200,end:1290,label:"ผ่อนคลาย",type:"rest"},{start:1290,end:1320,label:"เตรียมนอน",type:"sleep"}];

function outfitReason(day:WeatherDay){
  if(day.rain>=45)return "มีโอกาสฝน เลือกชิ้นที่คล่องตัวและพกเสื้อคลุมบาง";
  if(day.max>=30)return "อากาศร้อน เหมาะกับเนื้อผ้าเบาและระบายอากาศ";
  if(day.min<=12)return "เช้าเย็นค่อนข้างหนาว เพิ่มเลเยอร์หรือแจ็กเก็ต";
  if(day.max-day.min>=9)return "อุณหภูมิแกว่ง เลือกชุดที่เพิ่ม–ถอดเลเยอร์ได้";
  return "อากาศสบาย เลือกลุคที่เคลื่อนไหวสะดวกได้ทั้งวัน";
}

async function json(url:string){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(url);return r.json()}

export default function DashboardPage(){
  const [data,setData]=useState(EMPTY); const [weather,setWeather]=useState<WeatherDay[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(false);
  useEffect(()=>{(async()=>{const urls=["/api/health","/api/closet","/api/books","/api/daily","/api/mandala","/api/travel/countries","/api/music","/api/menu","/api/weather"];
    const r=await Promise.allSettled(urls.map(json)); const val=(i:number,fallback:any)=>r[i].status==="fulfilled"?r[i].value:fallback;
    const diaryRaw=val(3,[]); const musicRaw=val(6,[]); const menuRaw=val(7,[]);
    setData({health:val(0,[]),closet:val(1,{creations:[]}).creations||[],books:val(2,[]),diary:Array.isArray(diaryRaw)?diaryRaw:diaryRaw.entries||[],mandala:val(4,null),countries:val(5,[]),music:Array.isArray(musicRaw)?musicRaw:musicRaw.tracks||[],menu:Array.isArray(menuRaw)?menuRaw:menuRaw.items||[]});
    setWeather(val(8,{days:[]}).days||[]); setError(r.some(x=>x.status==="rejected")); setLoading(false);
  })()},[]);

  const latest=data.health.at(-1)||data.health[0]; const todayDiary=data.diary.find(x=>x.date===todayISO())||data.diary.at(-1); const reading=data.books.filter(x=>x.status==="reading");
  const actions=(data.mandala?.actions||[]).filter(action=>action.text?.trim()); const done=actions.filter(x=>x.completed===1).length; const goal=data.mandala?.chart?.main_goal||"ยังไม่ได้ตั้งเป้าหมายหลัก";
  const now=new Date(); const currentMin=now.getHours()*60+now.getMinutes(); const dow=now.getDay(); const todaySchedule=dow===6?SATURDAY:dow===0?SUNDAY:WEEKDAY; const progress=actions.length?Math.round(done/actions.length*100):0;
  const readiness=useMemo(()=>{if(!latest)return 0;const sleep=latest.sleep_score||0;const steps=Math.min((latest.steps||0)/10000*100,100);return Math.round(sleep*.72+steps*.28)},[latest]);
  const looks=weather.slice(0,3).map((day,i)=>({day,look:data.closet.length?data.closet[i%data.closet.length]:null})); const hero=looks[0];

  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>{new Date().toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p><h1>Good morning, RaDeTCh.</h1><p>วันนี้ควรโฟกัสอะไร ร่างกายพร้อมแค่ไหน และควรแต่งตัวอย่างไร</p></div><div className={styles.live}><span/> Daily brief · Tokyo</div></header>
    {error&&<div className={styles.notice}>ข้อมูลบางห้องยังโหลดไม่สำเร็จ — ส่วนที่พร้อมใช้งานยังแสดงตามปกติ</div>}
    <section className={styles.goalHero}>
      <div className={styles.goalSummary}><p className={styles.kicker}>TODAY&apos;S PRIMARY GOAL</p><h2>{goal}</h2><div className={styles.goalProgress}><div><strong>{progress}%</strong><span>{done} จาก {actions.length} รายการเสร็จแล้ว</span></div><div className={styles.meter}><span style={{width:`${progress}%`}}/></div></div><Link href="/routine" className={styles.primary}>เปิด Routine เพื่ออัปเดต</Link></div>
      <div className={styles.taskList}><div className={styles.taskHead}><div><p>TODAY&apos;S ACTIONS</p><h3>สิ่งที่ต้องทำวันนี้</h3></div><span>{actions.length-done} remaining</span></div>{actions.length?<div className={styles.tasks}>{actions.slice(0,7).map((action,index)=><div className={`${styles.task} ${action.completed?styles.taskDone:""}`} key={`${action.text}-${index}`}><span className="material-symbols-outlined">{action.completed?"check_circle":"radio_button_unchecked"}</span><p>{action.text}</p><small>{action.completed?"DONE":`#${String(index+1).padStart(2,"0")}`}</small></div>)}</div>:<div className={styles.noTasks}>ยังไม่มี action ใน Routine — เพิ่มสิ่งที่ต้องทำเพื่อให้ Dashboard ติดตามได้</div>}</div>
      <div className={styles.goalStatus}><p>DAY STATUS</p><div className={styles.statusRing} style={{background:`conic-gradient(#70866a ${progress*3.6}deg,#ded7ce 0deg)`}}><div><strong>{done}</strong><span>done</span></div></div><p>{progress===100?"เป้าหมายวันนี้เสร็จแล้ว":progress>=50?"ผ่านครึ่งทางแล้ว เดินหน้าต่อ":"เริ่มจาก action สำคัญที่สุดหนึ่งอย่าง"}</p></div>
    </section>

    <div className={styles.sectionHead}><div><p>TODAY&apos;S CALENDAR</p><h2>ตารางเวลาวันนี้</h2></div><Link href="/routine">ดูตารางเต็ม →</Link></div>
    <section className={styles.schedule}><div className={styles.timeRail}>{todaySchedule.map((item,index)=>{const active=currentMin>=item.start&&currentMin<item.end;return <article className={`${styles.scheduleItem} ${styles[item.type]} ${active?styles.now:""}`} key={`${item.label}-${index}`}><div className={styles.scheduleTime}><strong>{fmtTime(item.start)}</strong><span>{fmtTime(item.end)}</span></div><div className={styles.scheduleLine}><i/><span/></div><div className={styles.scheduleName}><strong>{item.label}</strong><span>{Math.round((item.end-item.start)/60*10)/10} ชั่วโมง</span></div>{active&&<b>NOW</b>}</article>})}</div><aside className={styles.scheduleAside}><p>CURRENT TIME</p><strong>{now.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})}</strong><span>{todaySchedule.find(item=>currentMin>=item.start&&currentMin<item.end)?.label||"นอกตารางหลัก"}</span><div/><p>NEXT UP</p><h3>{todaySchedule.find(item=>item.start>currentMin)?.label||"พักผ่อนและเตรียมพรุ่งนี้"}</h3></aside></section>

    <section className={styles.metrics}>
      <Metric icon="bedtime" label="Sleep" value={latest?.sleep_hours?`${latest.sleep_hours.toFixed(1)}h`:"—"} note={`score ${latest?.sleep_score??"—"}`}/>
      <Metric icon="steps" label="Steps" value={latest?.steps?.toLocaleString()||"—"} note="goal 10,000"/>
      <Metric icon="favorite" label="Resting HR" value={latest?.resting_heart_rate?`${latest.resting_heart_rate}`:"—"} note="bpm"/>
      <Metric icon="task_alt" label="Routine" value={`${done}/${actions.length}`} note="actions complete"/>
      <Metric icon="checkroom" label="Closet" value={`${data.closet.length}`} note="saved looks"/>
    </section>

    <div className={styles.sectionHead}><div><p>SECONDARY · NEXT 3 DAYS</p><h2>แต่งตัวตามวันและอากาศ</h2></div><Link href="/health/closet">จัดการ Closet →</Link></div>
    <section className={styles.forecast}>{looks.map(({day,look},i)=><article className={styles.dayCard} key={day.date}><div className={styles.dayTop}><div><strong>{dayName(day.date,i)}</strong><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString("th-TH",{day:"numeric",month:"short"})}</span></div><span className="material-symbols-outlined">{weatherIcon(day.code)}</span></div>{look?<img src={look.image} alt={`ลุค ${look.style}`}/>:<div className={styles.dayEmpty}>No look</div>}<div className={styles.dayInfo}><strong>{look?.style||"เพิ่มลุคใน Closet"}</strong><span>{Math.round(day.min)}°–{Math.round(day.max)}° · ฝน {day.rain}%</span><p>{outfitReason(day)}</p></div></article>)}</section>

    <div className={styles.sectionHead}><div><p>ALL ROOMS</p><h2>ทุกส่วนของ Life OS ในมุมเดียว</h2></div></div>
    <section className={styles.rooms}>
      <Room href="/routine" icon="track_changes" tone="sage" title="Focus & Routine" value={goal} detail={actions.length?`${done} จาก ${actions.length} actions สำเร็จแล้ว`:"เริ่มวางแผน Mandala"}/>
      <Room href="/daily" icon="edit_note" tone="sand" title="Today’s Diary" value={todayDiary?(todayDiary.morning||todayDiary.afternoon||todayDiary.evening||"มีบันทึกแล้ว"):"ยังไม่มีบันทึกวันนี้"} detail="เก็บความคิดก่อนวันจบ"/>
      <Room href="/books" icon="menu_book" tone="ink" title="Reading" value={reading[0]?.title||"ยังไม่มีเล่มที่กำลังอ่าน"} detail={`${data.books.length} เล่ม · อ่านจบ ${data.books.filter(x=>x.status==="completed").length}`}/>
      <Room href="/music" icon="headphones" tone="rose" title="Music" value={`${data.music.length} tracks`} detail="เปิด soundtrack ของวันนี้"/>
      <Room href="/menu" icon="restaurant" tone="amber" title="Menu" value={`${data.menu.length} เมนู`} detail="เลือกอาหารให้เหมาะกับพลังงานวันนี้"/>
      <Room href="/relationships" icon="diversity_1" tone="blue" title="Relations" value="People check-in" detail="ดูแลความสัมพันธ์ที่สำคัญ"/>
      <Room href="/travel" icon="flight" tone="sky" title="Travel" value={`${data.countries.length} ประเทศ`} detail="ความทรงจำและจุดหมายถัดไป"/>
      <Room href="/health" icon="monitor_heart" tone="red" title="Health" value={readiness?`${readiness} readiness`:"รอข้อมูลสุขภาพ"} detail="แนวโน้มการนอน ก้าวเดิน และหัวใจ"/>
    </section>
    <footer className={styles.footer}>ข้อมูลสดจาก Life OS · Weather by Open-Meteo · {new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})}</footer>
  </main>
}

function Metric({icon,label,value,note}:{icon:string;label:string;value:string;note:string}){return <div className={styles.metric}><span className="material-symbols-outlined">{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></div>}
function Room({href,icon,tone,title,value,detail}:{href:string;icon:string;tone:string;title:string;value:string;detail:string}){return <Link href={href} className={`${styles.room} ${styles[tone]}`}><div className={styles.roomIcon}><span className="material-symbols-outlined">{icon}</span></div><div><p>{title}</p><h3>{value}</h3><span>{detail}</span></div><b>↗</b></Link>}
