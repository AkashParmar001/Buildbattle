"""Step 1: collapse 7,000 rows into unique texts with volume counts."""
import pandas as pd, hashlib

df = pd.read_csv("data/raw.csv")
df["review"] = df["review"].str.strip()
g = (df.groupby(["review", "category"]).size().reset_index(name="count")
       .sort_values("count", ascending=False).reset_index(drop=True))
g["id"] = [hashlib.md5(t.encode()).hexdigest()[:10] for t in g["review"]]
g[["id", "review", "category", "count"]].to_csv("data/unique.csv", index=False)
print(f"raw rows: {len(df)} | unique (text,category): {len(g)} | "
      f"duplicate rate: {1 - len(g)/len(df):.1%}")
print("texts appearing under >1 category:",
      int(df.groupby("review")["category"].nunique().gt(1).sum()))
