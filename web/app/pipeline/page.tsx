import { ArrowDown, CheckCircle2 } from "lucide-react";

import { loadShowcase } from "@/lib/showcase";
import { RecheckButton } from "@/components/recheck-button";
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
        {!last && <span aria-hidden="true" className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />}
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
  const showcase = await loadShowcase();
  const { meta, adaption } = showcase;
  const completedAt = (id: string) =>
    showcase.steps.find((s) => s.id === id)?.completed_at;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Raw feedback → dedupe → Adaption (improved responses + quality
            evaluation) → sentiment &amp; topics → clusters → priority →
            recommendations.
          </p>
        </div>
        <RecheckButton />
      </div>

      <ol className="flex flex-col">
        <StepCard
          n={1}
          title="Raw ingest"
          detail={`${meta.total_rows.toLocaleString()} rows (review, category) from data/raw.csv`}
          completedAt={completedAt("raw")}
        />
        <StepCard
          n={2}
          title="Dedupe"
          detail={`${meta.unique} unique texts after grouping by (review, category) — 95.4% duplication removed, volume kept in count`}
          completedAt={completedAt("dedupe")}
        />
        <StepCard
          n={3}
          title="Adaption — adapt"
          detail={`Sent ${adaption.input_rows} unique reviews (prompt: review, hallucination mitigation on) → got back ${adaption.output_rows} rows: improved responses + rejected alternatives + ${adaption.expanded_languages.join(", ")} expansion`}
          completedAt={completedAt("adapt")}
        />
        <StepCard
          n={4}
          title="Adaption — evaluate"
          detail={`Quality grade ${adaption.grade_before} → ${adaption.grade_after} (score ${adaption.score_before} → ${adaption.score_after}, +${adaption.improvement_percent}% on ${adaption.eval_rows} sampled rows)`}
          completedAt={completedAt("evaluate")}
        />
        <StepCard
          n={5}
          title="Sentiment & topics"
          detail="Every text classified (LLM when ANTHROPIC_API_KEY exists, verified keyword heuristics otherwise)"
          completedAt={completedAt("analyze")}
        />
        <StepCard
          n={6}
          title="Clusters → priority → recommendations"
          detail={`${meta.clusters} TF-IDF/KMeans clusters ranked by volume, negativity and growth (×1.25 fraud multiplier)`}
          completedAt={completedAt("analyze")}
          last
        />
      </ol>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              Adaption quality score
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {adaption.grade_before} <ArrowDown className="h-3 w-3 rotate-[-90deg]" /> {adaption.grade_after}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {adaption.score_before} → {adaption.score_after} (+
              {adaption.improvement_percent}%)
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                What was sent
              </dt>
              <dd className="mt-0.5 font-mono">
                {adaption.input_rows} unique reviews · column_mapping:{" "}
                {JSON.stringify(adaption.column_mapping)}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                Settings used
              </dt>
              <dd className="mt-0.5 font-mono">
                brand_controls: {JSON.stringify(adaption.brand_controls)}
              </dd>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                What came back
              </dt>
              <dd className="mt-0.5">{adaption.output}</dd>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                Dataset
              </dt>
              <dd className="mt-0.5 font-mono break-all">
                {adaption.dataset_id}
              </dd>
            </div>
          </dl>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Downstream sentiment and clustering run on the original review
            text: the run produced improved <em>responses</em> (chosen /
            rejected pairs for training), not rewritten reviews, so swapping
            them in as feedback text would corrupt the analysis.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Raw vs improved — 5 examples
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Original customer review → Adaption-improved response, with report
          volume.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {showcase.examples.map((ex, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {ex.category} · {ex.count.toLocaleString()} reports
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                      Raw review
                    </p>
                    <p className="text-xs leading-5">{ex.raw}</p>
                  </div>
                  <div className="rounded-lg border border-accent/30 bg-accent/[0.03] p-3">
                    <p className="mb-1 text-[11px] font-semibold tracking-wide text-accent uppercase">
                      Improved response
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
    </div>
  );
}
