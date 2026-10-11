/**
 * Loads data/analysis.json into Supabase (feedback + clusters tables).
 *
 *   cd web && npm run seed
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in web/.env.local
 * (see web/.env.example). The service-role key is required because writes
 * bypass RLS. Never commit .env.local and never use these keys client-side.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

function loadAnalysis() {
  const candidates = [
    path.join(process.cwd(), "..", "data", "analysis.json"), // repo root
    path.join(process.cwd(), "data", "analysis.json"), // web copy
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      console.log(`reading ${file}`);
      return JSON.parse(readFileSync(file, "utf8"));
    }
  }
  throw new Error(
    "data/analysis.json not found (looked in ../data and ./data). " +
      "Generate it first: python pipeline/03_seed_local.py",
  );
}

async function main() {
  const url = process.env.SUPABASE_URL;
  // Service-role preferred (bypasses RLS); anon works when RLS is off,
  // mirroring web/lib/db.ts. Never commit these keys.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY in web/.env.local",
    );
  }
  const supabase = createClient(url, key);
  const analysis = loadAnalysis();

  const clusters = analysis.clusters.map(
    (c: Record<string, unknown>) => ({
      id: c.id,
      label: c.label,
      summary: c.summary,
      volume: c.volume,
      share: c.share,
      negativity: c.negativity,
      growth: c.growth,
      priority: c.priority,
      recommendation: c.recommendation,
      owner: c.owner,
      why: c.why,
      weekly: c.weekly,
      examples: c.examples,
    }),
  );
  const { error: clusterError } = await supabase
    .from("clusters")
    .upsert(clusters, { onConflict: "id" });
  if (clusterError) throw new Error(`clusters upsert failed: ${clusterError.message}`);
  console.log(`upserted ${clusters.length} clusters`);

  const feedback = analysis.feedback.map(
    (f: Record<string, unknown>) => ({
      id: f.id,
      text: f.text,
      adapted_text: (f.adapted_text as string | undefined) ?? null,
      category: f.category,
      source: "sample",
      is_simulated_date: true,
      sentiment: f.sentiment,
      sentiment_score: f.score,
      topic: f.topic,
      cluster_id: f.cluster,
      duplicate_count: f.count,
      weekly: f.weekly,
    }),
  );
  const total = feedback.reduce(
    (sum: number, f: { duplicate_count: number }) => sum + f.duplicate_count,
    0,
  );
  // Upsert in chunks to stay under payload limits.
  for (let i = 0; i < feedback.length; i += 200) {
    const { error } = await supabase
      .from("feedback")
      .upsert(feedback.slice(i, i + 200), { onConflict: "id" });
    if (error) throw new Error(`feedback upsert failed: ${error.message}`);
  }
  console.log(`upserted ${feedback.length} feedback rows (volume ${total})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
