<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Web app (`radetch`) is a Next.js 16 + React 19 personal "Life OS". Standard scripts live in `package.json` (`dev`, `build`, `lint`, `bot`, `dev:all`); the Discord bot lives in `bot/` and is optional.

- Run the web app with `npm run dev` (serves on `0.0.0.0:3000`). This is the core product and also serves the API the bot/scripts call.
- The datastore is libSQL/Turso. With no `TURSO_*` env vars it falls back to a local SQLite file at `data/portfolio.db`; tables auto-create and seed on first API hit, so no DB setup/migration step is needed. `data/portfolio.db` is gitignored.
- Auth gate (`proxy.ts`, not `middleware.ts`) is bypassed when `APP_PASSWORD` is unset/empty — leave it blank for open local dev, or set it and log in at `/login` (API/bot clients pass the plain password via the `x-app-password` header).
- All external integrations are optional and degrade gracefully: Discord (`DISCORD_*`), Gemini (`GOOGLE_AI_API_KEY`), MiniMax (`MINIMAX_API_KEY`), Garmin (`GARMIN_*`), Yahoo Finance + `open.er-api.com` (public, no key). The web app runs fully without any of them.
- `npm run lint` works but currently reports ~118 pre-existing errors in loose root/`scripts/` `.js` utility files (`require()` style imports). Next.js app code under `app/`, `lib/`, `bot/` is clean. Treat the legacy-script errors as pre-existing, not regressions.
- `nixpacks.toml`/`Dockerfile.bots`/`start.sh` reference Python bots (`bot_raphael/`) that do not exist in the repo; they are not runnable. Ignore them for local dev.
