"""Step 3: sentiment + topics (LLM), clusters (TF-IDF/KMeans), simulated weekly
timeline, priority scores, recommendations -> data/analysis.json
Reads data/adapted.csv if present (cols: id, review, adapted_text, count, category),
else data/unique.csv."""
import os, json, re
import numpy as np, pandas as pd
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import anthropic

load_dotenv()
MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-5-5")
llm = anthropic.Anthropic()
np.random.seed(7)

src = "data/adapted.csv" if os.path.exists("data/adapted.csv") else "data/unique.csv"
df = pd.read_csv(src)
text_col = "adapted_text" if "adapted_text" in df.columns else "review"
df["text"] = df[text_col].fillna(df["review"])
print("source:", src, "| rows:", len(df))

def ask_json(prompt, max_tokens=4000):
    r = llm.messages.create(model=MODEL, max_tokens=max_tokens,
                            messages=[{"role": "user", "content": prompt}])
    t = re.sub(r"^```(?:json)?|```$", "", r.content[0].text.strip(), flags=re.M).strip()
    return json.loads(t)

sent = {}
for i in range(0, len(df), 40):
    chunk = df.iloc[i:i+40]
    items = [{"id": r.id, "text": r.text} for r in chunk.itertuples()]
    out = ask_json(
        "Classify each customer feedback item. Return ONLY a JSON list of "
        '{"id","sentiment":"positive|neutral|negative","score":-1..1,"topic":"2-3 word topic"}.\n'
        + json.dumps(items))
    for o in out: sent[o["id"]] = o
    print(f"sentiment {min(i+40, len(df))}/{len(df)}")
df["sentiment"] = df.id.map(lambda x: sent[x]["sentiment"])
df["score"] = df.id.map(lambda x: sent[x]["score"])
df["topic"] = df.id.map(lambda x: sent[x]["topic"])

K = 10
X = TfidfVectorizer(stop_words="english", ngram_range=(1, 2)).fit_transform(df.text)
df["cluster"] = KMeans(n_clusters=K, n_init=10, random_state=7).fit_predict(X)

WEEKS = 12   # simulated timeline: the UI must label these dates as simulated
def weekly(count, growth):
    w = np.linspace(1, 1 + growth, WEEKS); w /= w.sum()
    return np.random.multinomial(int(count), w).tolist()
cat_growth = {"Fraud and Scam": 1.6, "Operational Issues": 0.8,
              "Customer Service": 0.2, "Product Feedback": -0.3}
df["weekly"] = [weekly(r["count"], cat_growth.get(r["category"], 0)) for _, r in df.iterrows()]

total = df["count"].sum()
clusters = []
for c, g in df.groupby("cluster"):
    vol = g["count"].sum()
    neg = (g["count"] * (g.sentiment == "negative")).sum() / vol
    wk = np.sum(np.array(g.weekly.tolist()), axis=0)
    growth = (wk[-4:].sum() + 1) / (wk[:4].sum() + 1)
    top = g.sort_values("count", ascending=False).head(3)
    clusters.append(dict(id=int(c), volume=int(vol), share=float(vol/total), negativity=float(neg),
        growth=float(growth), weekly=wk.tolist(), categories=g.category.value_counts().to_dict(),
        examples=top.text.tolist(), ids=g.id.tolist()))
mx_v = max(c["share"] for c in clusters); mx_g = max(c["growth"] for c in clusters)
for c in clusters:
    s = 0.4*c["share"]/mx_v + 0.35*c["negativity"] + 0.25*min(c["growth"]/mx_g, 1)
    if max(c["categories"], key=c["categories"].get) == "Fraud and Scam":
        s *= 1.25                                   # severity multiplier
    c["priority"] = round(min(s, 1) * 100, 1)

brief = [{k: c[k] for k in ("id", "volume", "share", "negativity", "growth", "categories", "examples", "priority")}
         for c in clusters]
out = ask_json(
    "You are a customer-experience analyst. For each cluster return ONLY a JSON list of "
    '{"id","label":"3-5 words","summary":"1 sentence","recommendation":"concrete action","owner":"team",'
    '"why":"2 sentences citing the numbers given (volume, share, negativity, growth)"}.\n'
    + json.dumps(brief), max_tokens=6000)
meta = {o["id"]: o for o in out}
for c in clusters: c.update({k: meta[c["id"]][k] for k in ("label", "summary", "recommendation", "owner", "why")})
clusters.sort(key=lambda c: -c["priority"])

json.dump(dict(
    meta=dict(total_rows=int(total), unique=len(df), source=src, weeks=WEEKS, dates_simulated=True),
    feedback=df.drop(columns=["review"]).to_dict("records"),
    clusters=clusters), open("data/analysis.json", "w"), indent=1, default=str)
print("wrote data/analysis.json | top issue:", clusters[0]["label"], clusters[0]["priority"])
