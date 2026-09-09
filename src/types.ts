export interface Lot {
  id: number;
  qty: number;
  uf: string;
  genName: boolean;
  nameMode: 'aleatorio' | 'prefixo';
  prefix: string;
}

export interface ResultRow {
  name: string;
  cpf: string;
  uf: string;
}
