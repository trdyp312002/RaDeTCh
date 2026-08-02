"use client";

import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import styles from "./ClosetStudio.module.css";

type Creation = { id: string; image: string; style: string; sourceName?: string; createdAt: string };
const OPTIONS = [
  ["front", "Studio Front", "ยืนตรง เห็นชุดชัด", "accessibility_new", "full-body front-facing pose, clean balanced stance, premium fashion catalog render"],
  ["turn", "Soft Turn", "เอียงตัวเล็กน้อย มีมิติ", "360", "full-body three-quarter pose with a subtle body turn, elegant relaxed stance"],
  ["walk", "Editorial Walk", "ท่าเดินแบบแฟชั่น", "directions_walk", "full-body fashion walking pose, restrained editorial energy, garment remains clearly visible"],
  ["floating", "Invisible Form", "เห็นเฉพาะทรงเสื้อผ้า", "checkroom", "ghost mannequin effect, invisible body volume inside the garment, premium ecommerce 3D render"],
  ["gallery", "Gallery Plinth", "ยืนบนแท่นแบบงานศิลป์", "view_in_ar", "full-body mannequin standing on a minimal gallery plinth, sculptural museum presentation"],
  ["closeup", "Detail Portrait", "ครึ่งตัว เน้นเนื้อผ้า", "portrait", "waist-up 3D mannequin portrait, close fashion crop emphasizing fabric, seams and garment details"],
] as const;
const KEY = "radetch-closet-creations";

