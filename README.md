# Mirsad — CV Job Match

Upload a CV (PDF/DOCX) or type your skills. AI (Google Gemini, free, or Claude) analyzes your profile and returns:

- **Suggested job titles** that fit you, with a fit score and quick links to LinkedIn, Bayt and Indeed
- **Live jobs ranked by match %** (from Himalayas), each with the skills you have and the ones you lack
- **Missing skills** most often requested by those jobs

## Run locally

Requirements: Node.js 20+ and pnpm 10 (`npm install -g pnpm@10.28.0`).

### 1. Add an AI API key (free option available)

**Free:** get a Google Gemini key at https://aistudio.google.com/apikey (no billing or card needed).
**Paid alternative:** an Anthropic Claude key from https://console.anthropic.com/settings/keys.

Copy `artifacts/api-server/.env.example` to `artifacts/api-server/.env` and put your key in it:

```
GEMINI_API_KEY=your-key-here
```

On Windows PowerShell:

```powershell
Copy-Item artifacts\api-server\.env.example artifacts\api-server\.env
notepad artifacts\api-server\.env
```

Make sure the file is named `.env`, not `.env.txt`. It is git-ignored, so your key is never committed.

### 2. Install and start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

- API server: port 8080 (`PORT` to change). The web app proxies `/api` to it (`API_URL` to change).
- Optional in `.env`: `GEMINI_MODEL`, `ANTHROPIC_MODEL`, and `AI_PROVIDER=gemini|claude` when both keys are set.
- No database is needed.

## How it works

1. The browser extracts text from the CV (pdf.js / mammoth).
2. `POST /api/match` sends the text and skills to the AI, which returns a structured profile and 3–5 suggested roles.
3. The server searches Himalayas for the top 3 roles (falling back to worldwide jobs if too few are open to the chosen country).
4. The AI scores every job against the profile and lists the missing skills.

The server does not store CVs. The text is sent to the AI provider (Google or Anthropic) for analysis.

## Checks

```bash
pnpm run typecheck
pnpm run build
```

API contract lives in `lib/api-spec/openapi.yaml`; regenerate clients with `pnpm --filter @workspace/api-spec run codegen`.
