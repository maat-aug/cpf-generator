import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { TemplateError, parseTemplate, type Template } from '../lib/template';

interface ImportModalProps {
  onClose: () => void;
  onLoaded: (template: Template) => void;
}

export function ImportModal({ onClose, onLoaded }: ImportModalProps) {
  const [status, setStatus] = useState('');
  const [fileLabel, setFileLabel] = useState('Escolher arquivo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    setStatus('Processando…');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const buf = await file.arrayBuffer();
      let workbook: XLSX.WorkBook;
      if (ext === 'csv') {
        // Excel pt-BR saves CSV as Windows-1252; raw keeps "01234567890" as text.
        let text: string;
        try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
        catch { text = new TextDecoder('windows-1252').decode(buf); }
        workbook = XLSX.read(text, { type: 'string', raw: true });
      } else {
        workbook = XLSX.read(buf, { type: 'array' });
      }
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet?.['!ref']) throw new Error('Planilha vazia.');
      // Start the range at A1 so row/column indexes match the original sheet.
      const range = XLSX.utils.decode_range(sheet['!ref']);
      range.s = { r: 0, c: 0 };
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, range }) as unknown[][];

      const template = parseTemplate(file.name, rows);
      onLoaded(template);

      const cols = [['Nome', template.nameCol], ['CPF', template.cpfCol], ['Estado', template.ufCol]]
        .filter(([, c]) => c !== -1).map(([n]) => n).join(', ');
      setStatus(`Modelo carregado. Colunas preenchidas no export: ${cols}.`);
      setTimeout(onClose, 1500);
    } catch (err) {
      if (!(err instanceof TemplateError)) console.error(err);
      setStatus('Erro ao ler a planilha: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <div className="dialog-header">
          <div className="dialog-title" id="import-title">Planilha modelo</div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Fechar" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>
        <div className="dialog-body">
          <p>Envie uma planilha (.xlsx, .xls ou .csv) para servir de modelo. Ao <strong>Exportar</strong>, os resultados da tabela são gravados nela, no mesmo layout.</p>
          <ul>
            <li>Colunas reconhecidas: <strong>Nome</strong> (ou "Nome Completo", "Cliente"), <strong>CPF</strong> (ou "Nº CPF", "Documento") e <strong>Estado</strong> (ou "UF"). Maiúsculas, acentos e pontuação são ignorados, e o cabeçalho pode estar em qualquer uma das 10 primeiras linhas.</li>
            <li>Só essas colunas são preenchidas. Nenhuma coluna é criada, e as demais ficam como estão.</li>
            <li>Linhas que já têm dados recebem os resultados da tabela, em ordem, só nas células vazias. Os resultados que sobrarem viram linhas novas no fim.</li>
            <li>O modelo fica ativo até você removê-lo, inclusive ao gerar novos CPFs.</li>
          </ul>
          <label className="btn btn-secondary import-file-label">
            <span>{fileLabel}</span>
            <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={handleFileChange} />
          </label>
          <p className={`import-status${status.startsWith('Erro') ? ' is-error' : ''}`} role="status">{status}</p>
        </div>
      </div>
    </div>
  );
}
