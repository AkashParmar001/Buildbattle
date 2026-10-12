import { NextResponse } from "next/server";
import { connection } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves the exportable fine-tuning-ready JSONL (320-row classification
// set — a training export, not a trained model) as a file download.
// Server-side only.
export async function GET() {
  await connection();
  const full = path.join(process.cwd(), "data", "autoscientist_sft.jsonl");
  try {
    const body = await readFile(full, "utf8");
    return new NextResponse(body, {
      headers: {
        "content-type": "application/jsonl",
        "content-disposition":
          'attachment; filename="autoscientist_sft.jsonl"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Training set not found. Regenerate data/autoscientist_sft.jsonl." },
      { status: 404 },
    );
  }
}
