import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import type { ResultRow } from '../types';

interface ResultsSectionProps {
  results: ResultRow[];
  generated: boolean;
  onOpenImport: () => void;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    document.body.removeChild(ta);
  }
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

function escapeCsv(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ResultsSection({ results, generated, onOpenImport }: ResultsSectionProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const [copyTooltipPos, setCopyTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const showCopyTooltip = () => {
    const rect = copyBtnRef.current?.getBoundingClientRect();
    if (rect) setCopyTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
  };
  const hideCopyTooltip = () => setCopyTooltipPos(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [exportOpen]);

  if (!generated) return null;

  const exportXlsx = () => {
    const rows = [['Nome', 'CPF', 'Estado'], ...results.map(r => [r.name, r.cpf, r.uf])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CPFs');
    XLSX.writeFile(wb, 'cpfs.xlsx');
    setExportOpen(false);
  };

  const exportCsv = () => {
    const rows = ['Nome,CPF,Estado', ...results.map(r => [r.name, r.cpf, r.uf].map(escapeCsv).join(','))];
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, 'cpfs.csv');
    setExportOpen(false);
  };

  return (
    <section className="panel" id="result-section" aria-labelledby="result-heading">
      <div className="result-header">
        <div className="result-title">
          <h2 id="result-heading" className="panel-heading">Resultados</h2>
          <span className="tag tag-accent">{results.length} registro{results.length === 1 ? '' : 's'}</span>
        </div>
        <div className="result-actions">
          <button type="button" className="action-btn" onClick={() => copyText(['Nome\tCPF\tEstado', ...results.map(r => `${r.name}\t${r.cpf}\t${r.uf}`)].join('\n'))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
            Copiar Tabela
          </button>
          <button type="button" className="action-btn" onClick={onOpenImport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
            Importar planilha
          </button>
          <div className="action-dropdown" data-open={exportOpen || undefined} ref={dropdownRef}>
            <button
              type="button"
              className="action-btn action-btn-accent"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              onClick={() => setExportOpen(o => !o)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"></path><path d="m7 10 5 5 5-5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
              Exportar
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="action-dropdown-chevron"><path d="m6 9 6 6 6-6"></path></svg>
            </button>
            {exportOpen && (
              <ul className="action-dropdown-menu" role="menu">
                <li role="menuitem" onClick={exportXlsx}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
                  Exportar <strong>.xlsx</strong>
                </li>
                <li role="menuitem" onClick={exportCsv}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
                  Exportar <strong>.csv</strong>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="card elev-sm result-table-card">
        <div className="result-table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>
                  <span className="th-with-action">
                    CPF
                    <button
                      ref={copyBtnRef}
                      type="button"
                      className="th-copy-btn"
                      aria-label="Copiar CPFs"
                      onClick={() => copyText(results.map(r => r.cpf).join('\n'))}
                      onMouseEnter={showCopyTooltip}
                      onMouseLeave={hideCopyTooltip}
                      onFocus={showCopyTooltip}
                      onBlur={hideCopyTooltip}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                    </button>
                    {copyTooltipPos && createPortal(
                      <div
                        className="floating-tooltip"
                        style={{ top: copyTooltipPos.top, left: copyTooltipPos.left }}
                      >
                        Copiar CPFs
                      </div>,
                      document.body
                    )}
                  </span>
                </th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td className="cpf-cell">{r.cpf}</td>
                  <td><span className="tag tag-neutral">{r.uf}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
