# InsightFlow — project rules for the coding agent

Hackathon: Frontend Arena Build Battle 2026 (48h, individual). Goal: win. Judges look for
working features, polished UI, and a *meaningful, explainable* Adaption integration.

## Product
InsightFlow turns raw customer feedback into insights and decisions: import/submit feedback,
AI analysis (sentiment, topics, clusters), analytics dashboard, prioritized recommendations
with evidence, issue tracking, shareable/exportable report.

## Stack
- `web/`: Next.js (App Router, TypeScript), Tailwind, shadcn/ui, Recharts, lucide-react
- DB: Supabase Postgres (schema in `db/schema.sql`); server-side access only via `web/lib/db.ts`
- `pipeline/`: Python scripts (dedupe -> Adaption -> sentiment/clusters/priority) producing `data/analysis.json`
- Deploy: Vercel

## Data facts (do not change silently)
- Source CSV: 7,000 rows, columns `review`, `category` only. 320 unique texts (heavy duplication).
- Categories: Operational Issues, Fraud and Scam, Product Feedback, Customer Service.
- No real dates: the 12-week timeline is SIMULATED. Any chart/table using it must show a
  visible "Simulated demo timeline" label. Real submitted/imported feedback uses real timestamps.
- Volume = `count` (duplicate count). Always weight metrics by `count`, not by row.

## Rules
- Secrets only in env vars (`ADAPTION_API_KEY`, `ANTHROPIC_API_KEY`, Supabase keys). Never in client code, never committed.
- The app must work from `data/analysis.json` seed data even if every external API is down (demo safety).
- Every recommendation must cite numbers (volume, share, negativity, growth) and example reviews.
- Responsive (mobile 375px up), loading skeletons, empty states, error states. No lorem ipsum.
- Keep components small; no new dependencies without saying why.
- After each task: run `npm run lint` and `npm run build` in `web/` and fix errors before reporting done.
- Make one git commit per completed task with a clear message.

## Pages
`/` dashboard · `/feedback` · `/insights` · `/recommendations` · `/issues` · `/pipeline` (Adaption showcase) · `/report/[token]`

## Priority formula
`priority = 100 * min(1, 0.4*share/maxShare + 0.35*negativity + 0.25*min(growth/maxGrowth,1))`, x1.25 if fraud-dominated.
