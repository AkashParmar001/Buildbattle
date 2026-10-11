import type { ClusterRecord } from "@/lib/db";

// Classifies one feedback item. Prefers the Anthropic LLM server-side when
// ANTHROPIC_API_KEY is set; otherwise (or on any LLM failure) falls back to
// the same keyword heuristics as pipeline/03_seed_local.py. Never throws.

export type Classification = {
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  topic: string;
  cluster: number;
};

const NEG = new Set(
  "scam scammed fraud fraudulent stole stolen charged terrible awful horrible worst disappointed unresponsive unhelpful rude broken failed failure error wrong missing damaged delayed crashing glitch glitches frustrating poor useless inconvenient unresolved incorrect difficult suspect suspicious waste slow complaint".split(
    " ",
  ),
);
const POS = new Set(
  "outstanding excellent great helpful friendly knowledgeable quick resolved satisfied happy love amazing awesome fantastic wonderful wonderfully perfect durable reliable innovative useful recommended recommend value worth exceeds consistent satisfactory compensation fast clear easy smooth timely".split(
    " ",
  ),
);
const NEGATORS = new Set(["no", "not", "never", "without", "lack", "hardly", "barely"]);

function heuristicSentiment(text: string): { sentiment: Classification["sentiment"]; score: number } {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  let pos = 0;
  let neg = 0;
  words.forEach((raw, i) => {
    const w = raw.replace(/'$/, "");
    let polarity = 0;
    if (POS.has(w)) polarity = 1;
    else if (NEG.has(w)) polarity = -1;
    if (polarity !== 0) {
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const prev = words[j].replace(/'$/, "");
        if (NEGATORS.has(prev) || words[j].endsWith("n't")) {
          polarity *= -1;
          break;
        }
      }
    }
    if (polarity === 1) pos++;
    else if (polarity === -1) neg++;
  });
  if (pos === neg) return { sentiment: "neutral", score: 0 };
  return pos > neg
    ? { sentiment: "positive", score: Math.min(1, (pos - neg) / 3) }
    : { sentiment: "negative", score: Math.max(-1, (pos - neg) / 3) };
}

const TOPIC_RULES: Record<string, [string, string][]> = {
  "Fraud and Scam": [
    ["phishing", "phishing attempt"],
    ["additional payment", "payment scam"],
    ["took my money", "payment scam"],
    ["multiple times", "double charging"],
    ["never received", "missing order"],
    ["never sent", "missing order"],
    ["not as advertised", "misleading listing"],
    ["charged", "billing issue"],
    ["scam", "reported scam"],
    ["fraud", "reported fraud"],
  ],
  "Operational Issues": [
    ["packaging", "damaged packaging"],
    ["damaged", "damaged packaging"],
    ["wrong items", "wrong items"],
    ["incorrectly", "wrong items"],
    ["on time", "on-time delivery"],
    ["perfect condition", "on-time delivery"],
    ["delayed", "late delivery"],
    ["crashing", "website issues"],
    ["glitch", "website issues"],
    ["website", "website issues"],
    ["missing", "missing items"],
  ],
  "Customer Service": [
    ["outstanding", "great support"],
    ["great experience", "great support"],
    ["knowledgeable", "helpful staff"],
    ["friendly", "quick resolution"],
    ["quick resolution", "quick resolution"],
    ["helpful", "helpful staff"],
    ["long time", "slow support"],
    ["wait", "slow support"],
    ["unresponsive", "slow support"],
    ["unhelpful", "unresolved issue"],
    ["not helpful", "unresolved issue"],
    ["unresolved", "unresolved issue"],
  ],
  "Product Feedback": [
    ["must-have", "top rated"],
    ["innovative", "useful features"],
    ["durable", "build quality"],
    ["well-made", "build quality"],
    ["value", "good value"],
    ["worth", "good value"],
    ["exceeds", "exceeds expectations"],
    ["reliable", "reliable performance"],
    ["consistent", "reliable performance"],
    ["did not meet", "product failure"],
    ["stopped working", "product failure"],
  ],
};

const DEFAULT_TOPIC: Record<string, string> = {
  "Fraud and Scam": "fraud report",
  "Operational Issues": "order issue",
  "Customer Service": "support experience",
  "Product Feedback": "product opinion",
};

function heuristicTopic(text: string, category: string, sentiment: string): string {
  const low = text.toLowerCase();
  for (const [phrase, topic] of TOPIC_RULES[category] ?? []) {
    if (low.includes(phrase)) {
      if (category === "Fraud and Scam" && sentiment === "positive") {
        return "clean transaction";
      }
      return topic;
    }
  }
  return DEFAULT_TOPIC[category] ?? "general feedback";
}

function tokenize(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((w) => w.length > 2),
  );
}

// Nearest existing cluster by token overlap with its example reviews.
// Returns -1 when nothing overlaps (unclustered).
export function nearestCluster(text: string, clusters: ClusterRecord[]): number {
  const tokens = tokenize(text);
  let best = -1;
  let bestScore = 0;
  for (const c of clusters) {
    const clusterTokens = new Set<string>();
    for (const ex of c.examples) {
      for (const t of tokenize(ex)) clusterTokens.add(t);
    }
    let overlap = 0;
    for (const t of tokens) if (clusterTokens.has(t)) overlap++;
    const score = overlap / Math.max(1, tokens.size);
    if (score > bestScore) {
      bestScore = score;
      best = c.id;
    }
  }
  return bestScore > 0 ? best : -1;
}

async function llmClassify(
  text: string,
  category: string,
): Promise<Omit<Classification, "cluster"> | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Classify this customer feedback (category: ${category}). Return ONLY JSON: {"sentiment":"positive|neutral|negative","score":-1..1,"topic":"2-3 word topic"}.\n${text}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: { text?: string }[];
    };
    const raw = json.content?.[0]?.text?.replace(/^```(?:json)?|```$/g, "").trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      sentiment: Classification["sentiment"];
      score: number;
      topic: string;
    };
    if (!["positive", "neutral", "negative"].includes(parsed.sentiment)) return null;
    return {
      sentiment: parsed.sentiment,
      score: Math.max(-1, Math.min(1, Number(parsed.score) || 0)),
      topic: String(parsed.topic).slice(0, 60),
    };
  } catch {
    return null;
  }
}

export async function classifyFeedback(
  text: string,
  category: string,
  clusters: ClusterRecord[],
): Promise<Classification> {
  const llm = await llmClassify(text, category);
  const sentiment = llm ?? heuristicSentiment(text);
  return {
    sentiment: sentiment.sentiment,
    score: sentiment.score,
    topic: llm?.topic ?? heuristicTopic(text, category, sentiment.sentiment),
    cluster: nearestCluster(text, clusters),
  };
}
