# InsightFlow — customer feedback intelligence

Turns 7,000 raw customer feedback rows into an analytics dashboard, prioritized
recommendations with evidence, issue tracking, and shareable executive reports.
Built for the Frontend Arena Build Battle 2026 (48h solo hackathon).

Live demo runs entirely from committed seed data (`web/data/analysis.json`) —
the app works with every external API down.

## Features

- **Landing** (`/`) — hero galaxy (canvas particles drift into the real
  top-cluster labels) + scroll story through the pipeline numbers
  (7,000 → 320 → Adaption E→C → clusters → decisions); static SVG under
  `prefers-reduced-motion`
- **Command Center** (`/app`) — one filterable surface:
  - **Decision brief** — "Fix this first" with score breakdown, why, evidence
  - **KPI row** — total / unique / negativity / top priority (count-up)
  - **Issue map** — d3-force bubbles (size = volume, color = dominant
    sentiment, pulse = priority ≥ 70); click opens the **cluster drawer**
    (sentiment mix, ScoreBreakdown, evidence, Track, impact estimator)
  - **Priority queue** — ranked, explainable, reorder-animates on filter change
  - **Trends** — sentiment donut + simulated-vs-live 12-week chart
  - Top bar: Feedback drawer (`?overlay=feedback`, search/sort/paginate +
    add/CSV/sample loaders), Issues board (`?overlay=issues`), Under the
    hood (`?overlay=hood`), theme toggle, data-source pill
- **Under the hood** (`/app?overlay=hood`) — the Adaption showcase: summary
  strip, 7-step pipeline trail, settings, 5 raw-vs-improved examples,
  measured eval table, grade E→C card, AutoScientist roadmap (planned, not run)
- **Reports** (`/report/[token]`) — print-friendly forced-light snapshot of
  KPIs + top 5 recommendations (PDF via print stylesheet)

Old single-purpose routes (`/feedback`, `/insights`, `/recommendations`,
`/pipeline`, `/issues`) 307-redirect to `/app`.

## Architecture

```
data/raw.csv (7,000 rows)
  │  pipeline/01_dedupe.py
  ▼
data/unique.csv (320 unique texts + count)
  │  pipeline/02_adaption.py [--go]          Adaption: improved responses
  ▼                                            + quality evaluation
data/adapted.csv + data/adaption_evaluation.json
  │  pipeline/03_seed_local.py  (no keys)  or  03_analyze.py (LLM keys)
  ▼
data/analysis.json  ──copy──▶  web/data/analysis.json   (committed: Vercel root = web/)
  │
  ▼
Next.js (web/) ── Supabase (if env set) ── else seed JSON (server-side only)
```

## How Adaption is used

The 320 deduped reviews were sent with `column_mapping={"prompt": "review"}`
and `brand_controls={"hallucination_mitigation": True}`. The run returned
**376 rows**: an improved support response per review (`chosen`), a weaker
alternative (`rejected`, i.e. training-ready preference pairs), plus English
language expansion for 56 rows. Quality evaluation on a 100-row sample:
**grade E → C, score 2.0 → 6.1 (+205%)** — see `/app?overlay=hood` and
`data/adaption_evaluation.json`.

Honest note: this run produced improved *responses*, not rewritten reviews,
so downstream sentiment/clustering deliberately runs on the original review
text (`adapted.csv` keeps `adapted_text == review`); swapping replies in as
feedback would corrupt the analysis.

## How to run

Pipeline (from repo root):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r pipeline/requirements.txt
Copy-Item .env.example .env   # fill keys, never commit
python pipeline/01_dedupe.py
python pipeline/02_adaption.py        # upload + cost ESTIMATE only
python pipeline/02_adaption.py --go   # real run (costs money)
# save output as data/adapted.csv (id, review, adapted_text, count, category)
python pipeline/03_seed_local.py      # no keys needed (heuristic labels)
# ...or, with ANTHROPIC_API_KEY: python pipeline/03_analyze.py  (real LLM run)
python pipeline/04_showcase.py        # refresh web/data/showcase.json
Copy-Item data/analysis.json web/data/analysis.json
```

Web app (Vercel root = `web/`, or locally):

```powershell
cd web
npm install
npm run dev     # lint + build must pass before every commit
npm run lint; npm run build
npm run seed    # needs web/.env.local with Supabase keys; loads analysis.json
```

Supabase wiring (once):

1. Create a project, then run `db/schema.sql` in the SQL editor (creates
   `feedback`, `clusters`, `issues`, `reports`; RLS is intentionally disabled —
   this is an unauthenticated demo, see limitations).
2. Put the project URL + key in `web/.env.local`:
   `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` (preferred) or
   `SUPABASE_ANON_KEY` (works while RLS is off). Never commit this file.
3. `npm run seed` loads `data/analysis.json` into the tables (idempotent).
4. Without any Supabase env vars the app falls back to seed JSON + gitignored
   `web/data/user-*.json` overlays — the footer shows which source is live.

## Environment variables

| File | Key | Needed for |
| ---- | --- | ---------- |
| `.env` (root) | `ADAPTION_API_KEY` | `02_adaption.py --go` |
| `.env` (root) | `ANTHROPIC_API_KEY`, `LLM_MODEL` | `03_analyze.py` real LLM run |
| `web/.env.local` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` | live DB + `npm run seed` |
| `web/.env.local` | `ANTHROPIC_API_KEY` | LLM classification for new submissions (server-side only; heuristic fallback when absent) |

Without Supabase keys the app serves seed data; user-submitted feedback,
issues and reports then persist to gitignored local JSON overlays
(`web/data/user-*.json`). `.env*` files are never committed.

## Known limitations

- **No authentication.** All APIs (submit, import, issues, reports) are open;
  there are no user accounts, and RLS is disabled on the demo tables so the
  anon key can write. Do not put real customer data in this deployment.
- **Rate limiting is per-instance**: 20 submissions/minute per IP, held in
  memory — it resets on redeploy and is not shared across serverless instances.
- The 12-week timeline is **simulated** (source feedback has no dates) —
  every chart using it carries a "Simulated demo timeline" badge. The trend
  chart splits this into the simulated seed series and a live series bucketed
  by real `created_at` (user submissions/imports, last 12 weeks).
- Seed cluster labels/summaries are deterministic templates from real numbers,
  not LLM prose — replaced by the real `03_analyze.py` run once an Anthropic
  key is available.
- Priority formula: `100 × min(1, 0.4·share/maxShare + 0.35·negativity +
  0.25·min(growth/maxGrowth,1))`, ×1.25 when fraud-dominated (so boosted
  scores can exceed 100 — displayed as computed, never rounded up).
- CSV imports are capped at 2,000 rows per batch; server reads are capped at
  10,000 rows (PostgREST defaults to 1,000 otherwise).
