import { cpfDigitsOnly, digitForUf, generateCpfForUf, generateName, regionForDigit } from './cpf';
import type { ResultRow } from '../types';

const NAME_HEADERS = ['nome', 'nome completo', 'name'];
const CPF_HEADERS = ['cpf', 'documento', 'doc'];
const UF_HEADERS = ['estado', 'uf'];

function findColumnIndex(headerRow: unknown[], candidates: string[]): number {
  for (let i = 0; i < headerRow.length; i++) {
    const h = String(headerRow[i] ?? '').trim().toLowerCase();
    if (candidates.includes(h)) return i;
  }
  return -1;
}

function deduceUfFromCpf(rawCpf: string): string {
  const digits = cpfDigitsOnly(rawCpf);
  if (digits.length < 9) return '';
  const region = regionForDigit(digits[8]);
  if (!region) return '';
  return region.ufs[Math.floor(Math.random() * region.ufs.length)];
}

export function processTemplateRows(rows: unknown[][], formatted: boolean): { outRows: unknown[][]; displayResults: ResultRow[] } {
  // rows: array-of-arrays, rows[0] is the header.
  const header = rows[0] ? [...rows[0]] : [];
  let nameIdx = findColumnIndex(header, NAME_HEADERS);
  let cpfIdx = findColumnIndex(header, CPF_HEADERS);
  let ufIdx = findColumnIndex(header, UF_HEADERS);

  if (nameIdx === -1) { header.push('Nome'); nameIdx = header.length - 1; }
  if (cpfIdx === -1) { header.push('CPF'); cpfIdx = header.length - 1; }
  if (ufIdx === -1) { header.push('Estado'); ufIdx = header.length - 1; }

  const outRows: unknown[][] = [header];
  const displayResults: ResultRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = [...rows[r]];
    while (row.length < header.length) row.push('');

    let cpfVal = String(row[cpfIdx] ?? '').trim();
    let ufVal = String(row[ufIdx] ?? '').trim().toUpperCase();
    let nameVal = String(row[nameIdx] ?? '').trim();

    if (!row.some(c => String(c ?? '').trim() !== '')) continue; // skip fully blank rows

    if (cpfVal === '') {
      if (ufVal !== '' && digitForUf(ufVal)) {
        const gen = generateCpfForUf(ufVal, formatted);
        cpfVal = gen.cpf; ufVal = gen.uf;
      } else {
        const gen = generateCpfForUf('ALEATORIO', formatted);
        cpfVal = gen.cpf; ufVal = gen.uf;
      }
    } else if (ufVal === '') {
      ufVal = deduceUfFromCpf(cpfVal);
    }

    if (nameVal === '') {
      nameVal = generateName('');
    }

    row[nameIdx] = nameVal;
    row[cpfIdx] = cpfVal;
    row[ufIdx] = ufVal;
    outRows.push(row);
    displayResults.push({ name: nameVal, cpf: cpfVal, uf: ufVal });
  }

  return { outRows, displayResults };
}
