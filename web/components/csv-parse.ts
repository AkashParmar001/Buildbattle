"use client";

// Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, commas and
// newlines inside quotes). No dependency needed for two-column imports.
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // skip, handled by \n
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type MappedRow = { text: string; category: string };

export function mapRows(
  headers: string[],
  rows: string[][],
  reviewCol: number,
  categoryCol: number,
  defaultCategory: string,
): { mapped: MappedRow[]; skippedInvalid: number } {
  void headers;
  const mapped: MappedRow[] = [];
  let skippedInvalid = 0;
  for (const r of rows) {
    const text = (r[reviewCol] ?? "").trim();
    const category = (r[categoryCol] ?? "").trim() || defaultCategory;
    if (text.length < 3) {
      skippedInvalid++;
      continue;
    }
    mapped.push({ text, category });
  }
  return { mapped, skippedInvalid };
}

export function dedupeRows(rows: MappedRow[]): { rows: MappedRow[]; dupes: number } {
  const seen = new Set<string>();
  const out: MappedRow[] = [];
  let dupes = 0;
  for (const r of rows) {
    const key = `${r.text.toLowerCase()}|||${r.category}`;
    if (seen.has(key)) {
      dupes++;
      continue;
    }
    seen.add(key);
    out.push(r);
  }
  return { rows: out, dupes };
}
