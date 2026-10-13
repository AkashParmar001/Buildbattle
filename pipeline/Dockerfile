# InsightFlow data pipeline — one-shot jobs (dedupe, Adaption, analysis).
# Build from the repo root:  docker build -f pipeline/Dockerfile -t insightflow-pipeline .
# Run via compose:            docker compose --profile pipeline run --rm pipeline python pipeline/03_seed_local.py
# API keys come from the root .env (mounted via env_file, never baked in).

FROM python:3.12-slim
WORKDIR /work

COPY pipeline/requirements.txt ./pipeline/requirements.txt
RUN pip install --no-cache-dir -r pipeline/requirements.txt

COPY pipeline ./pipeline
COPY data ./data

# data/ is also mounted at runtime so outputs land back on the host.
VOLUME /work/data

CMD ["python", "pipeline/03_seed_local.py"]
