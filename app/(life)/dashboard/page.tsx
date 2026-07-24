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
type DashboardData = { health:Health[]; closet:Creation[]; books:Book[]; diary:Diary[]; mandala:Mandala|null; countries:unknown[]; music:unknown[]; menu:unknown[] };

const EMPTY:DashboardData={health:[],closet:[],books:[],diary:[],mandala:null,countries:[],music:[],menu:[]};
const weatherIcon=(code:number)=>code===0?"sunny":code<4?"partly_cloudy_day":code>=51&&code<=82?"rainy":code>=95?"thunderstorm":"cloud";
const weatherLabel=(code:number)=>code===0?"ฟ้าโปร่ง":code<4?"มีเมฆบางส่วน":code>=51&&code<=82?"มีฝน":code>=95?"พายุฝน":"ครึ้ม";
const todayISO=()=>new Date().toLocaleDateString("en-CA");
const dayName=(iso:string,index:number)=>index===0?"วันนี้":new Date(`${iso}T12:00:00`).toLocaleDateString("th-TH",{weekday:"short"});

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
  const actions=data.mandala?.actions||[]; const done=actions.filter(x=>x.completed===1).length; const goal=data.mandala?.chart?.main_goal||"ยังไม่ได้ตั้งเป้าหมายหลัก";
  const readiness=useMemo(()=>{if(!latest)return 0;const sleep=latest.sleep_score||0;const steps=Math.min((latest.steps||0)/10000*100,100);return Math.round(sleep*.72+steps*.28)},[latest]);
  const looks=weather.slice(0,3).map((day,i)=>({day,look:data.closet.length?data.closet[i%data.closet.length]:null})); const hero=looks[0];

  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>{new Date().toLocaleDateString("th-TH",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p><h1>Good morning, RaDeTCh.</h1><p>วันนี้ควรโฟกัสอะไร ร่างกายพร้อมแค่ไหน และควรแต่งตัวอย่างไร</p></div><div className={styles.live}><span/> Daily brief · Tokyo</div></header>
    {error&&<div className={styles.notice}>ข้อมูลบางห้องยังโหลดไม่สำเร็จ — ส่วนที่พร้อมใช้งานยังแสดงตามปกติ</div>}
    <section className={styles.hero}>
      <div className={styles.outfitImage}>{hero?.look?<img src={hero.look.image} alt={`ลุคแนะนำ ${hero.look.style}`}/>:<div className={styles.noLook}><span className="material-symbols-outlined">checkroom</span><strong>ยังไม่มีลุคใน Closet</strong><Link href="/health/closet">สร้างลุคแรก →</Link></div>}<span className={styles.todayBadge}>TODAY&apos;S LOOK</span></div>
      <div className={styles.heroCopy}><p className={styles.kicker}>DAILY STYLE · FROM YOUR CLOSET</p><h2>{hero?.look?hero.look.style:"เพิ่มเสื้อผ้าเพื่อรับคำแนะนำ"}</h2>{hero?.day&&<><div className={styles.weatherLine}><span className="material-symbols-outlined">{weatherIcon(hero.day.code)}</span><strong>{Math.round(hero.day.max)}°</strong><span>{weatherLabel(hero.day.code)} · ฝน {hero.day.rain}%</span></div><p className={styles.reason}>{outfitReason(hero.day)}</p></>}<div className={styles.heroActions}><Link href="/health/closet" className={styles.primary}>เปิด Closet</Link><Link href="/daily" className={styles.secondary}>วางแผนวันนี้</Link></div></div>
      <div className={styles.readiness}><p>READINESS</p><div className={styles.score}>{loading?"…":readiness}<small>/100</small></div><div className={styles.meter}><span style={{width:`${readiness}%`}}/></div><p>{readiness>=80?"พร้อมลุยเต็มที่":readiness>=60?"รักษาจังหวะให้สมดุล":"วันนี้ควรเบาแรงและพักเพิ่ม"}</p></div>
    </section>

    <section className={styles.metrics}>
      <Metric icon="bedtime" label="Sleep" value={latest?.sleep_hours?`${latest.sleep_hours.toFixed(1)}h`:"—"} note={`score ${latest?.sleep_score??"—"}`}/>
      <Metric icon="steps" label="Steps" value={latest?.steps?.toLocaleString()||"—"} note="goal 10,000"/>
      <Metric icon="favorite" label="Resting HR" value={latest?.resting_heart_rate?`${latest.resting_heart_rate}`:"—"} note="bpm"/>
      <Metric icon="task_alt" label="Routine" value={`${done}/${actions.length}`} note="actions complete"/>
      <Metric icon="checkroom" label="Closet" value={`${data.closet.length}`} note="saved looks"/>
    </section>

    <div className={styles.sectionHead}><div><p>NEXT 3 DAYS</p><h2>แต่งตัวตามวันและอากาศ</h2></div><Link href="/health/closet">จัดการ Closet →</Link></div>
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
