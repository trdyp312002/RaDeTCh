"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, WalletCards, X } from "lucide-react"
import WealthNavbar from "@/components/WealthNavbar"
import styles from "./cash-flow.module.css"

type Kind = "income" | "expense"
type CashTransaction = { id: string; type: Kind; amount: number; category: string; account: string; date: string; note: string | null; currency: string; settlement_amount: number | null; settlement_currency: string | null }
type FormState = { type: Kind; amount: string; category: string; account: string; date: string; note: string; currency: string; settlementCurrency: string }

const expenseCategories = ["อาหาร", "เดินทาง", "ช้อปปิ้ง", "ที่อยู่อาศัย", "บิล", "สุขภาพ", "ครอบครัว", "การศึกษา", "ท่องเที่ยว", "อื่น ๆ"]
const incomeCategories = ["เงินเดือน", "โบนัส", "ลงทุน", "งานเสริม", "ของขวัญ", "คืนเงิน", "อื่น ๆ"]
const accounts = ["เงินสด", "บัญชีธนาคาร", "บัตรเครดิต", "E-Wallet"]
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })
const currentMonth = () => today().slice(0, 7)
const blankForm = (type: Kind = "expense"): FormState => ({ type, amount: "", category: type === "expense" ? "อาหาร" : "เงินเดือน", account: "เงินสด", date: today(), note: "", currency: "THB", settlementCurrency: "THB" })

