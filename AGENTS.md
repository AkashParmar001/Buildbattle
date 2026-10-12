# AGENTS.md — InsightFlow (Frontend Arena Build Battle 2026)

48h solo hackathon. Judges score working features, polished UI, and a meaningful,
explainable Adaption integration. Keep demo-safe: app must run from seed data with all APIs down.

## Repo state (non-obvious)

- Built: `web/` (Next.js 16 App Router, "Signal" restructure complete), `pipeline/`, `db/schema.sql`,
  `data/analysis.json` (+ `web/data/analysis.json` copy, committed so Vercel builds with root = `web/` still work).
- Pipeline bundle at `files/` is the historical starter; run pipeline scripts from repo root.
- `pipeline/03_seed_local.py` generates `data/analysis.json` with no API keys
  (heuristic sentiment/labels, same KMeans/weekly/priority as `03_analyze.py`); prefer the
  real `03_analyze.py` run once `ANTHROPIC_API_KEY` exists.

## Pipeline (executable truth: `README.md` + `pipeline/*.py`)

```powershell
cd insightflow
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r pipeline/requirements.txt
Copy-Item .env.example .env  # then fill keys
python pipeline/01_dedupe.py          # 7000 rows -> data/unique.csv (id, review, category, count)
python pipeline/02_adaption.py        # upload + cost ESTIMATE only, spends nothing
python pipeline/02_adaption.py --go   # real Adaption run (costs money)
# save Adaption output manually as data/adapted.csv (cols: id, review, adapted_text, count, category)
python pipeline/03_analyze.py         # -> data/analysis.json (app seed data)
```

- Env keys (`ADAPTION_API_KEY`, `ANTHROPIC_API_KEY`, `LLM_MODEL=claude-sonnet-5-5`); `.env`/`.env.local` are gitignored — never commit, never put keys in client code.
- `02_adaption.py` API shapes verified against `adaption==0.14.0` (see header); supports `--resume`. Real run done: grade E→C (+205%); `data/adapted.csv` + `data/adaption_evaluation.json` committed.
- `03_analyze.py` reads `data/adapted.csv` if present, else `data/unique.csv`; needs `ANTHROPIC_API_KEY`. Fixed choices: K=10 TF-IDF/KMeans clusters, 12-week timeline, `np.random.seed(7)`.
- Dedupe key is `(review, category)` after `strip()` — no text spans >1 category in this dataset.

## Data facts (do not change silently)

- `data/raw.csv`: 7000 rows, columns `review`, `category` only; ~320 unique texts (heavy duplication).
- Categories: `Operational Issues`, `Fraud and Scam`, `Product Feedback`, `Customer Service`.
- No real dates: 12-week timeline is SIMULATED — every chart/table using it needs a visible "Simulated demo timeline" label. Only user-submitted/imported feedback uses real timestamps.
- Volume = `count` (duplicate count). Weight all metrics by `count`, never by row.
- Priority: `100 * min(1, 0.4*share/maxShare + 0.35*negativity + 0.25*min(growth/maxGrowth,1))`, ×1.25 if fraud-dominated.

## Web app (built — "Signal" architecture)

- Next.js App Router + TypeScript + Tailwind + Recharts + lucide-react + framer-motion + d3-force/d3-scale in `web/`; deploy on Vercel with root = `web/`. Dark theme by default (`Providers`: `defaultTheme="dark"`, no system).
- Routes: `/` landing (hero galaxy canvas + ~400vh scroll story, both with reduced-motion fallbacks) · `/app` Command Center (Decision brief → KPIs → Issue map → Priority queue → Trends; category/sentiment URL params refilter everything server-side) · `/report/[token]` (forced-light, print-ready, `instant = false` blocking read). Old routes `/feedback|/insights|/recommendations|/pipeline|/issues` 307-redirect to `/app`.
- Overlays (URL state, no extra routes): `?overlay=feedback` drawer (search/sort/paginate via `GET /api/feedback`) · `?overlay=issues` board · `?overlay=hood` Adaption showcase (raw→dedupe→Adaption→sentiment→clusters→priority, 5 raw-vs-adapted examples, grade E→C, eval table, AutoScientist run results) · `?cluster=ID` cluster drawer (sentiment mix, ScoreBreakdown, evidence, impact estimator) from Issue map bubbles (`layoutId` morph).
- Supabase Postgres schema: `feedback`, `clusters`, `issues`, `reports` (`db/schema.sql`). Server-side access only via `web/lib/db.ts`; analytics helpers in `web/lib/analytics.ts` (`getKpis`, `getInsightClusters`, `getRecommendations`, filters `{category, sentiment, cluster}`; unfiltered path returns seed aggregates unchanged — verify `/api/analytics` totals stay 7000 + overlay rows).
- If Supabase env vars are missing, fall back to reading `data/analysis.json` — never ship it to the client; memoise aggregations. `feedback:changed` pub-sub (`web/lib/feedback-refresh.ts`) keeps drawer/panel fresh after submits.
- Every recommendation cites numbers (volume, share, negativity, growth) + example reviews. Responsive from 375px; loading skeletons + empty/error states; no lorem ipsum; small components; no new deps without justification.
- Cluster labels/recommendations/why-lines + clamped priorities are regenerated offline by `cd web && npm run regenerate` (`web/scripts/regenerate-insights.ts`) — never hand-edit `analysis.json` text fields; never generate them on page load. After regenerating, re-run `npm run seed` when Supabase is live.

## Verify + commit

- After each task in `web/`: `npm run lint` then `npm run build`; fix errors before reporting done. Analytics sanity: `/api/analytics` unfiltered volume = 7000 (+ any local user-overlay rows).
- One git commit per completed task, clear message. Check `.env*` never committed.

## Adaption and AutoScientist (honest scope)
- Adaption is used in the data stage: the deduped dataset is refined through Adaptive Data
  (raw -> v1 -> v2). `data/adaption_eval.json` holds a measured comparison (same classifier
  trained on raw vs refined data, tested on held-out raw texts). Show the numbers as measured,
  even if gains are small. Never invent or round up results.
- AutoScientist (fine-tuning) HAS been run on the Adaption platform (run `f0d99208`, succeeded
  2026-10-12): model `Qwen/Qwen3.5-0.8B`, supervised (instruction) LoRA, 3/3 iterations,
  best win rate 0.5668 vs target 0.70 — BELOW target, always shown exactly as measured.
  Sync results with `python pipeline/05_autoscientist.py` -> `data/autoscientist_run.json`
  (+ `web/data/` copy). The trained artifact stays on the platform (downloadable;
  `--download` pulls it to gitignored `data/`). `data/autoscientist_sft.jsonl` remains the
  exportable 320-row classification training set (a training export, not a model).
- Never invent metrics: AutoScientist numbers come verbatim from `autoscientist_run.json`,
  Adaption numbers from `adaption_evaluation.json` / `adaption_eval.json`.
