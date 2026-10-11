import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import { updateIssue, type IssueStatus } from "@/lib/issues";

const VALID_STATUSES: IssueStatus[] = ["open", "in_progress", "resolved"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { status, notes } = (body ?? {}) as {
    status?: unknown;
    notes?: unknown;
  };
  if (
    status !== undefined &&
    (typeof status !== "string" || !VALID_STATUSES.includes(status as IssueStatus))
  ) {
    return NextResponse.json(
      { error: "status must be open, in_progress, or resolved." },
      { status: 400 },
    );
  }
  if (notes !== undefined && typeof notes !== "string") {
    return NextResponse.json({ error: "notes must be a string." }, { status: 400 });
  }
  if (typeof notes === "string" && notes.length > 2000) {
    return NextResponse.json(
      { error: "notes must be under 2000 characters." },
      { status: 400 },
    );
  }
  try {
    const issue = await updateIssue(id, {
      ...(status !== undefined ? { status: status as IssueStatus } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });
    revalidatePath("/issues");
    return NextResponse.json({ issue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed.";
    const notFound = message.includes("not found");
    return NextResponse.json(
      { error: message },
      { status: notFound ? 404 : 500 },
    );
  }
}
