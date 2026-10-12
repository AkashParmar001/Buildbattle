import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import { importFeedback, ImportValidationError } from "@/lib/import-handler";

// Legacy path kept for compatibility; same handler as POST /api/import.
export async function POST(req: NextRequest) {
  await connection();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  try {
    const result = await importFeedback((body as { rows?: unknown })?.rows);
    revalidatePath("/");
    revalidatePath("/app");
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const isValidation = err instanceof ImportValidationError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed." },
      { status: isValidation ? 400 : 500 },
    );
  }
}
