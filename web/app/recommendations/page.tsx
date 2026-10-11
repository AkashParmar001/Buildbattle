import { getRecommendations } from "@/lib/analytics";
import { getIssueTrackedClusterIds } from "@/lib/issues";
import { EmptyState } from "@/components/empty-state";
import { RecommendationCard } from "@/components/recommendation-card";

export default async function RecommendationsPage() {
  const [items, tracked] = await Promise.all([
    getRecommendations(),
    getIssueTrackedClusterIds(),
  ]);
  const trackedSet = new Set(tracked);

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

      {items.length === 0 ? (
        <EmptyState
          title="No recommendations yet"
          description="Recommendations appear here once feedback has been analyzed."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <RecommendationCard
              key={item.id}
              item={item}
              rank={i + 1}
              tracked={trackedSet.has(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
