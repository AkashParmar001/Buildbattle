import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import { getIssueTrackedClusterIds, getIssues, trackIssue } from "@/lib/issues";
import { getClusterRows } from "@/lib/db";

export async function GET() {
  await connection();
  const [issues, trackedClusterIds] = await Promise.all([
    getIssues(),
    getIssueTrackedClusterIds(),
  ]);
  return NextResponse.json({ issues, trackedClusterIds });
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
  revalidatePath("/recommendations");
  revalidatePath("/issues");
  return NextResponse.json({ issue, created }, { status: created ? 201 : 200 });
}
