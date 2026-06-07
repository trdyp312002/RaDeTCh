const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/claw-empire/claw-empire.sqlite');
db.exec("PRAGMA writable_schema = 1;");

const oldStr = "('openai','anthropic','google','ollama','openrouter','together','groq','cerebras','custom')";
const newStr = "('openai','anthropic','google','ollama','openrouter','together','groq','cerebras','custom','antigravity','gemini','minimax')";

const oldCliStr = "('claude','codex','gemini','opencode','kimi','copilot','antigravity','api')";
const newCliStr = "('claude','codex','gemini','opencode','kimi','copilot','antigravity','minimax','api')";

db.exec(`UPDATE sqlite_master SET sql = replace(sql, "${oldStr}", "${newStr}") WHERE type = 'table'`);
db.exec(`UPDATE sqlite_master SET sql = replace(sql, "${oldCliStr}", "${newCliStr}") WHERE type = 'table'`);

db.exec("PRAGMA writable_schema = 0;");
console.log("Updated schema in sqlite_master");
