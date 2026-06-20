import { createClient } from '@libsql/client';
const db = createClient({ url: 'file:C:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/data/portfolio.db' });
async function fix() {
  await db.execute("UPDATE finance_items SET currency = 'THB'");
  const today = new Date().toISOString().slice(0, 10);
  await db.execute({ sql: "DELETE FROM networth_snapshots WHERE date = ?", args: [today] });
  console.log('Fixed DB');
}
fix();
