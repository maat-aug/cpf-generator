/* ============================================================
   Data — regions, UFs, and the static name lists
   ============================================================ */
export interface UfRegion {
  digit: string;
  ufs: string[];
}

export const UF_DATA: UfRegion[] = [
  { digit: '1', ufs: ['DF', 'GO', 'MS', 'MT', 'TO'] },
  { digit: '2', ufs: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR'] },
  { digit: '3', ufs: ['CE', 'MA', 'PI'] },
  { digit: '4', ufs: ['AL', 'PB', 'PE', 'RN'] },
  { digit: '5', ufs: ['BA', 'SE'] },
  { digit: '6', ufs: ['MG'] },
  { digit: '7', ufs: ['ES', 'RJ'] },
  { digit: '8', ufs: ['SP'] },
  { digit: '9', ufs: ['PR', 'SC'] },
  { digit: '0', ufs: ['RS'] },
];

export const UF_NAMES: Record<string, string> = {
  DF: 'Distrito Federal', GO: 'Goiás', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', TO: 'Tocantins',
  AC: 'Acre', AM: 'Amazonas', AP: 'Amapá', PA: 'Pará', RO: 'Rondônia', RR: 'Roraima',
  CE: 'Ceará', MA: 'Maranhão', PI: 'Piauí',
  AL: 'Alagoas', PB: 'Paraíba', PE: 'Pernambuco', RN: 'Rio Grande do Norte',
  BA: 'Bahia', SE: 'Sergipe',
  MG: 'Minas Gerais',
  ES: 'Espírito Santo', RJ: 'Rio de Janeiro',
  SP: 'São Paulo',
  PR: 'Paraná', SC: 'Santa Catarina',
  RS: 'Rio Grande do Sul',
};

export const ALEATORIO = 'ALEATORIO';

export interface UfOption {
  value: string;
  label: string;
}

export const UF_OPTIONS: UfOption[] = [
  { value: ALEATORIO, label: 'Aleatório' },
  ...UF_DATA.flatMap(r => r.ufs).map(uf => ({ value: uf, label: `${UF_NAMES[uf]} (${uf})` })),
];

const FIRST_NAMES = ['Lucas', 'João', 'Maria', 'Ana', 'Pedro', 'Gabriel', 'Beatriz', 'Rafael', 'Larissa', 'Bruno', 'Camila', 'Felipe', 'Juliana', 'Matheus', 'Fernanda'];
const LAST_NAMES = ['Silva', 'Oliveira', 'Santos', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro'];

export const MAX_QTY_PER_LOT = 1000;

/* ============================================================
   CPF generation — Módulo 11
   ============================================================ */
export function digitForUf(uf: string): string | null {
  const r = UF_DATA.find(r => r.ufs.includes(uf));
  return r ? r.digit : null;
}

export function regionForDigit(digit: string): UfRegion | null {
  return UF_DATA.find(r => r.digit === String(digit)) || null;
}

function randomRegionAndUf(): { digit: string; uf: string } {
  const r = UF_DATA[Math.floor(Math.random() * UF_DATA.length)];
  const uf = r.ufs[Math.floor(Math.random() * r.ufs.length)];
  return { digit: r.digit, uf };
}

function calcCheckDigit(nums: number[]): number {
  let sum = 0;
  let weight = nums.length + 1;
  for (const n of nums) { sum += n * weight; weight--; }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function genCpfRaw(digit9: string): string {
  const base: number[] = [];
  for (let i = 0; i < 8; i++) base.push(Math.floor(Math.random() * 10));
  base.push(Number(digit9));
  const d10 = calcCheckDigit(base);
  const d11 = calcCheckDigit([...base, d10]);
  return [...base, d10, d11].join('');
}

export function formatCpf(raw: string): string {
  return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function cpfDigitsOnly(cpf: string | null | undefined): string {
  return String(cpf || '').replace(/\D/g, '');
}

export function generateCpfForUf(ufValue: string, formatted: boolean): { cpf: string; uf: string } {
  let digit9: string | null, uf: string;
  if (!ufValue || ufValue === ALEATORIO) {
    const r = randomRegionAndUf();
    digit9 = r.digit; uf = r.uf;
  } else {
    digit9 = digitForUf(ufValue);
    uf = ufValue;
  }
  const raw = genCpfRaw(digit9 as string);
  return { cpf: formatted ? formatCpf(raw) : raw, uf };
}

/* ============================================================
   Name generation — prefix sanitization + word-count rules
   ============================================================ */
function randomFirst(): string { return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]; }
function randomLast(): string { return LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]; }

function sanitizeWords(text: string | null | undefined): string[] {
  return String(text || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
}

export function generateName(prefix: string | null | undefined): string {
  const words = sanitizeWords(prefix);
  if (words.length === 0) return `${randomFirst()} ${randomLast()}`;
  if (words.length === 1) return `${words[0]} ${randomLast()}`;
  // 2 (or more) words: preserve everything the user typed, add one surname.
  return `${words.join(' ')} ${randomLast()}`;
}

export function ufLabel(value: string): string {
  const opt = UF_OPTIONS.find(o => o.value === value);
  return opt ? opt.label : 'Aleatório';
}

export function clampQty(v: number | string): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_QTY_PER_LOT, n));
}
