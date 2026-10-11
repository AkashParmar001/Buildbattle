import { getInsightClusters } from "@/lib/analytics";
import { ClusterCard } from "@/components/cluster-card";
import { EmptyState } from "@/components/empty-state";

export default async function InsightsPage() {
  const clusters = await getInsightClusters();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {clusters.length} topic clusters with size, sentiment, trends, and
          example reviews.
        </p>
      </div>

      {clusters.length === 0 ? (
        <EmptyState
          title="No clusters yet"
          description="Clusters appear here once feedback has been analyzed."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {clusters.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      )}
    </div>
  );
}
