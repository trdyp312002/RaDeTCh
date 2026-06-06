const { createClient } = require("@libsql/client");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "portfolio.db");
const db = createClient({
  url: `file:${dbPath}`
});

async function run() {
    const res = await db.execute("SELECT id, symbol, portfolio FROM holdings");
    console.log(res.rows);
}
run();
