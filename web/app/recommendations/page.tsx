import { ListChecks } from "lucide-react";

import { RoutePlaceholder } from "@/components/route-placeholder";

export default function RecommendationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Recommendations
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Prioritized actions, each backed by volume and evidence.
        </p>
      </div>
      <RoutePlaceholder
        title="Prioritized recommendations land here next"
        description="Ranked actions with score breakdowns, owners, and the example reviews that justify each priority."
        icon={ListChecks}
      />
    </div>
  );
}
