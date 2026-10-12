import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import { getIssueTrackedClusterIds, getIssues, trackIssue } from "@/lib/issues";
import { getClusterRows } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    const [issues, trackedClusterIds, clusters] = await Promise.all([
      getIssues(),
      getIssueTrackedClusterIds(),
      getClusterRows(),
    ]);
    const clusterMeta = clusters.map((c) => ({
      id: c.id,
      label: c.label,
      priority: c.priority,
    }));
    return NextResponse.json({ issues, trackedClusterIds, clusterMeta });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load issues." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  await connection();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { clusterId } = (body ?? {}) as { clusterId?: unknown };
  if (typeof clusterId !== "number" || !Number.isInteger(clusterId)) {
    return NextResponse.json(
      { error: "clusterId (integer) is required." },
      { status: 400 },
    );
  }
  const clusters = await getClusterRows();
  const cluster = clusters.find((c) => c.id === clusterId);
  if (!cluster) {
    return NextResponse.json({ error: "Unknown cluster." }, { status: 404 });
  }
  const { issue, created } = await trackIssue(clusterId, cluster.label);
  revalidatePath("/app");
  return NextResponse.json({ issue, created }, { status: created ? 201 : 200 });
}
