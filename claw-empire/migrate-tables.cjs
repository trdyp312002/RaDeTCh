const { DatabaseSync } = require('node:sqlite');
const dbPath = 'c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/claw-empire/claw-empire.sqlite';
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA foreign_keys=off;");
db.exec("BEGIN TRANSACTION;");

try {
  db.exec("ALTER TABLE api_providers RENAME TO api_providers_old;");
  
  db.exec(`
CREATE TABLE IF NOT EXISTS api_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'openai' CHECK(type IN ('openai','anthropic','google','ollama','openrouter','together','groq','cerebras','custom','antigravity','gemini','minimax')),
  base_url TEXT NOT NULL,
  api_key_enc TEXT,
  preset_key TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  models_cache TEXT,
  models_cached_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()*1000),
  updated_at INTEGER DEFAULT (unixepoch()*1000)
);
  `);
  
  db.exec("INSERT INTO api_providers SELECT * FROM api_providers_old;");
  db.exec("DROP TABLE api_providers_old;");

  db.exec("ALTER TABLE agents RENAME TO agents_old;");
  db.exec(`
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL DEFAULT '',
  name_ja TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL DEFAULT '',
  department_id TEXT REFERENCES departments(id),
  workflow_pack_key TEXT NOT NULL DEFAULT 'development',
  role TEXT NOT NULL CHECK(role IN ('team_leader','senior','junior','intern')),
  acts_as_planning_leader INTEGER NOT NULL DEFAULT 0 CHECK(acts_as_planning_leader IN (0,1)),
  cli_provider TEXT CHECK(cli_provider IN ('claude','codex','gemini','opencode','kimi','copilot','antigravity','minimax','api')),
  oauth_account_id TEXT,
  api_provider_id TEXT,
  api_model TEXT,
  cli_model TEXT,
  cli_reasoning_level TEXT,
  avatar_emoji TEXT NOT NULL DEFAULT '🤖',
  sprite_number INTEGER,
  personality TEXT,
  status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','working','break','offline')),
  current_task_id TEXT,
  stats_tasks_done INTEGER DEFAULT 0,
  stats_xp INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()*1000)
);
  `);
  db.exec("INSERT INTO agents SELECT * FROM agents_old;");
  db.exec("DROP TABLE agents_old;");

  db.exec("ALTER TABLE skill_learning_history RENAME TO skill_learning_history_old;");
  db.exec(`
CREATE TABLE IF NOT EXISTS skill_learning_history (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('claude','codex','gemini','opencode','kimi','copilot','antigravity','minimax','api')),
  repo TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  skill_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed')),
  command TEXT NOT NULL,
  error TEXT,
  run_started_at INTEGER,
  run_completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()*1000),
  updated_at INTEGER DEFAULT (unixepoch()*1000),
  UNIQUE(job_id, provider)
);
  `);
  db.exec("INSERT INTO skill_learning_history SELECT * FROM skill_learning_history_old;");
  db.exec("DROP TABLE skill_learning_history_old;");

  db.exec("COMMIT;");
  console.log("Migration successful");
} catch (e) {
  db.exec("ROLLBACK;");
  console.error("Migration failed:", e.message);
}
