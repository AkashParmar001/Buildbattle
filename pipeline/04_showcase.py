"""Step 4: build web/data/showcase.json for the /pipeline showcase page.

Reads data/adapted_download.csv (raw Adaption output: per-review improved
responses + rejected alternatives + language expansion),
data/adaption_evaluation.json (quality grades/scores),
data/analysis.json (counts), and file mtimes (step completion times).
Re-run whenever the pipeline outputs change. The JSON copy lives under web/
so Vercel builds with root = web/ can serve it.

Note: this Adaption run generated improved *responses* (chosen/rejected
preference pairs) rather than rewritten reviews, so downstream sentiment and
clustering honestly run on the original review text (adapted.csv keeps
adapted_text == review). The showcase compares raw reviews side-by-side with
their improved responses.
"""
import json
import os
from datetime import datetime

import pandas as pd

os.makedirs("web/data", exist_ok=True)

out = pd.read_csv("data/adapted_download.csv")
originals = out[out["target_language"] == "original"]
adapted = pd.read_csv("data/adapted.csv")
evaluation = json.load(open("data/adaption_evaluation.json"))
analysis = json.load(open("data/analysis.json"))

# 5 diverse examples: top-volume original-language row per category, topped
# up with the next highest-volume rows. Adapted side shows the improved
# response Adaption generated (not a rewritten review). Prefer responses that
# read as genuine support replies over meta commentary about the task.
SUPPORT_MARKS = (
    "sorry", "apolog", "help", "resolv", "refund", "assist", "understand",
    "frustrat",
)
originals = originals.copy()
originals["support_reply"] = (
    originals["chosen"].str.lower().apply(
        lambda t: any(m in t for m in SUPPORT_MARKS)
    )
    & (originals["chosen"].str.len() > 100)
)
ranked = originals.sort_values(["support_reply", "count"], ascending=False)
picks = []
seen_cats = set()
seen_ids = set()
for _, row in ranked.iterrows():
    if row["category"] not in seen_cats:
        picks.append(row)
        seen_cats.add(row["category"])
        seen_ids.add(row["id"])
    if len(picks) == 4:
        break
for _, row in ranked.iterrows():
    if len(picks) == 5:
        break
    if row["id"] not in seen_ids:
        picks.append(row)
        seen_ids.add(row["id"])

examples = [
    {
        "category": p["category"],
        "count": int(p["count"]),
        "raw": p["review"],
        "adapted": p["chosen"],
    }
    for p in picks
]

expanded_langs = sorted(
    lang for lang in out["target_language"].unique() if lang != "original"
)

q = evaluation["quality"]
showcase = {
    "meta": {
        "total_rows": int(analysis["meta"]["total_rows"]),
        "unique": int(analysis["meta"]["unique"]),
        "clusters": len(analysis["clusters"]),
        "analysis_source": analysis["meta"]["source"],
    },
    "adaption": {
        "dataset_id": evaluation["dataset_id"],
        "column_mapping": {"prompt": "review"},
        "brand_controls": {"hallucination_mitigation": True},
        "output": "per-review improved responses (chosen) + rejected alternatives + language expansion",
        "input_rows": int(len(originals)),
        "output_rows": int(len(out)),
        "expanded_languages": expanded_langs,
        "grade_before": q["grade_before"],
        "grade_after": q["grade_after"],
        "score_before": q["score_before"],
        "score_after": q["score_after"],
        "improvement_percent": q["improvement_percent"],
        "eval_rows": evaluation["raw_results"]["metrics"]["row_counts"]["input"],
    },
    "examples": examples,
    "steps": [
        {"id": "raw", "file": "data/raw.csv"},
        {"id": "dedupe", "file": "data/unique.csv"},
        {"id": "adapt", "file": "data/adapted.csv"},
        {"id": "evaluate", "file": "data/adaption_evaluation.json"},
        {"id": "analyze", "file": "data/analysis.json"},
    ],
}

for step in showcase["steps"]:
    step["completed_at"] = datetime.fromtimestamp(
        os.path.getmtime(step["file"])
    ).isoformat(timespec="seconds")

json.dump(showcase, open("web/data/showcase.json", "w"), indent=1)
print("wrote web/data/showcase.json with", len(examples), "examples")
