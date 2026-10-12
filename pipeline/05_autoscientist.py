"""Step 5: fetch the completed AutoScientist run from the Adaption platform.

Usage: python pipeline/05_autoscientist.py                -> latest run
       python pipeline/05_autoscientist.py --run ID       -> specific run
       python pipeline/05_autoscientist.py --download     -> also pull the
                                                             trained artifact
                                                             (large, gitignored)

Writes data/autoscientist_run.json (+ web/data/ copy for Vercel builds).
Every field is copied verbatim from the platform — win rate, iterations and
timestamps are reported as returned, never rounded or embellished.

API shapes verified against adaption==0.14.0 (local introspection):
autoscientist.list -> [AutoscientistRun]; autoscientist.get(run_id) ->
{ id, dataset_id, model, status, created_at, completed_at,
  iterations_completed, max_iterations, target_win_rate, best_win_rate,
  training_method, best_hyperparams{...}, column_mapping{...},
  download_available, error }.
"""
import argparse
import json
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()
client = Adaption(api_key=os.environ["ADAPTION_API_KEY"])

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument("--run", help="AutoScientist run id (default: latest run)")
ap.add_argument(
    "--download",
    action="store_true",
    help="also download the trained artifact to data/ (gitignored)",
)
args = ap.parse_args()

if args.run:
    run = client.autoscientist.get(args.run)
else:
    runs = list(client.autoscientist.list())
    if not runs:
        raise SystemExit("No AutoScientist runs found on this account.")
    run = client.autoscientist.get(runs[0].id)

record = run.model_dump(mode="json")

# Wall-clock duration as measured between the run's own timestamps.
if record.get("created_at") and record.get("completed_at"):
    created = datetime.fromisoformat(record["created_at"].replace("Z", "+00:00"))
    completed = datetime.fromisoformat(
        record["completed_at"].replace("Z", "+00:00")
    )
    record["duration_seconds"] = int((completed - created).total_seconds())

record["fetched_at"] = datetime.now(timezone.utc).isoformat()

for dest in ("data/autoscientist_run.json", "web/data/autoscientist_run.json"):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as fh:
        json.dump(record, fh, indent=2)

print(
    f"run={record['id']} status={record['status']} model={record['model']} "
    f"iters={record['iterations_completed']}/{record['max_iterations']} "
    f"best_win_rate={record.get('best_win_rate')} "
    f"target={record.get('target_win_rate')} "
    f"duration={record.get('duration_seconds')}s "
    f"artifact={'available' if record.get('download_available') else 'no'}"
)

if args.download:
    if not record.get("download_available"):
        raise SystemExit("Artifact not available for this run.")
    resp = client.autoscientist.download(record["id"])
    blob = resp.read() if hasattr(resp, "read") else bytes(resp)
    dest = "data/autoscientist_artifact.bin"
    with open(dest, "wb") as fh:
        fh.write(blob)
    print(f"artifact -> {dest} ({len(blob)} bytes, gitignored)")
