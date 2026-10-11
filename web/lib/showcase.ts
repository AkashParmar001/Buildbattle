import { readFile } from "node:fs/promises";
import path from "node:path";

export type ShowcaseData = {
  meta: {
    total_rows: number;
    unique: number;
    clusters: number;
    analysis_source: string;
  };
  adaption: {
    dataset_id: string;
    column_mapping: Record<string, string>;
    brand_controls: Record<string, boolean>;
    output: string;
    input_rows: number;
    output_rows: number;
    expanded_languages: string[];
    grade_before: string;
    grade_after: string;
    score_before: number;
    score_after: number;
    improvement_percent: number;
    eval_rows: number;
  };
  examples: {
    category: string;
    count: number;
    raw: string;
    adapted: string;
  }[];
  steps: { id: string; file: string; completed_at: string }[];
};

let showcasePromise: Promise<ShowcaseData> | undefined;

// Committed pipeline output (pipeline/04_showcase.py). Server-side only.
export function loadShowcase(): Promise<ShowcaseData> {
  showcasePromise ??= readFile(
    path.join(process.cwd(), "data", "showcase.json"),
    "utf8",
  ).then((raw) => JSON.parse(raw) as ShowcaseData);
  return showcasePromise;
}
