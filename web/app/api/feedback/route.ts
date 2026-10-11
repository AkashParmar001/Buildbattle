import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import { classifyFeedback } from "@/lib/classify";
import { getClusterRows } from "@/lib/db";
import { addUserFeedback } from "@/lib/feedback-store";

export async function POST(req: NextRequest) {
  await connection();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { text, category } = (body ?? {}) as {
    text?: unknown;
    category?: unknown;
  };
  if (typeof text !== "string" || text.trim().length < 3) {
    return NextResponse.json(
      { error: "Review text must be at least 3 characters." },
      { status: 400 },
    );
  }
  if (typeof category !== "string" || category.trim().length === 0) {
    return NextResponse.json(
      { error: "Category is required." },
      { status: 400 },
    );
  }
  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Review text must be under 2000 characters." },
      { status: 400 },
    );
  }

  const clusters = await getClusterRows();
  const classification = await classifyFeedback(
    text.trim(),
    category.trim(),
    clusters,
  );
  const record = await addUserFeedback({
    text: text.trim(),
    category: category.trim(),
    sentiment: classification.sentiment,
    score: classification.score,
    topic: classification.topic,
    cluster: classification.cluster,
  });

  revalidatePath("/");
  revalidatePath("/feedback");

  return NextResponse.json({ record }, { status: 201 });
}
