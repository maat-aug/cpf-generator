import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { processTemplateRows } from '../lib/template';
import type { ResultRow } from '../types';

interface ImportModalProps {
  open: boolean;
  formatted: boolean;
  onClose: () => void;
  onImported: (results: ResultRow[]) => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImportModal({ open, formatted, onClose, onImported }: ImportModalProps) {
  const [status, setStatus] = useState('');
  const [fileLabel, setFileLabel] = useState('Escolher arquivo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    setStatus('Processando…');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let workbook: XLSX.WorkBook;
      if (ext === 'csv') {
        const text = await file.text();
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        const buf = await file.arrayBuffer();
        workbook = XLSX.read(buf, { type: 'array' });
      }
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as unknown[][];

      if (!rows.length) throw new Error('Planilha vazia.');

      const { outRows, displayResults } = processTemplateRows(rows, formatted);

      const outWs = XLSX.utils.aoa_to_sheet(outRows);
      const baseName = file.name.replace(/\.[^.]+$/, '');

      if (ext === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(outWs);
        downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `${baseName}_preenchido.csv`);
      } else {
        const outWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(outWb, outWs, sheetName || 'Planilha');
        XLSX.writeFile(outWb, `${baseName}_preenchido.xlsx`);
      }

      onImported(displayResults);

      setStatus(`Pronto! ${displayResults.length} linha(s) processada(s) e baixadas.`);
      setTimeout(onClose, 900);
    } catch (err) {
      console.error(err);
      setStatus('Erro ao processar a planilha: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <div className="dialog-title" id="import-title">Preenchimento por planilha</div>
        <div className="dialog-body">
          <p>Envie uma planilha existente (.xlsx, .xls ou .csv) e o sistema completa automaticamente o que estiver faltando — sem apagar nada que você já preencheu.</p>
          <ul>
            <li>Colunas reconhecidas: <strong>Nome</strong> (ou "Nome Completo", "Name"), <strong>CPF</strong> (ou "Documento", "Doc") e <strong>Estado</strong> (ou "UF") — não importa maiúsculas ou minúsculas.</li>
            <li>Linha sem CPF: geramos um CPF válido, usando o estado da linha se houver, ou um estado aleatório.</li>
            <li>Linha sem nome: geramos um nome completo automaticamente.</li>
            <li>Linha já preenchida: mantemos exatamente como está.</li>
            <li>Outras colunas (ID, e-mail, cargo etc.) são preservadas sem alteração.</li>
          </ul>
          <label className="btn btn-secondary import-file-label">
            <span>{fileLabel}</span>
            <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={handleFileChange} />
          </label>
          <p className="import-status">{status}</p>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
