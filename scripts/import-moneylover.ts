import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()
import fs from "node:fs"
import crypto from "node:crypto"
import path from "node:path"
import db from "../lib/db"

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(field); field = "" }
    else if (char === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = "" }
    else field += char
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row) }
  return rows
}

function isoDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) throw new Error(`Invalid date: ${value}`)
  return `${match[3]}-${match[2]}-${match[1]}`
}

async function main() {
  const input = process.argv[2]
  if (!input) throw new Error("Usage: npx tsx scripts/import-moneylover.ts <csv-path>")
  const buffer = fs.readFileSync(input)
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")
  const parsed = parseCsv(buffer.toString("utf8").replace(/^\uFEFF/, ""))
  const headers = parsed.shift()?.map(value => value.trim()) ?? []
  const required = ["ID", "Note", "Amount", "Category", "Account", "Currency", "Date"]
  for (const name of required) if (!headers.includes(name)) throw new Error(`Missing column: ${name}`)
  const records = parsed.filter(row => row.some(Boolean)).map((row, index) => {
    const value = Object.fromEntries(headers.map((header, column) => [header, row[column] ?? ""]))
    const signedAmount = Number(value.Amount)
    if (!Number.isFinite(signedAmount) || signedAmount === 0) throw new Error(`Invalid amount at CSV row ${index + 2}`)
    return {
      id: `moneylover:${hash.slice(0, 16)}:${value.ID}`,
      type: signedAmount > 0 ? "income" : "expense",
      amount: Math.abs(signedAmount), category: value.Category.trim(), account: value.Account.trim(),
      currency: value.Currency.trim().toUpperCase(), date: isoDate(value.Date.trim()), note: value.Note.trim() || null,
    }
  })
  await db.execute(`CREATE TABLE IF NOT EXISTS cash_transactions (
    id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount REAL NOT NULL CHECK (amount > 0), category TEXT NOT NULL, account TEXT NOT NULL,
    date TEXT NOT NULL, note TEXT, currency TEXT NOT NULL DEFAULT 'THB',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  let imported = 0
  for (let start = 0; start < records.length; start += 100) {
    const batch = records.slice(start, start + 100).map(record => ({
      sql: "INSERT OR IGNORE INTO cash_transactions (id, type, amount, category, account, date, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [record.id, record.type, record.amount, record.category, record.account, record.date, record.note, record.currency],
    }))
    const result = await db.batch(batch, "write")
    imported += result.reduce((sum, entry) => sum + entry.rowsAffected, 0)
  }
  const income = records.filter(row => row.type === "income").reduce((sum, row) => sum + row.amount, 0)
  const expense = records.filter(row => row.type === "expense").reduce((sum, row) => sum + row.amount, 0)
  console.log(JSON.stringify({ source: path.basename(input), hash, rows: records.length, imported, skipped: records.length - imported, income, expense }, null, 2))
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exit(1) })
