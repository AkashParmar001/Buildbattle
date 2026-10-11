"""Step 2: run the deduped dataset through Adaption (Adaptive Data).
Usage: python pipeline/02_adaption.py            -> upload + cost estimate only
       python pipeline/02_adaption.py --go       -> real run + download

!! upload_file / get_status / run(estimate, column_mapping, brand_controls) follow
!! the public docs examples. The completion-polling, get_evaluation and download
!! calls are marked VERIFY: check them against the Adaptive Data App Walkthrough /
!! API reference and adjust method or field names if they differ.
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
    while True:
        st = client.datasets.get_status(dataset_id)
        if st.row_count is not None:
            break
        time.sleep(2)
print("dataset_id:", dataset_id)

mapping = {"prompt": "review"}
brand = {"hallucination_mitigation": True}

est = client.datasets.run(dataset_id, column_mapping=mapping,
                          brand_controls=brand, estimate=True)
print("ESTIMATE:", est)
if "--go" not in sys.argv:
    sys.exit(0)

run = client.datasets.run(dataset_id, column_mapping=mapping, brand_controls=brand)
print("run started:", run)

while True:                                   # VERIFY status field/values
    st = client.datasets.get_status(dataset_id)
    print("status:", st)
    if str(getattr(st, "status", "")).lower() in {"completed", "succeeded", "done", "ready"}:
        break
    time.sleep(5)

try:                                          # VERIFY method name / return shape
    ev = client.datasets.get_evaluation(dataset_id)
    json.dump(json.loads(ev.model_dump_json()) if hasattr(ev, "model_dump_json") else str(ev),
              open("data/adaption_evaluation.json", "w"), indent=1)
    print("evaluation saved")
except Exception as e:
    print("evaluation fetch failed (fix per docs):", e)

try:                                          # VERIFY: may return URL/bytes/path
    out = client.datasets.download(dataset_id)
    print("download result:", type(out), str(out)[:200])
except Exception as e:
    print("download failed (fix per docs):", e)
