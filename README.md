# Mirsad — CV Job Match

Upload a CV (PDF/DOCX) or type your skills. Claude analyzes your profile and returns:

- **Suggested job titles** that fit you, with a fit score and quick links to LinkedIn, Bayt and Indeed
- **Live jobs ranked by match %** (from Himalayas), each with the skills you have and the ones you lack
- **Missing skills** most often requested by those jobs

## Run locally

Requirements: Node.js 20+ and pnpm 10 (`npm install -g pnpm@10.28.0`).

### 1. Add your Claude API key

Get a key from https://console.anthropic.com/settings/keys (usage is billed by Anthropic).

Copy `artifacts/api-server/.env.example` to `artifacts/api-server/.env` and put your key in it:

```
ANTHROPIC_API_KEY=sk-ant-...
```

On Windows PowerShell:

```powershell
Copy-Item artifacts\api-server\.env.example artifacts\api-server\.env
notepad artifacts\api-server\.env
```

`.env` is git-ignored, so your key is never committed.

### 2. Install and start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

- API server: port 8080 (`PORT` to change). The web app proxies `/api` to it (`API_URL` to change).
- Optional: `ANTHROPIC_MODEL` in `.env` to use a different Claude model.
- No database is needed.

## How it works

1. The browser extracts text from the CV (pdf.js / mammoth).
2. `POST /api/match` sends the text and skills to Claude, which returns a structured profile and 3–5 suggested roles.
3. The server searches Himalayas for the top 3 roles (falling back to worldwide jobs if too few are open to the chosen country).
4. Claude scores every job against the profile and lists the missing skills.

The server does not store CVs. The text is sent to Anthropic for analysis.

## Checks

```bash
pnpm run typecheck
pnpm run build
```

API contract lives in `lib/api-spec/openapi.yaml`; regenerate clients with `pnpm --filter @workspace/api-spec run codegen`.
