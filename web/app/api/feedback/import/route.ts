import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import { classifyFeedback } from "@/lib/classify";
import { getClusterRows } from "@/lib/db";
import { addUserFeedback, keyOfExisting } from "@/lib/feedback-store";

const MAX_ROWS = 2000;

export async function POST(req: NextRequest) {
  await connection();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const rows = (body as { rows?: unknown })?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "Provide a non-empty rows array." },
      { status: 400 },
    );
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Import limited to ${MAX_ROWS} rows per batch.` },
      { status: 400 },
    );
  }

  const clusters = await getClusterRows();
  const existing = await keyOfExisting();
  let inserted = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    const { text, category } = (row ?? {}) as {
      text?: unknown;
      category?: unknown;
    };
    if (
      typeof text !== "string" ||
      text.trim().length < 3 ||
      text.length > 2000 ||
      typeof category !== "string" ||
      category.trim().length === 0
    ) {
      skippedInvalid++;
      continue;
    }
    const key = `${text.trim().toLowerCase()}|||${category.trim()}`;
    if (existing.has(key)) {
      skippedDuplicates++;
      continue;
    }
    existing.add(key);
    const classification = await classifyFeedback(
      text.trim(),
      category.trim(),
      clusters,
    );
    await addUserFeedback({
      text: text.trim(),
      category: category.trim(),
      sentiment: classification.sentiment,
      score: classification.score,
      topic: classification.topic,
      cluster: classification.cluster,
    });
    inserted++;
  }

  revalidatePath("/");
  revalidatePath("/feedback");

  return NextResponse.json(
    { inserted, skippedDuplicates, skippedInvalid },
    { status: 201 },
  );
}
