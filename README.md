# InsightFlow — customer feedback intelligence

Turns 7,000 raw customer feedback rows into an analytics dashboard, prioritized
recommendations with evidence, issue tracking, and shareable executive reports.
Built for the Frontend Arena Build Battle 2026 (48h solo hackathon).

Live demo runs entirely from committed seed data (`web/data/analysis.json`) —
the app works with every external API down.

## Features

- **Dashboard** (`/`) — KPI cards, sentiment donut, top-issues chart, 12-week
  trend, all filterable by category/sentiment via URL params
- **Feedback** (`/feedback`) — searchable, sortable, paginated table; add
  modal with LLM-or-heuristic classification; drag-drop CSV import with column
  mapping, preview and dedupe; sample-data loader
- **Insights** (`/insights`) — 10 topic-cluster cards (sentiment bar,
  sparkline, example reviews, filtered-feedback links)
- **Recommendations** (`/recommendations`) — priority-ranked actions with
  visible score breakdowns, owners, evidence and one-click issue tracking
- **Issues** (`/issues`) — Open / In progress / Resolved board with notes
- **Pipeline** (`/pipeline`) — the Adaption showcase: raw → dedupe → adapt +
  evaluate → sentiment → clusters → priority, with quality score and 5
  raw-vs-improved examples
- **Reports** (`/report/[token]`) — snapshot KPIs + top 5 recommendations into
  a shareable print-friendly page (PDF via print stylesheet)

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
**grade E → C, score 2.0 → 6.1 (+205%)** — see `/pipeline` and
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

## Environment variables

| File | Key | Needed for |
| ---- | --- | ---------- |
| `.env` (root) | `ADAPTION_API_KEY` | `02_adaption.py --go` |
| `.env` (root) | `ANTHROPIC_API_KEY`, `LLM_MODEL` | `03_analyze.py` real LLM run |
| `web/.env.local` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | live DB + `npm run seed` |

Without Supabase keys the app serves seed data; user-submitted feedback,
issues and reports then persist to gitignored local JSON overlays
(`web/data/user-*.json`). `.env*` files are never committed.

## Known limitations

- The 12-week timeline is **simulated** (source feedback has no dates) —
  every chart using it carries a "Simulated demo timeline" badge. Only
  user-submitted/imported feedback uses real timestamps.
- Seed cluster labels/summaries are deterministic templates from real numbers,
  not LLM prose — replaced by the real `03_analyze.py` run once an Anthropic
  key is available.
- Priority formula: `100 × min(1, 0.4·share/maxShare + 0.35·negativity +
  0.25·min(growth/maxGrowth,1))`, ×1.25 when fraud-dominated.
