# AGENTS.md — InsightFlow (Frontend Arena Build Battle 2026)

48h solo hackathon. Judges score working features, polished UI, and a meaningful,
explainable Adaption integration. Keep demo-safe: app must run from seed data with all APIs down.

## Repo state (non-obvious)

- No app code scaffolded yet. Only `files/` exists at root: `AGENTS.md` (product rules),
  `OPENCODE_GUIDE.md` (staged build plan), `insightflow-pipeline.zip` (canonical starter:
  `pipeline/*.py`, `db/schema.sql`, `data/raw.csv`, `.env.example`, `README.md`).
- Unzip the bundle before pipeline work; do not treat `files/` as the app root.
- Layout once built: `web/` (Next.js), `pipeline/`, `db/schema.sql`, `data/analysis.json`
  (+ `web/data/analysis.json` copy, committed so Vercel builds with root = `web/` still work).
  `pipeline/03_seed_local.py` generates `data/analysis.json` with no API keys
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

## Web app (planned stack — see `files/AGENTS.md` + `files/OPENCODE_GUIDE.md`)

- Next.js App Router + TypeScript + Tailwind + shadcn/ui + Recharts + lucide-react in `web/`; deploy on Vercel with root = `web/`.
- Supabase Postgres schema: `feedback`, `clusters`, `issues`, `reports` (`db/schema.sql`). Server-side access only via `web/lib/db.ts`; analytics helpers in `web/lib/analytics.ts` (`getKpis`, `getSentimentDistribution`, `getTopIssues`, `getTrend`, filters `{category, sentiment, cluster}`).
- If Supabase env vars are missing, fall back to reading `data/analysis.json` — never ship it to the client; memoise aggregations.
- Routes: `/` dashboard · `/feedback` · `/insights` · `/recommendations` · `/issues` · `/pipeline` (Adaption showcase: raw→dedupe→adapt+evaluate→sentiment→clusters→priority, with 5 raw-vs-adapted examples + quality score) · `/report/[token]`.
- Every recommendation cites numbers (volume, share, negativity, growth) + example reviews. Responsive from 375px; loading skeletons + empty/error states; no lorem ipsum; small components; no new deps without justification.

## Verify + commit

- After each task in `web/`: `npm run lint` then `npm run build`; fix errors before reporting done. Analytics sanity: `/api/analytics` total rows must equal 7000.
- One git commit per completed task, clear message. Check `.env*` never committed. Branch `master` is currently empty (unborn) — first commit creates it.

## Adaption and AutoScientist (honest scope)
- Adaption is used in the data stage: the deduped dataset is refined through Adaptive Data
  (raw -> v1 -> v2). `data/adaption_eval.json` holds a measured comparison (same classifier
  trained on raw vs refined data, tested on held-out raw texts). Show the numbers as measured,
  even if gains are small. Never invent or round up results.
- AutoScientist (fine-tuning) was NOT run: dataset is below the minimum and the credit budget
  is 8. It appears only as a labelled roadmap ("planned, not run") plus an exportable
  fine-tuning-ready JSONL (`data/autoscientist_sft.jsonl`).
- Never claim a trained model exists.