export default function ClosetStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [selected, setSelected] = useState(0);
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(true);

  useEffect(() => {
    async function loadArchive() {
      try {
        const saved = localStorage.getItem(KEY);
        const localItems: Creation[] = saved ? JSON.parse(saved) : [];
        let migrated = true;
        for (const item of localItems) {
          const response = await fetch("/api/closet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
          if (!response.ok) migrated = false;
        }
        if (migrated && localItems.length) localStorage.removeItem(KEY);
        const response = await fetch("/api/closet", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "โหลดคลังภาพไม่สำเร็จ");
        setCreations(data.creations || []);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "โหลดคลังภาพไม่สำเร็จ");
      } finally { setArchiveLoading(false); }
    }
    loadArchive();
  }, []);
  useEffect(() => {
    if (!busy) { setElapsed(0); return; }
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);
  useEffect(() => {
    if (!selectedCreation) return;
    const close = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setSelectedCreation(null); };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [selectedCreation]);

  function useFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("รองรับไฟล์ JPG, PNG และ WEBP เท่านั้น");
    if (file.size > 8 * 1024 * 1024) return setError("รูปมีขนาดเกิน 8 MB กรุณาเลือกรูปที่เล็กลง");
    const reader = new FileReader();
    reader.onload = () => { setSource(String(reader.result)); setSourceName(file.name); setResult(null); setError(""); };
    reader.readAsDataURL(file);
  }

  function drop(event: DragEvent<HTMLLabelElement>) { event.preventDefault(); setDragging(false); useFile(event.dataTransfer.files[0]); }
  function keyboard(event: KeyboardEvent<HTMLLabelElement>) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }

  async function generate() {
    if (!source) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/closet/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: source, styleName: OPTIONS[selected][1], stylePrompt: OPTIONS[selected][4], sourceName, note }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "สร้างภาพไม่สำเร็จ");
      const creation: Creation = { id: data.id, image: data.image, style: data.style, sourceName: data.sourceName, createdAt: data.createdAt };
      setResult(data.image);
      setCreations(current => [creation, ...current.filter(item => item.id !== creation.id)]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง"); }
    finally { setBusy(false); }
  }

  const displayed = result || source;
  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>Health OS · 3D Wardrobe</p><h1 className={styles.title}>Closet 3D Studio</h1><p className={styles.subtitle}>อัปโหลดรูปเสื้อผ้า แล้วให้ AI สร้าง mannequin 3D สวมชุดจริงของคุณ — ระบบเลือกหุ่นขาวหรือดำอัตโนมัติเพื่อให้เสื้อผ้าเด่นและเห็นทรงชัด</p></div><div className={styles.privacy}><span className="material-symbols-outlined">contrast</span>Auto contrast mannequin</div></header>
    <section className={styles.studio} aria-label="Closet image studio">
      <div className={styles.previewPane}><label className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} tabIndex={0} onKeyDown={keyboard} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e: ChangeEvent<HTMLInputElement>) => useFile(e.target.files?.[0])}/>
        {displayed ? <><img className={styles.preview} src={displayed} alt={result ? "ภาพ mannequin 3D ที่สร้างแล้ว" : `รูปต้นฉบับ ${sourceName}`}/><span className={styles.change}>เปลี่ยนรูป</span></> : <div className={styles.empty}><span className={styles.uploadIcon}><span className="material-symbols-outlined">add_photo_alternate</span></span><strong>วางรูปเสื้อผ้าของคุณที่นี่</strong><p>ถ่ายให้เห็นทั้งชิ้น ไม่มีของบัง · JPG, PNG, WEBP สูงสุด 8 MB</p></div>}
      </label></div>
      <div className={styles.controls}>
        <div className={styles.step}><span className={styles.number}>1</span><div><h2>เลือกรูปเสื้อผ้า</h2><p>ภาพพื้นหลังเรียบและมีแสงสม่ำเสมอจะให้ผลลัพธ์ดีที่สุด</p></div></div>
        <div className={styles.step}><span className={styles.number}>2</span><div><h2>เลือกท่า 3D</h2><p>เสื้อเข้มใช้หุ่นขาว เสื้อสว่างใช้หุ่นดำ โดย AI เลือกให้เอง</p></div></div>
        <div className={styles.styles}>{OPTIONS.map((option, index) => <button key={option[0]} type="button" className={`${styles.styleButton} ${selected === index ? styles.active : ""}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><span className={`material-symbols-outlined ${styles.styleIcon}`}>{option[3]}</span><strong>{option[1]}</strong><small>{option[2]}</small></button>)}</div>
        <div className={styles.step}><span className={styles.number}>3</span><div><h2>เพิ่มรายละเอียด</h2><p>ไม่จำเป็น · เช่น “ฉากเทาอ่อน” หรือ “เน้นลายปักที่อก”</p></div></div>
        <textarea className={styles.prompt} value={note} maxLength={300} onChange={e => setNote(e.target.value)} placeholder="บอกมุม ฉาก หรือรายละเอียดที่อยากเน้น..." aria-label="รายละเอียดเพิ่มเติมสำหรับภาพ"/>
        <div className={styles.actions}><button className={styles.button} type="button" onClick={generate} disabled={!source || busy}>{busy ? <><span className={styles.spinner}/>กำลังสร้างโมเดล 3D · {elapsed} วินาที</> : <><span className="material-symbols-outlined">view_in_ar</span>สร้าง mannequin แบบ {OPTIONS[selected][1]}</>}</button>{busy && <p className={styles.error} style={{color:"#776f66"}}>ปกติใช้เวลาประมาณ 30–90 วินาที กรุณาเปิดหน้านี้ไว้</p>}{error && <p className={styles.error} role="alert">{error}</p>}{result && <a className={styles.download} href={result} download={`closet-3d-${OPTIONS[selected][0]}.jpg`}>บันทึกภาพ 3D</a>}</div>
      </div>
    </section>
    <section className={styles.gallery}><div className={styles.galleryHeader}><h2>My 3D Wardrobe</h2><span>{creations.length} looks · บันทึกถาวรบน Turso</span></div>{archiveLoading ? <div className={styles.emptyGallery}>กำลังโหลดคลังภาพ...</div> : creations.length ? <div className={styles.grid}>{creations.map(item => <button type="button" className={styles.card} key={item.id} onClick={() => setSelectedCreation(item)} aria-label={`ดูภาพเต็ม ${item.style}`}><img src={item.image} alt={`mannequin 3D แบบ ${item.style}`}/><div className={styles.meta}><span>{item.style}</span><span>{new Date(item.createdAt).toLocaleDateString("th-TH")}</span></div><span className={`material-symbols-outlined ${styles.expand}`}>open_in_full</span></button>)}</div> : <div className={styles.emptyGallery}>ภาพ mannequin 3D ที่สร้างสำเร็จจะถูกบันทึกถาวรและแสดงตรงนี้</div>}</section>
    {selectedCreation && <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`ภาพเต็ม ${selectedCreation.style}`} onMouseDown={event => { if (event.target === event.currentTarget) setSelectedCreation(null); }}>
      <div className={styles.lightboxPanel}>
        <button type="button" className={styles.close} onClick={() => setSelectedCreation(null)} aria-label="ปิดภาพเต็ม"><span className="material-symbols-outlined">close</span></button>
        <div className={styles.fullImage}><img src={selectedCreation.image} alt={`ภาพ mannequin 3D แบบ ${selectedCreation.style}`}/></div>
        <div className={styles.detailBar}><div><p>3D LOOK · SAVED</p><h3>{selectedCreation.style}</h3><span>สร้างเมื่อ {new Date(selectedCreation.createdAt).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}{selectedCreation.sourceName ? ` · จาก ${selectedCreation.sourceName}` : ""}</span></div><a href={selectedCreation.image} download={`closet-3d-${selectedCreation.id}.jpg`} className={styles.detailDownload}><span className="material-symbols-outlined">download</span>ดาวน์โหลดภาพ</a></div>
      </div>
    </div>}
  </main>;
}
