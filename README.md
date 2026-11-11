# Mirsad — CV Job Match

Privacy-first career matching app: reads a PDF/DOCX CV in the browser, lets you edit a profile, and searches live remote jobs from Himalayas, plus quick links to Jordan/Gulf job boards.

## Run locally

Requirements: Node.js 20+ and pnpm (`npm i -g pnpm`).

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173

- API server runs on port 8080 (`PORT` to change); the web app proxies `/api` to it (`API_URL` to change).
- No database is needed.

Run them separately if you prefer:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/mirsad run dev
```

## Checks

```bash
pnpm run typecheck
pnpm run build
```
