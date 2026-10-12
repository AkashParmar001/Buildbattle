import { NextResponse } from "next/server";
import { connection } from "next/server";

import {
  loadAdaptionEval,
  loadAdaptionEvaluation,
  loadAutoScientistRun,
  loadShowcase,
} from "@/lib/showcase";

// Committed pipeline artifacts for the "Under the hood" modal.
export async function GET() {
  await connection();
  try {
    const [showcase, adaptionEval, adaptionEvaluation, autoscientist] =
      await Promise.all([
        loadShowcase(),
        loadAdaptionEval(),
        loadAdaptionEvaluation(),
        loadAutoScientistRun(),
      ]);
    return NextResponse.json({
      showcase,
      adaptionEval,
      adaptionEvaluation,
      autoscientist,
    });
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
