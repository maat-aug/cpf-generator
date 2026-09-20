import type { ResultRow } from '../types';

// Headers are compared after norm(): lowercase, no accents, punctuation collapsed to spaces.
const NAME_HEADERS = ['nome', 'nome completo', 'name', 'full name', 'nome do cliente', 'nome cliente', 'cliente'];
const CPF_HEADERS = ['cpf', 'documento', 'doc', 'n cpf', 'no cpf', 'num cpf', 'numero cpf', 'numero do cpf', 'cpf do cliente', 'cpf cliente'];
const UF_HEADERS = ['estado', 'uf', 'estado uf', 'sigla uf', 'state'];
const HEADER_SCAN_ROWS = 10;

const norm = (v: unknown) =>
  String(v ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const isBlank = (row: unknown[] | undefined) => !row || row.every(c => String(c ?? '').trim() === '');

function findColumnIndex(headerRow: unknown[], candidates: string[]): number {
  return headerRow.findIndex(h => candidates.includes(norm(h)));
}

export class TemplateError extends Error {}

/** A spreadsheet layout chosen by the user; filled with the results table only at export time. */
export interface Template {
  fileName: string;
  /** Sheet rows aligned to A1: everything up to and including the header, then the existing data rows. */
  rows: unknown[][];
  headerIdx: number;
  /** Column indexes; -1 when the sheet has no such column (columns are never added). */
  nameCol: number;
  cpfCol: number;
  ufCol: number;
}

export function parseTemplate(fileName: string, rows: unknown[][]): Template {
  // rows: array-of-arrays aligned to the sheet (rows[0] = sheet row 1, col 0 = column A).
  let headerIdx = -1;
  for (let r = 0; r < Math.min(rows.length, HEADER_SCAN_ROWS) && headerIdx === -1; r++) {
    const row = rows[r] ?? [];
    if ([NAME_HEADERS, CPF_HEADERS, UF_HEADERS].some(c => findColumnIndex(row, c) !== -1)) headerIdx = r;
  }
  if (headerIdx === -1) {
    throw new TemplateError('nenhuma coluna Nome, CPF ou Estado foi encontrada nas 10 primeiras linhas.');
  }
  const header = rows[headerIdx];
  const t: Template = {
    fileName,
    rows: rows.map(r => [...r]),
    headerIdx,
    nameCol: findColumnIndex(header, NAME_HEADERS),
    cpfCol: findColumnIndex(header, CPF_HEADERS),
    ufCol: findColumnIndex(header, UF_HEADERS),
  };
  // Trailing blank rows are just Excel's used range, not rows to keep.
  while (t.rows.length > headerIdx + 1 && isBlank(t.rows[t.rows.length - 1])) t.rows.pop();
  // Numeric cells lose leading zeros (01234567890 -> 1234567890); restore them.
  if (t.cpfCol !== -1) {
    for (const row of t.rows.slice(headerIdx + 1)) {
      const v = String(row[t.cpfCol] ?? '').trim();
      if (/^\d{9,10}$/.test(v)) row[t.cpfCol] = v.padStart(11, '0');
    }
  }
  return t;
}

/**
 * Template layout + results table, in order: each existing data row takes the next result into its
 * empty Nome/CPF/Estado cells (filled cells are kept); leftover results become new rows at the end.
 * Blank rows between data rows are kept and don't take a result.
 */
export function fillTemplate(t: Template, results: ResultRow[]): unknown[][] {
  const width = t.rows[t.headerIdx].length;
  const out = t.rows.slice(0, t.headerIdx + 1).map(r => [...r]);
  let next = 0;
  const fill = (row: unknown[]) => {
    const r = results[next++];
    for (const [col, value] of [[t.nameCol, r.name], [t.cpfCol, r.cpf], [t.ufCol, r.uf]] as const) {
      if (col !== -1 && String(row[col] ?? '').trim() === '') row[col] = value;
    }
  };

  for (const src of t.rows.slice(t.headerIdx + 1)) {
    const row = [...src];
    while (row.length < width) row.push('');
    if (!isBlank(src) && next < results.length) fill(row);
    out.push(row);
  }
  while (next < results.length) {
    const row: unknown[] = Array.from({ length: width }, () => '');
    fill(row);
    out.push(row);
  }
  return out;
}
