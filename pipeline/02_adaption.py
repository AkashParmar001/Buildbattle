"""Step 2: run the deduped dataset through Adaption (Adaptive Data).
Usage: python pipeline/02_adaption.py            -> upload + cost estimate only
       python pipeline/02_adaption.py --go       -> real run + download
       python pipeline/02_adaption.py --resume   -> skip to wait + download
                                                  (run already in progress)

API shapes verified against adaption==0.14.0 (local introspection):
upload_file -> {dataset_id, status}; get_status -> {dataset_id, status,
row_count, progress, error_data}; run(estimate=True) -> {run_id,
estimated_minutes, estimated_credits_consumed, ...}; get_evaluation ->
{dataset_id, status, quality{grade_before/after, score_before/after,
percentile_after, improvement_percent}, raw_results};
download(dataset_id, file_format="csv") -> bytes.
"""
import os, sys, time, json
from dotenv import load_dotenv
from adaption import Adaption

load_dotenv()
client = Adaption(api_key=os.environ["ADAPTION_API_KEY"])
STATE = "data/adaption_state.json"

if os.path.exists(STATE):
    dataset_id = json.load(open(STATE))["dataset_id"]
else:
    dataset_id = client.datasets.upload_file("data/unique.csv").dataset_id
    json.dump({"dataset_id": dataset_id}, open(STATE, "w"))
    # Uploaded datasets sit at status "awaiting_input" (not terminal), so wait
    # for row_count instead of completion here.
    while True:
        st = client.datasets.get_status(dataset_id)
        if st.row_count is not None:
            break
        time.sleep(2)
    print("upload processed:", st.status, "| rows:", st.row_count)
print("dataset_id:", dataset_id)

mapping = {"prompt": "review"}
brand = {"hallucination_mitigation": True}

if "--resume" not in sys.argv:
    est = client.datasets.run(dataset_id, column_mapping=mapping,
                              brand_controls=brand, estimate=True)
    print("ESTIMATE:", est)
if "--go" not in sys.argv and "--resume" not in sys.argv:
    sys.exit(0)

if "--resume" not in sys.argv:
    run = client.datasets.run(dataset_id, column_mapping=mapping, brand_controls=brand)
    print("run started:", run.run_id)
else:
    print("resuming: run already in progress, waiting for completion")

st = client.datasets.wait_for_completion(dataset_id)
print("run finished:", st.status, "| rows:", st.row_count)

ev = client.datasets.wait_for_evaluation(dataset_id)
json.dump(json.loads(ev.model_dump_json()), open("data/adaption_evaluation.json", "w"), indent=1)
print("evaluation saved: grade",
      ev.quality.grade_before, "->", ev.quality.grade_after,
      "| score", ev.quality.score_before, "->", ev.quality.score_after)

out = client.datasets.download(dataset_id, file_format="csv")
with open("data/adapted_download.csv", "wb") as f:
    f.write(out.read())
print("download saved to data/adapted_download.csv")
