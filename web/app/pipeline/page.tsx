import { Sparkles } from "lucide-react";

import { RoutePlaceholder } from "@/components/route-placeholder";

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Raw CSV → dedupe → Adaption → sentiment → clusters → priority.
        </p>
      </div>
      <RoutePlaceholder
        title="Adaption showcase lands here next"
        description="Each pipeline step with counts and timing, raw-vs-adapted text comparisons, and the evaluation quality score."
        icon={Sparkles}
      />
    </div>
  );
}
