import { createClient } from "@libsql/client"
import path from "path"
import fs from "fs"

const DB_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DB_DIR, "portfolio.db")

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// Turso Cloud Database connection url or fallback to local SQLite file
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${DB_PATH}`
const authToken = process.env.TURSO_AUTH_TOKEN

const db = createClient({
  url: dbUrl,
  authToken: authToken,
})

export default db
