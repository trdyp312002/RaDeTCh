"use client";
import {useMemo,useState} from 'react';
import {BrainCircuit,ChevronDown,Globe2,Search,Sparkles} from 'lucide-react';
import styles from './stock-discovery.module.css';
type Stock={rank:number;ticker:string;company:string;country:string;sector:string;theme:string;score:number;aiRole:string;summary:string};
const ALL='All';
export default function StockDiscovery({stocks,generatedAt}:{stocks:Stock[];generatedAt:string}){
 const [query,setQuery]=useState(''),[country,setCountry]=useState(ALL),[sector,setSector]=useState(ALL),[theme,setTheme]=useState(ALL),[sort,setSort]=useState('score');
 const countries=useMemo(()=>[ALL,...new Set(stocks.map(s=>s.country))],[stocks]),sectors=useMemo(()=>[ALL,...new Set(stocks.map(s=>s.sector))],[stocks]),themes=useMemo(()=>[ALL,...new Set(stocks.map(s=>s.theme))],[stocks]);
 const filtered=useMemo(()=>{const q=query.toLowerCase();return stocks.filter(s=>(country===ALL||s.country===country)&&(sector===ALL||s.sector===sector)&&(theme===ALL||s.theme===theme)&&(!q||[s.ticker,s.company,s.country,s.sector,s.aiRole].some(v=>v.toLowerCase().includes(q)))).sort((a,b)=>sort==='name'?a.ticker.localeCompare(b.ticker):sort==='country'?a.country.localeCompare(b.country):b.score-a.score)},[stocks,query,country,sector,theme,sort]);
 const reset=()=>{setQuery('');setCountry(ALL);setSector(ALL);setTheme(ALL)};
 return <main className={styles.page}>
  <section className={styles.hero}><div><div className={styles.eyebrow}><Sparkles size={15}/> WEALTH INTELLIGENCE</div><h1>Stock Discovery</h1><p>ค้นหา จัดหมวดหมู่ และจัดอันดับหุ้นจากคลังวิจัย BRAIN ตามโอกาสเติบโตในธีม AI Infrastructure และ Space Economy</p></div><div className={styles.libraryStat}><span>{stocks.length}</span><small>RESEARCHED STOCKS</small><em>อัปเดต {new Date(generatedAt).toLocaleDateString('th-TH')}</em></div></section>
  <section className={styles.leaders}>{stocks.slice(0,3).map((s,i)=><article className={styles.leaderCard} key={s.ticker}><b>#{i+1}</b><div><strong>{s.ticker}</strong><span>{s.company}</span></div><em>{s.score}<small>/100</small></em><p>{s.sector}</p></article>)}</section>
  <section className={styles.filters}><label className={styles.search}><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหา ticker, บริษัท, AI role…"/></label><Filter label="Theme" value={theme} options={themes} onChange={setTheme}/><Filter label="Country" value={country} options={countries} onChange={setCountry}/><Filter label="Sector" value={sector} options={sectors} onChange={setSector}/><Filter label="Sort" value={sort} options={['score','name','country']} onChange={setSort}/></section>
  <div className={styles.resultBar}><span>พบ <b>{filtered.length}</b> จาก {stocks.length} บริษัท</span>{(query||country!==ALL||sector!==ALL||theme!==ALL)&&<button onClick={reset}>ล้างตัวกรอง</button>}</div>
  <section className={styles.grid}>{filtered.map(s=><article className={styles.card} key={s.ticker}><div className={styles.cardTop}><i>#{s.rank}</i><div><strong>{s.ticker}</strong><span>{s.company}</span></div><b>{s.score}</b></div><div className={styles.tags}><span><Globe2 size={12}/>{s.country}</span><span>{s.theme}</span></div><h2>{s.sector}</h2><div className={styles.role}><BrainCircuit size={17}/><p><small>ROLE IN THEME</small>{s.aiRole}</p></div><p className={styles.summary}>{s.summary}</p><footer>Growth research score <span>{s.score>=75?'High conviction':s.score>=60?'Promising':'Watchlist'}</span></footer></article>)}</section>
  {!filtered.length&&<div className={styles.empty}>ไม่พบหุ้น <button onClick={reset}>แสดงทั้งหมด</button></div>}<p className={styles.disclaimer}>คะแนนเป็น Research Score จากบทวิเคราะห์ใน BRAIN เพื่อคัดกรองเบื้องต้น ไม่ใช่คำแนะนำลงทุน</p>
 </main>
}
function Filter({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){return <label className={styles.select}><small>{label}</small><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select><ChevronDown size={14}/></label>}
