const { createClient } = require("@libsql/client");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "portfolio.db");
const db = createClient({
  url: `file:${dbPath}`
});

async function run() {
  try {
    const res = await db.execute("SELECT id, symbol FROM holdings WHERE portfolio = 'retirement' AND symbol NOT LIKE '%BTC%'");
    
    if (res.rows.length === 0) {
      console.log("No non-BTC assets found in retirement portfolio.");
      return;
    }

    for (const row of res.rows) {
      console.log(`Deleting ${row.symbol} (id: ${row.id}) and its transactions...`);
      await db.execute({
        sql: "DELETE FROM transactions WHERE holding_id = ?",
        args: [row.id]
      });
      await db.execute({
        sql: "DELETE FROM holdings WHERE id = ?",
        args: [row.id]
      });
    }
    console.log("Cleanup complete!");
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
