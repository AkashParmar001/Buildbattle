# InsightFlow — from customer feedback to the one decision that matters

Turns 7,000 raw customer reviews into a ranked list of what to fix first —
with the numbers and real customer quotes behind every recommendation.
Built for the Frontend Arena Build Battle 2026 (48h solo hackathon).

- **Live app:** https://buildbattle26.vercel.app/
- **Repo:** https://github.com/AkashParmar001/Buildbattle

The demo runs from committed seed data (`web/data/analysis.json`) and works
with every external API down. With Supabase keys configured it runs live.

## Try it in 60 seconds

1. Open the landing page, then enter the **Command Center** (`/app`).
2. Read the **#1 recommendation** — score breakdown, why-lines, evidence quotes.
3. Open the **Issue map**, click a bubble, then **Track** the issue.
4. Open **How it works** (`?overlay=hood`) for the measured Adaption results.
5. Export the **report** (read-only link, print to PDF).

## Features

- **Landing** (`/`) — Editorial Noir narrative: serif hero with a WebGL
  point-cloud scene (ogl; scattered cloud locks into the real cluster
  constellation on scroll), framed Command Center illustration with live seed
  numbers, theme marquee, scroll-highlighted statement, pinned 5-step pipeline
  story (7,000 → 320 → Adaption E→C → clusters → decisions), feature rows,
  framed live issue map, counters, How it works (measured numbers only).
  Static fallbacks under `prefers-reduced-motion` / touch.
- **Command Center** (`/app`) — one filterable surface:
  - **Decision brief** — "Fix this first" with score breakdown, why, evidence
  - **KPI row** — total / unique / negativity / top priority (count-up)
  - **Issue map** — d3-force bubbles (size = volume, color = dominant
    sentiment, pulse = priority ≥ 70); click opens the **cluster drawer**
    (sentiment mix, ScoreBreakdown, evidence, Track, impact estimator)
  - **Priority queue** — ranked, explainable, reorder-animates on filter change
  - **Trends** — sentiment donut + simulated-vs-live 12-week chart
  - Top bar: Feedback drawer (`?overlay=feedback`, search/sort/paginate +
    add/CSV/sample loaders), Issues board (`?overlay=issues`), How it
    works (`?overlay=hood`), theme toggle, data-source pill
- **How it works** (`/app?overlay=hood`) — plain-language explainer: 7-step
  pipeline trail, 5 raw-vs-improved examples, measured eval table, grade E→C
  card, AutoScientist run results (measured win rate vs target, iterations,
  hyperparameters)
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

Adaption sits in the data stage. The 320 deduped reviews were uploaded with
`column_mapping={"prompt": "review"}` and
`brand_controls={"hallucination_mitigation": True}` (estimate-first, then a
real `--go` run). The platform returned **388 rows**: 320 original-language
rows — each with an improved support response (`chosen`) plus a weaker
alternative (`rejected`, i.e. training-ready preference pairs) — and 68
English language-expansion rows. Quality evaluation on a 100-row sample:
**grade E → C, score 2.0 → 6.1 (+205%)** — see `/app?overlay=hood` and
`data/adaption_evaluation.json`.

Honest notes, verified against the committed artifacts:

- This run produced improved *responses*, not rewritten reviews, so downstream
  sentiment/clustering deliberately runs on the original review text
  (`adapted.csv` keeps `adapted_text == review`); swapping replies in as
  feedback would corrupt the analysis.
- Our own check (`data/adaption_eval.json`): the same TF-IDF/LogisticRegression
  classifier trained on raw vs refined texts, tested only on held-out raw
  reviews (25% stratified split, seed 7) scores **96.25% vs 96.25% — identical,
  as expected** when `adapted_text == review`. Reported plainly; the measured
  win is the platform's E→C quality grade, not classifier lift.
- There was **no second refinement pass** — numbers come verbatim from
  `adaption_evaluation.json` / `adaption_eval.json`, never rounded up.

## How AutoScientist is used

AutoScientist (Adaption's fine-tuning loop) ran on the platform against the
uploaded dataset (`product_service_feedback`, run `f0d99208`, succeeded
2026-10-12, synced by `pipeline/05_autoscientist.py` into
`data/autoscientist_run.json`):

- Model `Qwen/Qwen3.5-0.8B`, supervised (instruction) LoRA
- 3/3 iterations, ~2h 34m, best hyperparameters: LoRA r=32 α=64, lr 1e-4,
  cosine schedule, 5 epochs
- **Best win rate 0.5668 against a 0.70 target — below target**, shown
  exactly as measured (never rounded up)

The trained artifact is downloadable from the Adaption platform
(`download_available: true`); the app reports metadata only.
`data/autoscientist_sft.jsonl` remains the exportable 320-row classification
training set (a training export, not a trained model).

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn-style UI
primitives, Recharts, Framer Motion, GSAP (ScrollTrigger/SplitText), Lenis
smooth scroll, d3-force issue map, ogl WebGL hero; Supabase (Postgres) live
with seed-data fallback; Python pipeline (pandas, scikit-learn TF-IDF +
KMeans K=10); any OpenAI-compatible LLM (`LLM_API_KEY`, `LLM_MODEL`,
`LLM_BASE_URL`) for pipeline
sentiment and live classification with keyword-heuristic fallback — note the
shipped seed labels are heuristic (`local-heuristic, no LLM keys`);
Adaption (Adaptive Data + AutoScientist); Docker (multi-stage web image +
compose) and Vercel deploy. Built with AI-assisted development (opencode),
reviewed by me.

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
# ...or, with LLM_API_KEY: python pipeline/03_analyze.py  (real LLM run)
python pipeline/04_showcase.py        # refresh web/data/showcase.json
python pipeline/05_autoscientist.py   # sync AutoScientist run from platform
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

Run with Docker (no keys needed — serves committed seed data):

```powershell
docker compose up --build web        # app on http://localhost:3000
docker compose --profile pipeline run --rm pipeline python pipeline/03_seed_local.py
```

The `web` container persists user submissions in a `web-data` volume
(`data/user-*.json` overlays). With `web/.env.local` present it uses the live
Supabase DB instead. The `pipeline` profile runs one-shot Python jobs against
the mounted `./data` with keys from the root `.env`.

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
| `.env` (root) | `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` | `03_analyze.py` real LLM run |
| `web/.env.local` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` | live DB + `npm run seed` |
| `web/.env.local` | `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` | LLM classification for new submissions (server-side only; heuristic fallback when absent) |

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
