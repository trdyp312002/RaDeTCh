"use client";

import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import styles from "./BookScanStudio.module.css";

type Analysis = { title: string; author: string; description: string; category: string; language: string };
type Props = { onCreated: () => void | Promise<void> };

const STYLES = [
  ["studio", "Studio Book", "เห็นปกและสันชัด", "menu_book", "upright three-quarter product view showing the front cover and spine"],
  ["shelf", "Shelf Spine", "ตั้งบนชั้นหนังสือ", "shelves", "upright on a minimal warm wooden shelf, front cover angled slightly toward camera and spine clearly visible"],
  ["desk", "Reading Desk", "วางบนโต๊ะอ่านหนังสือ", "desk", "resting naturally on a clean warm desk in a restrained reading scene, cover fully visible, no extra books"],
] as const;

export default function BookScanStudio({ onCreated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [selected, setSelected] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!busy) { setElapsed(0); return; }
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  function useFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("รองรับไฟล์ JPG, PNG และ WEBP เท่านั้น");
    if (file.size > 8 * 1024 * 1024) return setError("รูปมีขนาดเกิน 8 MB กรุณาเลือกรูปที่เล็กลง");
    const reader = new FileReader();
    reader.onload = () => {
      setSource(String(reader.result));
      setSourceName(file.name);
      setResult(null);
      setAnalysis(null);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    useFile(event.dataTransfer.files[0]);
  }

  function keyboard(event: KeyboardEvent<HTMLLabelElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  async function scan() {
    if (!source) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/books/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: source, sourceName, stylePrompt: STYLES[selected][4] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "สแกนหนังสือไม่สำเร็จ");
      setResult(data.image);
      setAnalysis(data.analysis);
      await onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  const displayed = result || source;
  return (
    <section className={styles.wrap} aria-label="Book scanner and 3D studio">
      <div className={styles.heading}>
        <div><p>BOOK OS · AI SCANNER</p><h2>Scan a book. Build your 3D library.</h2><span>ถ่ายปกหรือสันหนังสือ ระบบจะอ่านข้อมูล จัดหมวด สร้างภาพ 3D และบันทึกเข้าคลังให้อัตโนมัติ</span></div>
        <div className={styles.badge}><span className="material-symbols-outlined">auto_awesome</span>Auto categorize</div>
      </div>
      <div className={styles.studio}>
        <div className={styles.previewPane}>
          <label className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} tabIndex={0} onKeyDown={keyboard} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => useFile(event.target.files?.[0])} />
            {displayed ? <><img src={displayed} alt={result ? "ภาพหนังสือ 3D ที่สร้างแล้ว" : `รูปต้นฉบับ ${sourceName}`} /><span className={styles.change}>เปลี่ยนรูป</span>{result && <b className={styles.done}>3D · SAVED</b>}</> : <div className={styles.empty}><span className="material-symbols-outlined">document_scanner</span><strong>วางหรือถ่ายรูปหนังสือที่นี่</strong><p>ให้เห็นชื่อบนปกหรือสันชัดเจน · รองรับ JPG, PNG, WEBP สูงสุด 8 MB</p></div>}
          </label>
        </div>
        <div className={styles.controls}>
          <div className={styles.step}><b>1</b><div><h3>เลือกรูปหนังสือ</h3><p>หนึ่งรูปต่อหนึ่งเล่ม แสงสม่ำเสมอและไม่มีมือบังปก</p></div></div>
          <div className={styles.step}><b>2</b><div><h3>เลือกรูปแบบ 3D</h3><p>เลือกวิธีจัดวางภาพที่จะใช้เป็นปกในคลัง</p></div></div>
          <div className={styles.options}>{STYLES.map((option, index) => <button type="button" key={option[0]} className={selected === index ? styles.active : ""} onClick={() => setSelected(index)} aria-pressed={selected === index}><span className="material-symbols-outlined">{option[3]}</span><strong>{option[1]}</strong><small>{option[2]}</small></button>)}</div>
          <div className={styles.step}><b>3</b><div><h3>สแกนและบันทึก</h3><p>AI จะอ่านชื่อ ผู้แต่ง ภาษา หมวด และสร้างวัตถุหนังสือ 3D</p></div></div>
          <button className={styles.scanButton} type="button" disabled={!source || busy} onClick={scan}>{busy ? <><i />กำลังสแกนและสร้าง 3D · {elapsed} วินาที</> : <><span className="material-symbols-outlined">view_in_ar</span>สแกน + สร้างหนังสือ 3D</>}</button>
          {busy && <p className={styles.wait}>ใช้เวลาประมาณ 30–90 วินาที กรุณาเปิดหน้านี้ไว้</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {analysis && <div className={styles.analysis}><p>AI CATALOGED</p><h3>{analysis.title}</h3><span>{analysis.author}</span><div><em>{analysis.category}</em><em>{analysis.language}</em></div><small>{analysis.description}</small></div>}
        </div>
      </div>
    </section>
  );
}