function money(value: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(value)
}
function currencySymbol(currency: string) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
    .formatToParts(0)
    .find(part => part.type === "currency")?.value || currency
}
function toTHB(amount: number, currency: string, rates: Record<string, number>) {
  const normalizedCurrency = currency.toUpperCase()
  if (normalizedCurrency === "THB") return amount
  const sourceRate = rates[normalizedCurrency]
  return sourceRate ? (amount / sourceRate) * rates.THB : amount
}
function monthLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`))
}
function shiftMonth(value: string, delta: number) {
  const date = new Date(`${value}-01T12:00:00`); date.setMonth(date.getMonth() + delta); return date.toISOString().slice(0, 7)
}

export default function CashFlowPage() {
  const [items, setItems] = useState<CashTransaction[]>([])
  const [month, setMonth] = useState(currentMonth)
  const [filter, setFilter] = useState<"all" | Kind>("all")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(blankForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [fxRates, setFxRates] = useState<Record<string, number>>({ THB: 35.5, JPY: 150, USD: 1 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/cash-transactions?month=${month}`, { cache: "no-store" })
      if (!response.ok) throw new Error("โหลดรายการไม่สำเร็จ")
      setItems(await response.json())
    } catch (e) { setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด") }
    finally { setLoading(false) }
  }, [month])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    void fetch("/api/fx", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.rates) setFxRates(rates => ({ ...rates, ...data.rates, USD: 1 })) })
      .catch(() => undefined)
  }, [])

  const totals = useMemo(() => items.reduce((sum, item) => {
    sum[item.type] += toTHB(Number(item.amount), item.currency, fxRates); return sum
  }, { income: 0, expense: 0 }), [items, fxRates])
  const visible = useMemo(() => items.filter(item => {
    const matchesType = filter === "all" || item.type === filter
    const text = `${item.category} ${item.account} ${item.note || ""}`.toLowerCase()
    return matchesType && text.includes(query.toLowerCase())
  }), [items, filter, query])

  function openCreate(type: Kind = "expense") { setEditing(null); setForm(blankForm(type)); setError(""); setOpen(true) }
  function openEdit(item: CashTransaction) {
    setEditing(item.id); setForm({ type: item.type, amount: String(item.amount), category: item.category, account: item.account, date: item.date, note: item.note || "", currency: item.currency, settlementCurrency: item.settlement_currency || item.currency }); setError(""); setOpen(true)
  }
  function selectType(type: Kind) { setForm(value => ({ ...value, type, category: type === "expense" ? "อาหาร" : "เงินเดือน" })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("")
    try {
      const response = await fetch(editing ? `/api/cash-transactions/${editing}` : "/api/cash-transactions", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount), settlementAmount: form.settlementCurrency === "THB" ? toTHB(Number(form.amount), form.currency, fxRates) : Number(form.amount) }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ")
      setOpen(false); await load()
    } catch (e) { setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด") }
    finally { setSaving(false) }
  }
  async function remove(id: string) {
    if (!window.confirm("ลบรายการนี้ใช่ไหม?")) return
    const response = await fetch(`/api/cash-transactions/${id}`, { method: "DELETE" })
    if (response.ok) setItems(value => value.filter(item => item.id !== id))
  }

  return <main className={styles.page}>
    <WealthNavbar />
    <div className={styles.shell}>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>WEALTH OS · PERSONAL MONEY</p><h1>รายรับ–รายจ่าย</h1><p>บันทึกทุกการเคลื่อนไหวของเงิน ให้เห็นภาพรวมในที่เดียว</p></div>
        <button className={styles.desktopAdd} onClick={() => openCreate()}><Plus size={18}/> เพิ่มรายการ</button>
      </header>

      <section className={styles.monthBar}>
        <button aria-label="เดือนก่อน" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft/></button>
        <div><CalendarDays size={18}/><strong>{monthLabel(month)}</strong></div>
        <button aria-label="เดือนถัดไป" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight/></button>
      </section>

      <section className={styles.summary}>
        <article className={styles.incomeCard}><span><ArrowDownLeft size={18}/> รายรับ (บาท)</span><strong>{money(totals.income)}</strong></article>
        <article className={styles.expenseCard}><span><ArrowUpRight size={18}/> รายจ่าย (บาท)</span><strong>{money(totals.expense)}</strong></article>
        <article className={styles.balanceCard}><span><WalletCards size={18}/> คงเหลือสุทธิ (บาท)</span><strong>{money(totals.income - totals.expense)}</strong></article>
      </section>

      <section className={styles.listCard}>
        <div className={styles.tools}>
          <div className={styles.filters}>{(["all", "expense", "income"] as const).map(value => <button key={value} className={filter === value ? styles.activeFilter : ""} onClick={() => setFilter(value)}>{value === "all" ? "ทั้งหมด" : value === "expense" ? "รายจ่าย" : "รายรับ"}</button>)}</div>
          <label className={styles.search}><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหารายการ"/></label>
        </div>
        {loading ? <div className={styles.empty}>กำลังโหลด...</div> : visible.length === 0 ? <div className={styles.empty}><WalletCards size={34}/><strong>ยังไม่มีรายการในเดือนนี้</strong><span>แตะปุ่ม + เพื่อเริ่มบันทึก</span></div> : <div className={styles.transactions}>{visible.map(item => <article className={styles.transaction} key={item.id}>
          <div className={`${styles.icon} ${item.type === "income" ? styles.iconIncome : styles.iconExpense}`}>{item.type === "income" ? <ArrowDownLeft/> : <ArrowUpRight/>}</div>
          <div className={styles.txInfo}><strong>{item.category}</strong><span>{item.note || item.account}</span><small>{new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit" }).format(new Date(`${item.date}T12:00:00`))} · {item.account}</small></div>
          <div className={styles.txAmount}><strong className={item.type === "income" ? styles.positive : styles.negative}>{item.type === "income" ? "+" : "−"}{money(Number(item.amount), item.currency)}</strong><div><button aria-label="แก้ไข" onClick={() => openEdit(item)}><Pencil size={15}/></button><button aria-label="ลบ" onClick={() => void remove(item.id)}><Trash2 size={15}/></button></div></div>
        </article>)}</div>}
      </section>
    </div>

    <button className={styles.mobileFab} onClick={() => openCreate()} aria-label="เพิ่มรายการ"><Plus/></button>
    {open && <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}><form className={styles.sheet} onSubmit={submit}>
      <div className={styles.sheetHead}><div><span>{editing ? "แก้ไขรายการ" : "รายการใหม่"}</span><strong>{form.type === "expense" ? "บันทึกรายจ่าย" : "บันทึกรายรับ"}</strong></div><button type="button" onClick={() => setOpen(false)}><X/></button></div>
      <div className={styles.typeToggle}><button type="button" className={form.type === "expense" ? styles.expenseActive : ""} onClick={() => selectType("expense")}>รายจ่าย</button><button type="button" className={form.type === "income" ? styles.incomeActive : ""} onClick={() => selectType("income")}>รายรับ</button></div>
      <label className={styles.amount}><span>จำนวนเงิน ({form.currency})</span><div><b>{currencySymbol(form.currency)}</b><input autoFocus inputMode="decimal" type="number" min="0.01" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0"/></div></label>
      <div className={styles.formGrid}>
        <label><span>หมวดหมู่</span><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{(form.type === "expense" ? expenseCategories : incomeCategories).map(x => <option key={x}>{x}</option>)}</select></label>
        <label><span>บัญชี</span><select value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}>{accounts.map(x => <option key={x}>{x}</option>)}</select></label>
        <label><span>วันที่</span><input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></label>
        <label><span>สกุลเงินรายการ</span><select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}><option>THB</option><option>JPY</option><option>USD</option></select></label><label><span>สกุลเงินที่ถูกหักจากบัญชี</span><select value={form.settlementCurrency} onChange={e => setForm({ ...form, settlementCurrency: e.target.value })}><option>THB</option><option>JPY</option><option>USD</option></select></label>
      </div>
      <label className={styles.note}><span>โน้ต (ไม่จำเป็น)</span><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="เช่น ข้าวกลางวันกับเพื่อน"/></label>
      {error && <p className={styles.error}>{error}</p>}
      <button className={`${styles.save} ${form.type === "expense" ? styles.saveExpense : styles.saveIncome}`} disabled={saving}>{saving ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "บันทึกรายการ"}</button>
    </form></div>}
  </main>
}
