"""Step 3 (local seed): sentiment + topics (deterministic keyword heuristics),
clusters (TF-IDF/KMeans), simulated weekly timeline, priority scores,
recommendations -> data/analysis.json

Same shape and same deterministic choices as 03_analyze.py
(K=10, TF-IDF(1,2)/KMeans random_state=7, np.random.seed(7), 12-week
simulated timeline, identical priority formula) but needs NO API keys:
the two LLM calls are replaced by transparent keyword heuristics.

When ANTHROPIC_API_KEY is available, prefer the real 03_analyze.py run.
Seed labels/summaries are templated from real cluster numbers, not LLM prose.
"""
import json
import os
import re

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

np.random.seed(7)

# ---------------------------------------------------------------- sentiment
NEG = {
    "scam", "scammed", "fraud", "fraudulent", "stole", "stolen", "charged",
    "terrible", "awful", "horrible", "worst", "disappointed", "unresponsive",
    "unhelpful", "rude", "broken", "failed", "failure", "error", "wrong",
    "missing", "damaged", "delayed", "crashing", "glitch", "glitches",
    "frustrating", "poor", "useless", "inconvenient", "unresolved",
    "incorrect", "difficult", "suspect", "suspicious", "waste", "slow",
    "never", "complaint",
}
POS = {
    "outstanding", "excellent", "great", "helpful", "friendly",
    "knowledgeable", "quick", "resolved", "satisfied", "happy", "love",
    "amazing", "awesome", "fantastic", "wonderful", "perfect", "durable",
    "reliable", "innovative", "useful", "recommended", "recommend", "value",
    "worth", "exceeds", "consistent", "satisfactory", "compensation",
    "must-have", "clean",
}
NEGATORS = {"no", "not", "never", "without", "lack", "hardly", "barely"}


def sentiment_of(text: str):
    words = re.findall(r"[a-z']+", text.lower())
    pos = neg = 0
    for i, w in enumerate(words):
        base = w.rstrip("'")
        polarity = 0
        if base in POS or w in POS:
            polarity = 1
        elif base in NEG or w in NEG:
            polarity = -1
        # flip when negated within a 3-word window ("not helpful", "no scam")
        if polarity and any(
            words[j].rstrip("'") in NEGATORS or words[j].endswith("n't")
            for j in range(max(0, i - 3), i)
        ):
            polarity *= -1
        pos += polarity == 1
        neg += polarity == -1
    score = max(-1.0, min(1.0, (pos - neg) / 3))
    if pos == neg:
        return "neutral", 0.0
    return ("positive", score) if pos > neg else ("negative", score)


# -------------------------------------------------------------------- topics
# Ordered (phrase, topic) rules per category; first match wins.
TOPICS = {
    "Fraud and Scam": [
        ("phishing", "phishing attempt"),
        ("additional payment", "payment scam"),
        ("took my money", "payment scam"),
        ("multiple times", "double charging"),
        ("never received", "missing order"),
        ("never sent", "missing order"),
        ("not as advertised", "misleading listing"),
        ("charged", "billing issue"),
        ("scam", "reported scam"),
        ("fraud", "reported fraud"),
    ],
    "Operational Issues": [
        ("packaging", "damaged packaging"),
        ("damaged", "damaged packaging"),
        ("wrong items", "wrong items"),
        ("incorrectly", "wrong items"),
        ("on time", "on-time delivery"),
        ("perfect condition", "on-time delivery"),
        ("excellent condition", "on-time delivery"),
        ("delayed", "late delivery"),
        ("crashing", "website issues"),
        ("glitch", "website issues"),
        ("website", "website issues"),
        ("missing", "missing items"),
    ],
    "Customer Service": [
        ("outstanding", "great support"),
        ("great experience", "great support"),
        ("knowledgeable", "helpful staff"),
        ("friendly", "quick resolution"),
        ("quick resolution", "quick resolution"),
        ("helpful", "helpful staff"),
        ("long time", "slow support"),
        ("wait", "slow support"),
        ("frustrating", "slow support"),
        ("unresponsive", "slow support"),
        ("unhelpful", "unresolved issue"),
        ("not helpful", "unresolved issue"),
        ("unresolved", "unresolved issue"),
    ],
    "Product Feedback": [
        ("must-have", "top rated"),
        ("innovative", "useful features"),
        ("durable", "build quality"),
        ("well-made", "build quality"),
        ("value", "good value"),
        ("worth", "good value"),
        ("exceeds", "exceeds expectations"),
        ("reliable", "reliable performance"),
        ("consistent", "reliable performance"),
        ("did not meet", "product failure"),
        ("stopped working", "product failure"),
    ],
}
DEFAULT_TOPIC = {
    "Fraud and Scam": "fraud report",
    "Operational Issues": "order issue",
    "Customer Service": "support experience",
    "Product Feedback": "product opinion",
}


