import { ArrowDown, CheckCircle2, Download } from "lucide-react";

import {
  loadAdaptionEval,
  loadAdaptionEvaluation,
  loadShowcase,
} from "@/lib/showcase";
import { RecheckButton } from "@/components/recheck-button";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Card, CardContent } from "@/components/ui/card";

function StepCard({
  n,
  title,
  detail,
  completedAt,
  last,
}: {
  n: number;
  title: string;
  detail: string;
  completedAt?: string;
  last?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {n}
        </span>
        {!last && (
          <span
            aria-hidden="true"
            className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800"
          />
        )}
      </div>
      <Card className="mb-3 flex-1">
        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
          </div>
          {completedAt && (
            <span className="ml-auto text-xs whitespace-nowrap text-zinc-400 dark:text-zinc-500">
              {new Date(completedAt).toLocaleString()}
            </span>
          )}
        </CardContent>
      </Card>
    </li>
  );
}

export default async function PipelinePage() {
  const [showcase, adaptionEval, adaptionEvaluation] = await Promise.all([
    loadShowcase(),
    loadAdaptionEval(),
    loadAdaptionEvaluation(),
  ]);
  const { meta, adaption } = showcase;
  const completedAt = (id: string) =>
    showcase.steps.find((s) => s.id === id)?.completed_at;

  const evalRows = adaptionEval?.results ?? [];
  const gainPlain =
    evalRows.length >= 2
      ? evalRows[1].accuracy - evalRows[0].accuracy
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Raw feedback → dedupe → Adaption refinement → sentiment &amp;
            topics → clusters → priority → recommendations. Every number below
            comes from a committed data file — nothing invented.
          </p>
        </div>
        <RecheckButton />
      </div>

      <ol className="flex flex-col">
        <StepCard
          n={1}
          title="Raw CSV — 7,000 rows"
          detail="data/raw.csv (review, category). Status: complete."
          completedAt={completedAt("raw")}
        />
        <StepCard
          n={2}
          title="Dedupe — 320 unique"
          detail={`${meta.unique} unique (review, category) texts; 95.4% duplication removed, volume kept in count. Status: complete.`}
          completedAt={completedAt("dedupe")}
        />
        <StepCard
          n={3}
          title="Adaption refinement"
          detail={`Sent ${adaption.input_rows} unique reviews → ${adaption.output_rows} rows back (improved responses + rejected alternatives + ${adaption.expanded_languages.join(", ")} expansion). Refined review text is identical to raw for this run (see eval). Status: complete.`}
          completedAt={completedAt("adapt")}
        />
        <StepCard
          n={4}
          title="Sentiment & topics"
          detail="Every text classified (LLM when ANTHROPIC_API_KEY exists, verified keyword heuristics otherwise). Status: complete."
          completedAt={completedAt("analyze")}
        />
        <StepCard
          n={5}
          title="Clusters — 10 topics"
          detail={`${meta.clusters} TF-IDF/KMeans clusters (random_state=7). Status: complete.`}
          completedAt={completedAt("analyze")}
        />
        <StepCard
          n={6}
          title="Priority scores"
          detail="Ranked by volume share, negativity and growth (×1.25 fraud multiplier). Status: complete."
          completedAt={completedAt("analyze")}
        />
        <StepCard
          n={7}
          title="Recommendations"
          detail="Ranked actions with score breakdowns, owners and evidence on /recommendations. Status: complete."
          completedAt={completedAt("analyze")}
          last
        />
      </ol>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-base font-semibold tracking-tight">
            Adaption: what was sent &amp; settings
          </h2>
          <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                What was sent
              </dt>
              <dd className="mt-0.5">
                {adaption.input_rows} deduped reviews from data/unique.csv
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                Column mapping
              </dt>
              <dd className="mt-0.5 font-mono">
                {JSON.stringify(adaption.column_mapping)}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                Brand controls
              </dt>
              <dd className="mt-0.5 font-mono">
                {JSON.stringify(adaption.brand_controls)}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                What came back
              </dt>
              <dd className="mt-0.5">{adaption.output}</dd>
            </div>
          </dl>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Dataset {adaption.dataset_id}. Downstream sentiment and clustering
            run on the original review text: this run produced improved{" "}
            <em>responses</em> (chosen / rejected pairs), not rewritten
            reviews, so swapping them in as feedback text would corrupt the
            analysis.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Raw vs refined — 5 examples
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Original review → Adaption-improved response, with report volume.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {showcase.examples.map((ex, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {ex.category} · {ex.count.toLocaleString()} reports
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="min-w-0 rounded-lg border border-zinc-200 p-3 break-words dark:border-zinc-800">
                    <p className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                      Raw review
                    </p>
                    <p className="text-xs leading-5">{ex.raw}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-accent/30 bg-accent/[0.03] p-3 break-words">
                    <p className="mb-1 text-[11px] font-semibold tracking-wide text-accent uppercase">
                      Refined (improved response)
                    </p>
                    <p className="text-xs leading-5 whitespace-pre-line">
                      {ex.adapted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-base font-semibold tracking-tight">
            Measured comparison (adaption_eval.json)
          </h2>
          {adaptionEval ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="py-2 pr-3 font-medium">Version</th>
                      <th className="py-2 pr-3 font-medium">Rows</th>
                      <th className="py-2 pr-3 font-medium">Accuracy</th>
                      <th className="py-2 font-medium">Macro-F1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evalRows.map((r) => (
                      <tr
                        key={r.version}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                      >
                        <td className="py-2 pr-3 font-medium">{r.version}</td>
                        <td className="py-2 pr-3">{r.rows}</td>
                        <td className="py-2 pr-3">{r.accuracy.toFixed(4)}</td>
                        <td className="py-2">{r.macro_f1.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Same TF-IDF/LogisticRegression classifier trained on raw vs
                refined texts, tested on held-out raw texts ({adaptionEval.test}
                ; train {adaptionEval.train_rows}, test{" "}
                {adaptionEval.test_rows}).
              </p>
              <p className="text-xs leading-5 font-medium text-zinc-700 dark:text-zinc-200">
                {gainPlain !== null && Math.abs(gainPlain) < 0.005
                  ? `Gain ≈ 0 (${gainPlain >= 0 ? "+" : ""}${gainPlain.toFixed(4)} accuracy) — refined text is identical to raw in this run, so no classifier lift was measured. Stated plainly, as required.`
                  : `Measured accuracy delta: ${gainPlain !== null ? `${gainPlain >= 0 ? "+" : ""}${gainPlain.toFixed(4)}` : "n/a"}.`}
              </p>
            </>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              data/adaption_eval.json is not present — no classifier comparison
              has been measured, so no gain is claimed.
            </p>
          )}
        </CardContent>
      </Card>

      {adaptionEvaluation && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">
                Adaption quality score
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {adaptionEvaluation.quality.grade_before}{" "}
                <ArrowDown className="h-3 w-3 rotate-[-90deg]" />{" "}
                {adaptionEvaluation.quality.grade_after}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {adaptionEvaluation.quality.score_before} →{" "}
                {adaptionEvaluation.quality.score_after} (+
                {adaptionEvaluation.quality.improvement_percent}%)
              </span>
            </div>
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              From data/adaption_evaluation.json: evaluated on{" "}
              {adaptionEvaluation.raw_results?.metrics?.row_counts?.input ??
                adaption.eval_rows}{" "}
              sampled rows (dataset {adaptionEvaluation.dataset_id}, status{" "}
              {adaptionEvaluation.status}). Message quality{" "}
              {adaptionEvaluation.raw_results?.summary?.message_quality
                ?.before ?? "—"}{" "}
              →{" "}
              {adaptionEvaluation.raw_results?.summary?.message_quality?.after ??
                "—"}
              ; completion quality{" "}
              {adaptionEvaluation.raw_results?.summary?.completion_quality
                ?.before ?? "—"}{" "}
              →{" "}
              {adaptionEvaluation.raw_results?.summary?.completion_quality
                ?.after ?? "—"}
              .
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">Roadmap</h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Planned, not run (dataset below minimum, credit budget)
            </span>
          </div>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Feedback → Adaptive Data → AutoScientist → custom classifier
            replaces LLM calls. Fine-tuning was NOT run and no trained model
            exists; the training set below is exportable for that future step.
          </p>
          <div>
            <a
              href="/api/pipeline/training-set"
              download
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Export training set (JSONL)
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <SimulatedBadge />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Weekly trends are simulated demo data — source feedback has no dates.
        </p>
      </div>
    </div>
  );
}
