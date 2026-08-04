/**
 * Minimal RFC 4180 CSV parser. Returns rows as objects keyed by the header.
 *
 * Handles:
 * - Quoted fields with embedded commas
 * - Doubled double-quotes as escaped quotes
 * - CRLF or LF line endings
 * - Trailing blank lines
 * - Short rows (missing trailing fields become empty strings)
 *
 * Does NOT handle:
 * - Multi-line quoted fields (newlines inside quotes). GTFS feeds don't use them.
 */
export function parseCsv(input: string): Record<string, string>[] {
  if (input.length === 0) return [];

  // Strip a leading UTF-8 BOM if present — GTFS feeds ship with one.
  const clean = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows = parseRows(clean);
  if (rows.length === 0) return [];

  const header = rows[0];
  const records: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = row[c] ?? '';
    }
    records.push(obj);
  }
  return records;
}

function parseRows(input: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      current.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\r' && input[i + 1] === '\n') {
      current.push(field);
      commitRow(current, rows);
      current = [];
      field = '';
      i += 2;
      continue;
    }

    if (ch === '\n') {
      current.push(field);
      commitRow(current, rows);
      current = [];
      field = '';
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field);
    commitRow(current, rows);
  }

  return rows;
}

function commitRow(row: string[], rows: string[][]): void {
  if (row.length === 1 && row[0] === '') return;
  rows.push(row);
}
