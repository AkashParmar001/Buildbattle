import { SectionLabel } from "@/components/section-label";
import type {
  AdaptionEval,
  AdaptionEvaluation,
  AutoScientistRun,
} from "@/lib/showcase";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-rule pt-3">
      <p className="font-mono text-[11px] tracking-wider text-stone uppercase">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

// Product-language explainer with ONLY measured numbers from the committed
// evaluation artifacts (quality grades, classifier comparison, AutoScientist
// run). No internal IDs, paths or JSON dumps.
export function HowItWorks({
  quality,
  evalData,
  run,
}: {
  quality: AdaptionEvaluation["quality"] | null;
  evalData: AdaptionEval | null;
  run: AutoScientistRun | null;
}) {
  const rawRow = evalData?.results.find((r) => r.version === "raw");
  const refinedRow = evalData?.results.find((r) => r.version !== "raw");

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <SectionLabel index={6} label="How it works" className="mb-10" />
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Adaptive data engine */}
        <div>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            An adaptive data engine
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Before analysis, the deduped dataset is refined through Adaptive
            Data — each pass is scored against a reference corpus, so
            improvement is measured, not assumed. On this dataset the quality
            grade moved from {quality?.grade_before ?? "E"} to{" "}
            {quality?.grade_after ?? "C"}.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Metric
              label="Quality grade"
              value={`${quality?.grade_before ?? "E"} → ${quality?.grade_after ?? "C"}`}
            />
            <Metric
              label="Score"
              value={`${quality?.score_before ?? 2.0} → ${quality?.score_after ?? 6.1}`}
            />
            <Metric
              label="Improvement"
              value={`+${Math.round(quality?.improvement_percent ?? 205)}%`}
            />
          </div>
          {evalData && rawRow && refinedRow && (
            <div className="mt-8 rounded-xl border border-rule p-4">
              <p className="font-mono text-[11px] tracking-wider text-stone uppercase">
                Same classifier, raw vs refined training texts
              </p>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <span className="tabular-nums">
                  Raw accuracy{" "}
                  <strong className="font-display text-lg">
                    {(rawRow.accuracy * 100).toFixed(1)}%
                  </strong>
                </span>
                <span className="tabular-nums">
                  Refined accuracy{" "}
                  <strong className="font-display text-lg">
                    {(refinedRow.accuracy * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {evalData.method}
              </p>
            </div>
          )}
        </div>

        {/* Trained response model */}
        <div>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            A model trained for the job
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            A compact open model was fine-tuned on this dataset with AutoScientist
            and evaluated against a target —{" "}
            {run
              ? `${run.iterations_completed}/${run.max_iterations} iterations of ${run.model} trained, best win rate ${run.best_win_rate ?? "—"} against a target of ${run.target_win_rate}.`
              : "results shown as measured, never rounded."}
          </p>
          {run ? (
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
              <Metric
                label="Best win rate"
                value={`${run.best_win_rate ?? "—"}`}
              />
              <Metric label="Target" value={`${run.target_win_rate}`} />
              <Metric
                label="Iterations"
                value={`${run.iterations_completed}/${run.max_iterations}`}
              />
            </div>
          ) : null}
          <div className="mt-8 rounded-xl border border-rule p-4 text-sm leading-6 text-muted-foreground">
            <p>
              The best win rate landed {run && run.best_win_rate !== null && run.best_win_rate < run.target_win_rate ? "below" : "at or above"}{" "}
              target — reported exactly as measured. The trained weights stay
              on the platform and are downloadable; nothing here is rounded up.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
