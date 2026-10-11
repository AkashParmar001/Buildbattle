import { NextResponse } from "next/server";
import { connection } from "next/server";
import { existsSync } from "node:fs";
import path from "node:path";

// Honest demo re-check: reports whether the deployed bundle's pipeline
// artifacts exist. Raw pipeline sources (raw.csv, unique.csv, adapted.csv,
// adaption_evaluation.json) live in repo-root data/ and are not deployed with
// Vercel builds (root = web/), so they are listed as repo-only. A full re-run
// needs API keys and runs offline via pipeline/*.py.
export async function POST() {
  await connection();
  const bundleFiles = ["analysis.json", "showcase.json"];
  const repoOnly = [
    "data/raw.csv",
    "data/unique.csv",
    "data/adapted.csv",
    "data/adaption_evaluation.json",
  ];
  const steps = bundleFiles.map((name) => {
    const full = path.join(process.cwd(), "data", name);
    return { file: `data/${name}`, present: existsSync(full) };
  });
  const ok = steps.every((s) => s.present);
  return NextResponse.json({
    mode: "demo-check",
    ok,
    steps,
    repoOnly,
    note: ok
      ? "Bundled artifacts present. Full sources live in repo-root data/; a full re-run (Adaption + LLM analysis) needs API keys and runs offline: python pipeline/02_adaption.py --go, then 03_analyze.py."
      : "Some bundled artifacts are missing. Regenerate via pipeline/04_showcase.py and redeploy.",
  });
}