def topic_of(text: str, category: str, sentiment: str):
    low = text.lower()
    for phrase, topic in TOPICS.get(category, []):
        if phrase in low:
            # negated fraud mentions ("no scam") are clean transactions
            if category == "Fraud and Scam" and sentiment == "positive":
                return "clean transaction"
            return topic
    return DEFAULT_TOPIC.get(category, "general feedback")


# ------------------------------------------------------- cluster playbooks
OWNER = {
    "Fraud and Scam": "Trust & Safety",
    "Operational Issues": "Operations",
    "Customer Service": "Support",
    "Product Feedback": "Product",
}
RECOMMENDATION = {
    "Fraud and Scam": (
        "Tighten seller verification and payment holds on flagged patterns, "
        "and publish a scam-reporting flow with refund SLAs."
    ),
    "Operational Issues": (
        "Audit fulfilment and last-mile handoffs for the affected routes, "
        "and add proactive delay/mis-ship notifications."
    ),
    "Customer Service": (
        "Add staffing and canned-response coverage for the top contact "
        "reasons, and track first-contact resolution weekly."
    ),
    "Product Feedback": (
        "Feed the recurring praise/complaints into the roadmap review and "
        "close the loop with affected customers."
    ),
}


def main():
    src = (
        "data/adapted.csv"
        if os.path.exists("data/adapted.csv")
        else "data/unique.csv"
    )
    df = pd.read_csv(src)
    text_col = "adapted_text" if "adapted_text" in df.columns else "review"
    df["text"] = df[text_col].fillna(df["review"])
    print("source:", src, "| rows:", len(df))

    df[["sentiment", "score"]] = pd.DataFrame(
        [sentiment_of(t) for t in df.text], index=df.index
    )
    df["topic"] = [
        topic_of(t, c, s)
        for t, c, s in zip(df.text, df.category, df.sentiment)
    ]
    print("sentiment mix (by volume):")
    mix = df.assign(w=df["count"]).groupby("sentiment")["w"].sum()
    print(mix.to_string())

    K = 10
    vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    X = vec.fit_transform(df.text)
    df["cluster"] = KMeans(n_clusters=K, n_init=10, random_state=7).fit_predict(X)
    terms = np.array(vec.get_feature_names_out())

    WEEKS = 12  # simulated timeline: the UI must label these dates as simulated
    cat_growth = {
        "Fraud and Scam": 1.6,
        "Operational Issues": 0.8,
        "Customer Service": 0.2,
        "Product Feedback": -0.3,
    }

    def weekly(count, growth):
        w = np.linspace(1, 1 + growth, WEEKS)
        w /= w.sum()
        return np.random.multinomial(int(count), w).tolist()

    df["weekly"] = [
        weekly(r["count"], cat_growth.get(r["category"], 0))
        for _, r in df.iterrows()
    ]

    total = int(df["count"].sum())
    centroids = KMeans(n_clusters=K, n_init=10, random_state=7).fit(X).cluster_centers_
    # Generic corpus words carry no signal as labels ("product", "order", ...).
    GENERIC = {
        "product", "products", "received", "receive", "order", "orders",
        "service", "services", "customer", "customers", "company", "provided",
        "provide", "resolved", "resolve", "resolution", "design", "designed",
        "item", "items", "purchase", "purchased", "transaction", "experience",
        "issue", "issues", "concern", "team", "staff", "support",
    }

    def label_terms(centroid):
        _terms = [t for t in terms[centroid.argsort()[::-1][:10]] if len(t) > 2]
        picked: list[str] = []
        for t in _terms:
            parts = set(t.split())
            if parts <= GENERIC:
                continue
            if any(
                t in p or p in t or parts & set(p.split()) for p in picked
            ):
                continue  # avoid "Resolved Resolved Issue" style repeats
            picked.append(t)
            if len(picked) == 2:
                break
        return picked
    clusters = []
    for c, g in df.groupby("cluster"):
        vol = int(g["count"].sum())
        neg = float((g["count"] * (g.sentiment == "negative")).sum() / vol)
        wk = np.sum(np.array(g.weekly.tolist()), axis=0)
        growth = float((wk[-4:].sum() + 1) / (wk[:4].sum() + 1))
        top = g.sort_values("count", ascending=False).head(3)
        top_terms = label_terms(centroids[int(c)])
        dom_cat = g.category.value_counts().idxmax()
        if not top_terms:
            top_terms = [str(dom_cat).lower()]
        clusters.append(
            dict(
                id=int(c),
                volume=vol,
                share=float(vol / total),
                negativity=neg,
                growth=growth,
                weekly=wk.tolist(),
                categories=g.category.value_counts().to_dict(),
                examples=top.text.tolist(),
                ids=g.id.tolist(),
                top_terms=[str(t) for t in top_terms],
                dominant_category=str(dom_cat),
            )
        )
    mx_v = max(c["share"] for c in clusters)
    mx_g = max(c["growth"] for c in clusters)
    for c in clusters:
        s = (
            0.4 * c["share"] / mx_v
            + 0.35 * c["negativity"]
            + 0.25 * min(c["growth"] / mx_g, 1)
        )
        if c["dominant_category"] == "Fraud and Scam":
            s *= 1.25  # severity multiplier
        c["priority"] = round(min(s, 1) * 100, 1)

    for c in clusters:
        label = " ".join(t.title() for t in c["top_terms"][:2]) or c[
            "dominant_category"
        ]
        c["label"] = label
        c["summary"] = (
            f"Covers {len(c['ids'])} distinct feedback texts "
            f"(~{c['volume']} reports, {c['share']:.1%} of volume) around "
            f"{', '.join(c['top_terms'])}. Dominant category: "
            f"{c['dominant_category']}."
        )
        c["recommendation"] = RECOMMENDATION[c["dominant_category"]]
        c["owner"] = OWNER[c["dominant_category"]]
        c["why"] = (
            f"This cluster represents {c['volume']} reports "
            f"({c['share']:.1%} of all feedback) with "
            f"{c['negativity']:.0%} negative sentiment. Volume is "
            f"{c['growth']:.1f}x between the first and last month of the "
            f"simulated window, giving it a priority score of {c['priority']}."
        )
        del c["top_terms"]
        del c["dominant_category"]
    clusters.sort(key=lambda c: -c["priority"])

    json.dump(
        dict(
            meta=dict(
                total_rows=total,
                unique=len(df),
                source=src,
                weeks=WEEKS,
                dates_simulated=True,
                seed_method="local-heuristic (no LLM keys); prefer 03_analyze.py",
            ),
            feedback=df.drop(columns=["review"]).to_dict("records"),
            clusters=clusters,
        ),
        open("data/analysis.json", "w"),
        indent=1,
        default=str,
    )
    print("wrote data/analysis.json | top issue:", clusters[0]["label"], clusters[0]["priority"])


if __name__ == "__main__":
    main()
