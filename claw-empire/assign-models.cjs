const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/claw-empire/claw-empire.sqlite');

const GEMINI_ID = "2c570d46-9968-4323-b525-2f3968c1973b";
const BAILIAN_ID = "e4b38829-bf74-4394-9e36-97a81f952321";

const assignments = {
  // Team Leaders
  "Aria": { provider: GEMINI_ID, model: "gemini-3.1-pro-preview" },
  "Pixel": { provider: GEMINI_ID, model: "antigravity-preview-05-2026" },
  "Sage": { provider: BAILIAN_ID, model: "qwen3.5-plus" },
  "Atlas": { provider: GEMINI_ID, model: "deep-research-max-preview-04-2026" },
  "Hawk": { provider: GEMINI_ID, model: "gemini-3.1-pro-preview" },
  "Vault": { provider: BAILIAN_ID, model: "qwen3.5-plus" },
  
  // Seniors
  "Bolt": { provider: BAILIAN_ID, model: "qwen3-coder-next" },
  "Clio": { provider: BAILIAN_ID, model: "MiniMax-M2.5" },
  "Turbo": { provider: BAILIAN_ID, model: "qwen3-coder-plus" },
  "Lint": { provider: GEMINI_ID, model: "gemini-3.1-pro-preview" },
  "Pipe": { provider: BAILIAN_ID, model: "qwen3-coder-plus" },
  
  // Juniors
  "Nova": { provider: GEMINI_ID, model: "gemini-3.5-flash" },
  "Luna": { provider: BAILIAN_ID, model: "kimi-k2.5" },
  "DORO": { provider: BAILIAN_ID, model: "glm-5" }
};

db.exec("BEGIN TRANSACTION;");
try {
  const stmt = db.prepare("UPDATE agents SET cli_provider = 'api', api_provider_id = ?, api_model = ? WHERE name = ?");
  for (const [name, config] of Object.entries(assignments)) {
    stmt.run(config.provider, config.model, name);
  }
  db.exec("COMMIT;");
  console.log("Assignments updated successfully!");
} catch (e) {
  db.exec("ROLLBACK;");
  console.error("Failed to update:", e);
}
