const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/claw-empire/claw-empire.sqlite');
try {
  db.exec("INSERT INTO api_providers (id, name, type, base_url, enabled) VALUES ('test-1', 'test-1', 'antigravity', 'test', 1)");
  console.log('SUCCESS');
  db.exec("DELETE FROM api_providers WHERE id='test-1'");
} catch (e) {
  console.log('ERROR:', e.message);
}
