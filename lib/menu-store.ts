import menuSeed from "@/data/menu.json"
import db from "@/lib/db"

export type MenuItem = Record<string, unknown> & { id: string }

function parseItem(value: unknown): MenuItem {
  return JSON.parse(String(value)) as MenuItem
}

export async function ensureMenuTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const result = await db.execute("SELECT COUNT(*) AS count FROM menu_items")
  if (Number(result.rows[0]?.count ?? 0) > 0) return

  const seedItems = Array.isArray(menuSeed.items) ? menuSeed.items : []
  if (seedItems.length === 0) return

  await db.batch(seedItems.map((item) => ({
    sql: "INSERT OR IGNORE INTO menu_items (id, payload) VALUES (?, ?)",
    args: [String(item.id), JSON.stringify(item)],
  })), "write")
}

export async function listMenuItems() {
  await ensureMenuTable()
  const result = await db.execute("SELECT payload FROM menu_items ORDER BY created_at ASC, id ASC")
  return result.rows.map((row) => parseItem(row.payload))
}

export async function createMenuItem(input: Record<string, unknown>) {
  await ensureMenuTable()
  const item: MenuItem = { ...input, id: crypto.randomUUID() }
  await db.execute({
    sql: "INSERT INTO menu_items (id, payload) VALUES (?, ?)",
    args: [item.id, JSON.stringify(item)],
  })
  return item
}

export async function updateMenuItem(id: string, updates: Record<string, unknown>) {
  await ensureMenuTable()
  const result = await db.execute({ sql: "SELECT payload FROM menu_items WHERE id = ?", args: [id] })
  const current = result.rows[0]
  if (!current) return null

  const item: MenuItem = { ...parseItem(current.payload), ...updates, id }
  await db.execute({
    sql: "UPDATE menu_items SET payload = ?, updated_at = datetime('now') WHERE id = ?",
    args: [JSON.stringify(item), id],
  })
  return item
}

export async function deleteMenuItem(id: string) {
  await ensureMenuTable()
  const result = await db.execute({ sql: "DELETE FROM menu_items WHERE id = ?", args: [id] })
  return Number(result.rowsAffected) > 0
}
