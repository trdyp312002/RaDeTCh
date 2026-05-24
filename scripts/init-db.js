const { createClient } = require("@libsql/client")
const path = require("path")
const fs = require("fs")

// Resolve database path
const DB_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DB_DIR, "portfolio.db")

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const dbUrl = process.env.TURSO_DATABASE_URL || `file:${DB_PATH}`
const authToken = process.env.TURSO_AUTH_TOKEN

console.log(`[*] Connecting to database at: ${dbUrl.startsWith("file:") ? "Local File (" + dbUrl + ")" : "Turso Cloud DB"}`)

const db = createClient({
  url: dbUrl,
  authToken: authToken,
})

async function init() {
  try {
    console.log("[*] Initializing database tables...")

    // 1. Create holdings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS holdings (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'stock',
        portfolio TEXT NOT NULL DEFAULT 'long_term',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(symbol, portfolio)
      )
    `)
    console.log("[+] Verified holdings table.")

    // 2. Create transactions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        holding_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('BUY','SELL')),
        quantity REAL NOT NULL CHECK(quantity > 0),
        price REAL NOT NULL CHECK(price >= 0),
        fees REAL NOT NULL DEFAULT 0 CHECK(fees >= 0),
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE
      )
    `)
    console.log("[+] Verified transactions table.")

    // 3. Create finance_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS finance_items (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL CHECK(category IN ('cash','other_asset','liability')),
        label TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    console.log("[+] Verified finance_items table.")

    // 4. Create monthly_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS monthly_items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('income_fixed', 'income_variable', 'expense_fixed', 'expense_variable')),
        label TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'THB',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    console.log("[+] Verified monthly_items table.")

    console.log("[🎉] Database schema initialization completed successfully!")
  } catch (error) {
    console.error("[🔴] Failed to initialize database:", error)
  }
}

init()
