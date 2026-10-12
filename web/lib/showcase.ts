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

export type AutoScientistRun = {
  id: string;
  dataset_id: string;
  model: string;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  created_at: string;
  completed_at: string | null;
  iterations_completed: number;
  max_iterations: number;
  target_win_rate: number;
  best_win_rate: number | null;
  training_method: "instruction" | "alignment";
  best_hyperparams: {
    training_type?: string | null;
    n_epochs?: number | null;
    learning_rate?: number | null;
    batch_size?: string | number | null;
    lora_r?: number | null;
    lora_alpha?: number | null;
    lora_dropout?: number | null;
    lora_trainable_modules?: string | null;
    lr_scheduler_type?: string | null;
    warmup_ratio?: number | null;
    weight_decay?: number | null;
    [key: string]: unknown;
  } | null;
  column_mapping: {
    prompt?: string | null;
    completion?: string | null;
    chosen?: string | null;
    rejected?: string | null;
    [key: string]: unknown;
  } | null;
  download_available: boolean;
  error: string | null;
  duration_seconds?: number;
  fetched_at?: string;
};

let autoScientistPromise: Promise<AutoScientistRun | null> | undefined;

// AutoScientist run fetched from the platform by pipeline/05_autoscientist.py.
// Null when the artifact is absent (run never fetched).
export function loadAutoScientistRun(): Promise<AutoScientistRun | null> {
  autoScientistPromise ??= readFile(
    path.join(process.cwd(), "data", "autoscientist_run.json"),
    "utf8",
  ).then(
    (raw) => JSON.parse(raw) as AutoScientistRun,
    () => null,
  );
  return autoScientistPromise;
}
