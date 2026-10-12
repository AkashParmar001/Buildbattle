import { NextResponse } from "next/server";
import { connection } from "next/server";

import {
  loadAdaptionEval,
  loadAdaptionEvaluation,
  loadShowcase,
} from "@/lib/showcase";

// Committed pipeline artifacts for the "Under the hood" modal.
export async function GET() {
  await connection();
  try {
    const [showcase, adaptionEval, adaptionEvaluation] = await Promise.all([
      loadShowcase(),
      loadAdaptionEval(),
      loadAdaptionEvaluation(),
    ]);
    return NextResponse.json({ showcase, adaptionEval, adaptionEvaluation });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not load pipeline data.",
      },
      { status: 500 },
    );
  }
}
