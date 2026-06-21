import { createClient, type Client } from "@libsql/client"
import path from "path"
import fs from "fs"

const DB_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DB_DIR, "portfolio.db")

// Lazy singleton — client is created on first use, not at import/build time
let _db: Client | null = null

function getDb(): Client {
  if (_db) return _db

  // Ensure local data dir exists (no-op on Railway)
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }

  const dbUrl = process.env.TURSO_DATABASE_URL || `file:${DB_PATH}`
  const authToken = process.env.TURSO_AUTH_TOKEN

  _db = createClient({ url: dbUrl, authToken })
  return _db
}

// Proxy that forwards every property access to the lazy client (bind methods to preserve `this`)
const db = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getDb()
    const value = (client as any)[prop]
    return typeof value === "function" ? value.bind(client) : value
  },
})

export default db
