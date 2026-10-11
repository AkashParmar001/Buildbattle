# Building InsightFlow with opencode — step-by-step

## How to work (read once)
- Start `opencode` from the repo root. Run `/init` once, then **replace the generated AGENTS.md with the one in this repo** (opencode reads it every session).
- Pick your strongest model with `/models`.
- **Tab** switches Plan <-> Build agent. For each stage: Plan first (review the approach), then Build.
- Reference files with `@path` (e.g. `@data/analysis.json`, `@AGENTS.md`).
- One stage = one session/prompt. After each: run the app, click through it, `git commit`. If it goes wrong: `/undo`.
- Paste real errors back verbatim. Never accept "done" until `npm run build` passes.
- Hard time budget per stage; if a stage runs over, cut scope, not sleep.

## Stage 0 — Pipeline (you, ~2h) — see README
Run steps 01 -> 02 (--go) -> save `data/adapted.csv` -> 03. Result: `data/analysis.json`.
Without a `data/analysis.json`, tell opencode to build against the schema in AGENTS.md using placeholder data.

## Stage 1 — Scaffold (target: 45 min)
> Read @AGENTS.md. Create the Next.js app in `web/` (TypeScript, App Router, Tailwind, shadcn/ui, Recharts, lucide-react). Set up an app shell: left sidebar (Dashboard, Feedback, Insights, Recommendations, Issues, Pipeline), top bar, light/dark theme, a clean modern SaaS look (neutral palette, one accent colour). Create empty route pages with titles. Acceptance: `npm run build` passes and all routes render in the shell on desktop and mobile.

## Stage 2 — Data layer (60 min)
> Read @AGENTS.md, @db/schema.sql and @data/analysis.json. Create `web/lib/db.ts` using Supabase server-side, plus `web/scripts/seed.ts` that loads analysis.json into the tables. Add `web/lib/analytics.ts` with functions: getKpis, getSentimentDistribution, getTopIssues, getTrend (weekly), all accepting filters {category, sentiment, cluster}. All metrics weighted by `count`. If Supabase env vars are missing, fall back to reading `data/analysis.json` so the app still works. Acceptance: a test route `/api/analytics` returns correct totals (total rows must equal 7000).

## Stage 3 — Dashboard (90 min)
> Build `/` using @web/lib/analytics.ts. KPI cards (total feedback, unique issues, % negative, top priority issue), sentiment donut, top issues bar chart, 12-week trend line with the visible "Simulated demo timeline" badge, and a filter bar (category, sentiment) that updates all charts via URL search params. Add loading skeletons and empty state. Acceptance: changing a filter changes every chart; mobile layout stacks cleanly.

## Stage 4 — Feedback management (90 min)
> Build `/feedback`: paginated, searchable, sortable table (text, category, sentiment, topic, volume) with filters. Add "Add feedback" modal -> `POST /api/feedback` which classifies sentiment/topic with the LLM (server-side, key from env) and assigns the nearest existing cluster; falls back to neutral/unclustered on LLM failure. Add CSV import (drag-drop, preview first 5 rows, column mapping review/category, row limit warning, dedupe by text). Add a "Load sample data" button. Acceptance: submit one review and see it appear and counted on the dashboard.

## Stage 5 — Insights + Recommendations (90 min)
> Build `/insights` (cluster cards: label, summary, size, sentiment bar, mini trend sparkline, 3 example reviews, link to filtered feedback) and `/recommendations` (ranked by priority; each item shows the score breakdown (volume, negativity, growth), the recommendation, owner, the "why this matters" text, evidence reviews, and a "Track issue" button). Acceptance: every number shown matches analysis.json; the score breakdown visibly explains the ranking.

## Stage 6 — Issue tracking (60 min)
> Build `/issues`: Track button creates an issue from a cluster (idempotent). Board with Open / In progress / Resolved columns (drag or status dropdown), editable notes, created date. Persist in DB. Show tracked state on recommendation cards. Acceptance: tracking, status change and notes survive a page refresh.

## Stage 7 — Pipeline showcase (60 min) — your Adaption point-scorer
> Build `/pipeline` visualising the data workflow: Raw CSV (7,000 rows) -> Dedupe (320 unique) -> Adaption (adapt + evaluate) -> Sentiment/Topics -> Clusters -> Priority -> Recommendations. Each step shows status, counts and time. For the Adaption step show: what was sent, Blueprint/brand_controls settings used, raw vs adapted text side-by-side for 5 examples, and the evaluation/quality score from @data/adaption_evaluation.json. Add a "Re-run analysis" button for newly imported feedback (can be demo/mocked if a full run is slow, but label it honestly). Acceptance: a judge can understand how Adaption is used in 20 seconds.

## Stage 8 — Report + sharing (75 min)
> Build report generation: `POST /api/report` snapshots current filters + KPIs + top 5 recommendations + charts' data into `reports` with a random share_token. `/report/[token]` is a clean print-friendly executive report (summary, KPIs, charts, top issues with recommendations, methodology note incl. simulated-timeline disclaimer and Adaption step). Add "Export PDF" (print stylesheet + window.print) and "Copy share link". Acceptance: link opens in an incognito window and prints to a tidy PDF.

## Stage 9 — Polish (3-4 h)
Prompts (one at a time):
> Audit the whole app at 375px, 768px and 1440px and fix layout issues.
> Add consistent loading skeletons, empty states and error toasts everywhere.
> Accessibility pass: contrast, focus rings, aria labels on charts and buttons.
> Add a first-run guided tour or hero strip explaining the 5 steps in 10 seconds.
> Performance: memoise heavy aggregations, avoid shipping analysis.json to the client.

## Stage 10 — Deploy and submission (last 4-5 h)
1. Push to GitHub (check `.env*` is not committed). Import the repo on Vercel, root = `web/`, add env vars, deploy.
2. Run seed against production Supabase. Click through every page on the live URL, on your phone.
3. README: what it does, architecture diagram, how Adaption is used, how to run, env vars, known limitations (simulated timeline).
4. Demo video (2-3 min): problem -> import/sample -> pipeline page (Adaption) -> dashboard filters -> top recommendation and its evidence -> track issue -> export report.
5. Adaption write-up (~150 words): what you sent, settings, what changed, quality score, how the output improved downstream analysis.
6. Submit early; keep the last hour for fixes only.

## If you fall behind (cut in this order)
Dark mode -> drag-and-drop on board -> guided tour -> live re-run button (keep it static) -> PDF styling extras. **Never cut:** Adaption stage, recommendations with evidence, deploy, demo video.
