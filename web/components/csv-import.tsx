"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { dedupeRows, mapRows, parseCsv } from "@/components/csv-parse";

const ROW_LIMIT = 2000;

type CsvImportProps = {
  categories: string[];
};

function guessColumn(headers: string[], hints: string[]): number {
  const idx = headers.findIndex((h) =>
    hints.some((hint) => h.toLowerCase().includes(hint)),
  );
  return idx === -1 ? 0 : idx;
}

export function CsvImport({ categories }: CsvImportProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [reviewCol, setReviewCol] = useState(0);
  const [categoryCol, setCategoryCol] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setError(null);
    setStatus(null);
    const text = await file.text();
    const all = parseCsv(text);
    if (all.length < 2) {
      setError("No data rows found. Expect a header plus review rows.");
      return;
    }
    const [head, ...body] = all;
    setFileName(file.name);
    setHeaders(head);
    setDataRows(body);
    setReviewCol(guessColumn(head, ["review", "text", "feedback", "comment"]));
    setCategoryCol(guessColumn(head, ["categor", "topic", "type"]));
  }

  const overLimit = dataRows.length > ROW_LIMIT;
  const preview = dataRows.slice(0, 5).map((r, i) => ({ i, cells: r }));

  async function onImport() {
    setError(null);
    setBusy(true);
    try {
      const { mapped } = mapRows(
        headers,
        dataRows,
        reviewCol,
        categoryCol,
        categories[0] ?? "Product Feedback",
      );
      const { rows } = dedupeRows(mapped);
      const res = await fetch("/api/feedback/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: rows.slice(0, ROW_LIMIT) }),
      });
      const json = (await res.json()) as {
        error?: string;
        inserted?: number;
        skippedDuplicates?: number;
        skippedInvalid?: number;
      };
      if (!res.ok) {
        setError(json.error ?? "Import failed.");
        return;
      }
      setStatus(
        `Imported ${json.inserted} reviews (${json.skippedDuplicates} duplicates, ${json.skippedInvalid} invalid skipped).`,
      );
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex h-9 shrink-0 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Import CSV
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="import-csv-title"
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 backdrop:bg-black/40 open:flex open:flex-col dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6">
          <h2 id="import-csv-title" className="text-base font-semibold tracking-tight">
            Import feedback CSV
          </h2>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void onFile(f);
            }}
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              Drag a CSV here, or click to choose
            </span>
            <span>Columns needed: review text + category</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>

          {fileName !== "" && (
            <>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {fileName} — {dataRows.length.toLocaleString()} rows
                {overLimit && (
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {" "}
                    (over the {ROW_LIMIT.toLocaleString()}-row per-batch limit —
                    only the first {ROW_LIMIT.toLocaleString()} will import)
                  </span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Review column
                  </span>
                  <select
                    value={reviewCol}
                    onChange={(e) => setReviewCol(Number(e.target.value))}
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Category column
                  </span>
                  <select
                    value={categoryCol}
                    onChange={(e) => setCategoryCol(Number(e.target.value))}
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Preview (first 5 rows)
                </p>
                <ul className="flex flex-col gap-1.5">
                  {preview.map((r) => (
                    <li
                      key={r.i}
                      className="rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 dark:bg-zinc-900"
                    >
                      <span>{(r.cells[reviewCol] ?? "").slice(0, 120)}</span>
                      <span className="mt-0.5 block font-medium text-zinc-500 dark:text-zinc-400">
                        {(r.cells[categoryCol] ?? "").trim() ||
                          categories[0] }
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          {status && (
            <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
              {status}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-9 rounded-lg px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => void onImport()}
              disabled={busy || dataRows.length === 0}
              className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Importing…" : overLimit ? `Import first ${ROW_LIMIT.toLocaleString()}` : "Import"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
