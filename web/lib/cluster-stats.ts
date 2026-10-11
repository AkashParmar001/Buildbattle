import { getClusterRows, getFeedbackRows, getSupabase } from "@/lib/db";
import { growthOf } from "@/lib/analytics";

// Recomputes stored cluster aggregates after every write (submit/import) so
// KPIs, top issues and recommendations reflect new volume immediately.
// Priority follows AGENTS.md:
//   100 * min(1, 0.4*share/maxShare + 0.35*negativity + 0.25*min(growth/maxGrowth,1))
//   x1.25 when fraud-dominated (dominant category = "Fraud and Scam").
// No-op in seed mode (clusters live in the committed seed file).

const UPDATE_BATCH = 40;

type Stats = {
  id: number;
  volume: number;
  share: number;
  negativity: number;
  growth: number;
  priority: number;
  dominant: string;
};

function computePriority(
  share: number,
  negativity: number,
  growth: number,
  maxShare: number,
  maxGrowth: number,
  fraudDominated: boolean,
): number {
  const volumeTerm = maxShare === 0 ? 0 : 0.4 * (share / maxShare);
  const growthTerm = maxGrowth === 0 ? 0 : 0.25 * Math.min(growth / maxGrowth, 1);
  const score = 100 * Math.min(1, volumeTerm + 0.35 * negativity + growthTerm);
  return fraudDominated ? score * 1.25 : score;
}

export async function refreshClusterStats(): Promise<void> {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    const [rows, clusters] = await Promise.all([
      getFeedbackRows(),
      getClusterRows(),
    ]);
    const meta = new Map(clusters.map((c) => [c.id, c]));
    const byCluster = new Map<number, typeof rows>();
    for (const r of rows) {
      const list = byCluster.get(r.cluster) ?? [];
      list.push(r);
      byCluster.set(r.cluster, list);
    }

    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const stats: Stats[] = [];
    for (const [id, list] of byCluster) {
      if (!meta.has(id)) continue; // e.g. cluster -1 (unclustered): no row
      const volume = list.reduce((sum, r) => sum + r.count, 0);
      const neg = list
        .filter((r) => r.sentiment === "negative")
        .reduce((sum, r) => sum + r.count, 0);
      const weekly = new Array<number>(12).fill(0);
      for (const r of list) {
        r.weekly.forEach((v, i) => {
          weekly[i] = (weekly[i] ?? 0) + v;
        });
      }
      const catVolume = new Map<string, number>();
      for (const r of list) {
        catVolume.set(r.category, (catVolume.get(r.category) ?? 0) + r.count);
      }
      const dominantCategory =
        [...catVolume.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      stats.push({
        id,
        volume,
        share: total === 0 ? 0 : volume / total,
        negativity: volume === 0 ? 0 : neg / volume,
        growth: growthOf(weekly),
        // priority filled in below once maxShare/maxGrowth are known
        priority: 0,
        dominant: dominantCategory,
      });
    }

    const maxShare = Math.max(...stats.map((s) => s.share), 0);
    const maxGrowth = Math.max(...stats.map((s) => s.growth), 0);
    for (const s of stats) {
      s.priority = computePriority(
        s.share,
        s.negativity,
        s.growth,
        maxShare,
        maxGrowth,
        s.dominant === "Fraud and Scam",
      );
    }

    for (let i = 0; i < stats.length; i += UPDATE_BATCH) {
      const results = await Promise.all(
        stats.slice(i, i + UPDATE_BATCH).map((s) =>
          supabase
            .from("clusters")
            .update({
              volume: s.volume,
              share: s.share,
              negativity: s.negativity,
              growth: s.growth,
              priority: s.priority,
            })
            .eq("id", s.id),
        ),
      );
      const bad = results.find((r) => r.error);
      if (bad?.error) throw new Error(`cluster update failed: ${bad.error.message}`);
    }
  } catch (err) {
    // Never fail an already-successful write over stat refresh.
    console.error("refreshClusterStats:", err);
  }
}
