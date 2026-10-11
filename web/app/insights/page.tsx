import { Lightbulb } from "lucide-react";

import { RoutePlaceholder } from "@/components/route-placeholder";

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Topic clusters with size, sentiment, trends, and example reviews.
        </p>
      </div>
      <RoutePlaceholder
        title="Cluster cards land here next"
        description="One card per feedback cluster: label, summary, volume, sentiment mix, sparkline, and representative reviews."
        icon={Lightbulb}
      />
    </div>
  );
}
