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

export type AdaptionEvalRow = {
  version: string;
  rows: number;
  accuracy: number;
  macro_f1: number;
};

export type AdaptionEval = {
  method: string;
  test: string;
  rows: number;
  train_rows: number;
  test_rows: number;
  results: AdaptionEvalRow[];
};

let adaptionEvalPromise: Promise<AdaptionEval | null> | undefined;

// Measured classifier comparison (same model trained on raw vs refined,
// tested on held-out raw texts). Null when the artifact is absent.
export function loadAdaptionEval(): Promise<AdaptionEval | null> {
  adaptionEvalPromise ??= readFile(
    path.join(process.cwd(), "data", "adaption_eval.json"),
    "utf8",
  ).then(
    (raw) => JSON.parse(raw) as AdaptionEval,
    () => null,
  );
  return adaptionEvalPromise;
}

export type AdaptionEvaluation = {
  dataset_id: string;
  status: string;
  quality: {
    grade_before: string;
    grade_after: string;
    score_before: number;
    score_after: number;
    percentile_after: number;
    improvement_percent: number;
  };
  raw_results?: {
    metrics?: { row_counts?: { input?: number } };
    summary?: {
      message_quality?: { before?: number; after?: number };
      completion_quality?: { before?: number; after?: number };
    };
  };
};

let adaptionEvaluationPromise: Promise<AdaptionEvaluation | null> | undefined;

// Adaption quality evaluation artifact. Null when absent.
export function loadAdaptionEvaluation(): Promise<AdaptionEvaluation | null> {
  adaptionEvaluationPromise ??= readFile(
    path.join(process.cwd(), "data", "adaption_evaluation.json"),
    "utf8",
  ).then(
    (raw) => JSON.parse(raw) as AdaptionEvaluation,
    () => null,
  );
  return adaptionEvaluationPromise;
}
