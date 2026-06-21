import { GarminConnect } from "garmin-connect";
import type { IGarminTokens, IOauth1Token, IOauth2Token } from "garmin-connect/dist/garmin/types";
import fs from "fs";
import path from "path";

const TOKEN_FILE = path.join(process.cwd(), ".garmin-tokens.json");

// In-memory singleton — survives across requests in the same process
let cachedClient: GarminConnect | null = null;
let tokenExpiry: number = 0;

function saveTokens(tokens: IGarminTokens) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ tokens, savedAt: Date.now() }), "utf8");
  } catch {
    // non-fatal — file write may fail on read-only FS
  }
}

function loadTokensFromFile(): IGarminTokens | null {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
    // OAuth2 tokens typically last 1 hour; reload if file is older than 55 min
    const age = Date.now() - (raw.savedAt || 0);
    if (age > 55 * 60 * 1000) return null;
    return raw.tokens as IGarminTokens;
  } catch {
    return null;
  }
}

async function createFreshClient(email: string, password: string): Promise<GarminConnect> {
  const client = new GarminConnect({ username: email, password: password });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Garmin login timed out after 30s")), 30_000)
  );
  await Promise.race([client.login(), timeout]);

  const tokens = client.exportToken();
  saveTokens(tokens);
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  cachedClient = client;
  return client;
}

/**
 * Returns a logged-in GarminConnect client, re-using cached tokens when possible.
 * Falls back to a fresh login if tokens are expired or missing.
 */
export async function getGarminClient(): Promise<GarminConnect> {
  const email = process.env.GARMIN_EMAIL;
  const password = process.env.GARMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing Garmin credentials in environment variables");
  }

  // Re-use in-memory client if still fresh
  if (cachedClient && Date.now() < tokenExpiry) {
    return cachedClient;
  }

  // Try loading saved tokens from disk
  const saved = loadTokensFromFile();
  if (saved) {
    try {
      const client = new GarminConnect({ username: email, password: password });
      client.loadToken(saved.oauth1 as IOauth1Token, saved.oauth2 as IOauth2Token);
      cachedClient = client;
      tokenExpiry = Date.now() + 55 * 60 * 1000;
      return client;
    } catch {
      // token load failed — fall through to fresh login
    }
  }

  return createFreshClient(email, password);
}
