import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import type { ResultRow } from '../types';
import { fillTemplate, type Template } from '../lib/template';

interface ResultsSectionProps {
  results: ResultRow[];
  generated: boolean;
  /** When set, exports are written into this layout instead of the plain 3-column table. */
  template: Template | null;
  onOpenTemplate: () => void;
  onClearTemplate: () => void;
  selected: ReadonlySet<number>;
  onSelectedChange: Dispatch<SetStateAction<ReadonlySet<number>>>;
}

function SelectBox({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" className="au-checkbox" role="checkbox" aria-checked={checked} aria-label={label} onClick={onToggle}>
      <svg className="au-checkbox-indicator" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
        <path className="au-checkbox-check" strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
      </svg>
    </button>
  );
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
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ResultsSection({ results, generated, template, onOpenTemplate, onClearTemplate, selected, onSelectedChange }: ResultsSectionProps) {
  const [openMenu, setOpenMenu] = useState<'copy' | 'export' | null>(null);
  const toggleRow = (i: number) => onSelectedChange(prev => {
    const next = new Set(prev);
    if (!next.delete(i)) next.add(i);
    return next;
  });
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const [copyTooltipPos, setCopyTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const showCopyTooltip = () => {
    const rect = copyBtnRef.current?.getBoundingClientRect();
    if (rect) setCopyTooltipPos({ top: rect.top, left: rect.left + rect.width / 2 });
  };
  const hideCopyTooltip = () => setCopyTooltipPos(null);

  useEffect(() => {
    if (!openMenu) return;
    // Clicks inside any dropdown are handled by its own toggle (switching menus replaces openMenu).
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-dropdown')) setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const exportRows = () => (template
    ? fillTemplate(template, results)
    : [['Nome', 'CPF', 'Estado'], ...results.map(r => [r.name, r.cpf, r.uf])]);
  const exportName = (ext: string) =>
    template ? `${template.fileName.replace(/\.[^.]+$/, '')}-preenchido.${ext}` : `cpfs.${ext}`;

  const exportXlsx = () => {
    const rows = exportRows();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CPFs');
    XLSX.writeFile(wb, exportName('xlsx'));
    setOpenMenu(null);
  };

  const exportCsv = () => {
    // Excel pt-BR reads ';' as the CSV separator.
    const rows = exportRows().map(r => r.map(escapeCsv).join(';'));
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, exportName('csv'));
    setOpenMenu(null);
  };

  const copyAndClose = (text: string) => {
    copyText(text);
    setOpenMenu(null);
  };
  const names = results.map(r => r.name).filter(Boolean);

  const hasResults = generated && results.length > 0;

  return (
    <section className="panel" id="result-section" aria-labelledby="result-heading">
      <div className="result-header">
        <div className="result-title">
          <h2 id="result-heading" className="panel-heading">Resultados</h2>
        </div>
        <div className="result-actions">
          {hasResults && (
            <div className="action-dropdown action-dropdown-left" data-open={openMenu === 'copy' || undefined}>
              <button
                type="button"
                className="action-btn"
                aria-haspopup="menu"
                aria-expanded={openMenu === 'copy'}
                onClick={() => setOpenMenu(m => (m === 'copy' ? null : 'copy'))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                Copiar
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="action-dropdown-chevron"><path d="m6 9 6 6 6-6"></path></svg>
              </button>
              {openMenu === 'copy' && (
                <ul className="action-dropdown-menu" role="menu">
                  <li role="menuitem" onClick={() => copyAndClose(['Nome\tCPF\tEstado', ...results.map(r => `${r.name}\t${r.cpf}\t${r.uf}`)].join('\n'))}>
                    Copiar tabela inteira
                  </li>
                  <li role="menuitem" onClick={() => copyAndClose(results.map(r => r.cpf).join('\n'))}>
                    Copiar todos os CPFs
                  </li>
                  <li
                    role="menuitem"
                    aria-disabled={names.length === 0 || undefined}
                    title={names.length === 0 ? 'Nenhum nome gerado' : undefined}
                    onClick={() => { if (names.length) copyAndClose(names.join('\n')); }}
                  >
                    Copiar todos os nomes
                  </li>
                </ul>
              )}
            </div>
          )}
          {hasResults && (
            <button type="button" className="action-btn" onClick={onOpenTemplate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
              Planilha modelo
            </button>
          )}
          {hasResults && (
            <div className="action-dropdown" data-open={openMenu === 'export' || undefined}>
              <button
                type="button"
                className="action-btn action-btn-accent"
                aria-haspopup="menu"
                aria-expanded={openMenu === 'export'}
                onClick={() => setOpenMenu(m => (m === 'export' ? null : 'export'))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"></path><path d="m7 10 5 5 5-5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                Exportar
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="action-dropdown-chevron"><path d="m6 9 6 6 6-6"></path></svg>
              </button>
              {openMenu === 'export' && (
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
          )}
        </div>
      </div>

      {template && (
        <div className="template-bar" role="status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
          <span className="template-bar-text">
            Exportando no layout de <strong>{template.fileName}</strong>
          </span>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Remover planilha modelo" title="Remover modelo" onClick={onClearTemplate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>
      )}

      {!hasResults && (
        <div className="card result-empty">
          <p>Nenhum resultado ainda. Configure os lotes e clique em <strong>Gerar</strong>.</p>
        </div>
      )}

      {hasResults && (
        <div className="card result-table-card">
          <div className="result-table-scroll">
            <table className="table">
              <colgroup>
                <col className="col-select" />
                <col className="col-num" />
                <col /><col /><col />
              </colgroup>
              <thead>
                <tr>
                  <th aria-label="Seleção"></th>
                  <th className="num-cell">#</th>
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
                        <div className="floating-tooltip" style={{ top: copyTooltipPos.top, left: copyTooltipPos.left }}>
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
                  <tr key={i} aria-selected={selected.has(i)}>
                    <td><SelectBox checked={selected.has(i)} label={`Selecionar linha ${i + 1}`} onToggle={() => toggleRow(i)} /></td>
                    <td className="num-cell">{i + 1}</td>
                    <td>{r.name}</td>
                    <td className="cpf-cell">{r.cpf}</td>
                    <td><span className="tag tag-neutral">{r.uf}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
