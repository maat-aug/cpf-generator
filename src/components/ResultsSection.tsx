import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import type { ResultRow } from "@/types";
import { Checkbox } from "@/components/Checkbox";
import { fillTemplate, type Template } from "@/lib/template";

type ResultsSectionProps = {
  readonly results: ResultRow[];
  readonly generated: boolean;
  /** When set, exports are written into this layout instead of the plain 3-column table. */
  readonly template: Template | null;
  readonly onOpenTemplate: () => void;
  readonly onClearTemplate: () => void;
  readonly selected: ReadonlySet<number>;
  readonly onSelectedChange: Dispatch<SetStateAction<ReadonlySet<number>>>;
};

const ACTION_BTN =
  "inline-flex min-h-[38px] cursor-pointer items-center gap-[7px] rounded-md border border-line-strong bg-surface px-3 text-[14px] font-semibold whitespace-nowrap text-ink shadow-[var(--shadow-sm)] transition-colors duration-120 hover:bg-surface-alt active:bg-line";

const ACTION_BTN_ACCENT =
  "inline-flex min-h-[38px] cursor-pointer items-center gap-[7px] rounded-md border border-accent bg-accent px-3 text-[14px] font-semibold whitespace-nowrap text-on-accent shadow-[var(--shadow-sm)] transition-colors duration-120 hover:border-accent-hover hover:bg-accent-hover active:bg-accent-hover";

const MENU =
  "absolute top-[calc(100%+4px)] z-20 m-0 w-max min-w-full list-none rounded-md border border-line-strong bg-surface p-1 shadow-[var(--shadow-md)]";

const MENU_ITEM =
  "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[14px] whitespace-nowrap not-aria-disabled:hover:bg-accent-soft not-aria-disabled:hover:text-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-45 [&_svg]:flex-none";

const CHEVRON = "transition-transform duration-[160ms] group-aria-expanded:rotate-180";

const ICON_BUTTON =
  "inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-muted transition-[background-color,border-color,color] duration-120 hover:bg-surface-alt hover:text-ink active:bg-line";

const TH =
  "sticky top-0 z-1 border-b border-line-strong bg-surface px-4 py-2.5 text-left text-[14px] font-semibold text-muted max-[520px]:px-2";
const TD = "border-b border-line px-4 py-2 [overflow-wrap:anywhere] max-[520px]:px-2";
const NUM = "px-2 text-right whitespace-nowrap [font-variant-numeric:tabular-nums]";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* ignore */
    }
    document.body.removeChild(ta);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(v: unknown): string {
  const s = String(v ?? "");
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ResultsSection({
  results,
  generated,
  template,
  onOpenTemplate,
  onClearTemplate,
  selected,
  onSelectedChange,
}: ResultsSectionProps) {
  const [openMenu, setOpenMenu] = useState<"copy" | "export" | null>(null);
  const toggleRow = (i: number) =>
    onSelectedChange((prev) => {
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
    // O data-dropdown é o contrato com este seletor: sem ele os menus param de fechar
    // no clique fora, em silêncio.
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-dropdown]")) setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const exportRows = () =>
    template
      ? fillTemplate(template, results)
      : [["Nome", "CPF", "Estado"], ...results.map((r) => [r.name, r.cpf, r.uf])];
  const exportName = (ext: string) =>
    template ? `${template.fileName.replace(/\.[^.]+$/, "")}-preenchido.${ext}` : `cpfs.${ext}`;

  // O xlsx tem ~900KB: só é baixado quando alguém exporta de fato.
  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const rows = exportRows();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CPFs");
    XLSX.writeFile(wb, exportName("xlsx"));
    setOpenMenu(null);
  };

  const exportCsv = () => {
    // Excel pt-BR reads ';' as the CSV separator.
    const rows = exportRows().map((r) => r.map(escapeCsv).join(";"));
    const blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, exportName("csv"));
    setOpenMenu(null);
  };

  const copyAndClose = (text: string) => {
    copyText(text);
    setOpenMenu(null);
  };
  const names = results.map((r) => r.name).filter(Boolean);

  const hasResults = generated && results.length > 0;

  return (
    <section id="result-section" aria-labelledby="result-heading" className="mb-0 flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 max-[520px]:flex-col max-[520px]:items-start">
        <div className="flex items-baseline gap-3">
          <h2 id="result-heading" className="m-0 text-[22px] font-semibold text-ink">
            Resultados
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasResults && (
            <div data-dropdown className="relative inline-flex">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={openMenu === "copy"}
                onClick={() => setOpenMenu((m) => (m === "copy" ? null : "copy"))}
                className={`group ${ACTION_BTN}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="flex-none"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                Copiar
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className={CHEVRON}><path d="m6 9 6 6 6-6"></path></svg>
              </button>
              {openMenu === "copy" && (
                <ul role="menu" className={`${MENU} left-0`}>
                  <li
                    role="menuitem"
                    className={MENU_ITEM}
                    onClick={() =>
                      copyAndClose(
                        ["Nome\tCPF\tEstado", ...results.map((r) => `${r.name}\t${r.cpf}\t${r.uf}`)].join("\n")
                      )
                    }
                  >
                    Copiar tabela inteira
                  </li>
                  <li role="menuitem" className={MENU_ITEM} onClick={() => copyAndClose(results.map((r) => r.cpf).join("\n"))}>
                    Copiar todos os CPFs
                  </li>
                  <li
                    role="menuitem"
                    className={MENU_ITEM}
                    aria-disabled={names.length === 0 || undefined}
                    title={names.length === 0 ? "Nenhum nome gerado" : undefined}
                    onClick={() => {
                      if (names.length) copyAndClose(names.join("\n"));
                    }}
                  >
                    Copiar todos os nomes
                  </li>
                </ul>
              )}
            </div>
          )}
          {hasResults && (
            <button type="button" className={ACTION_BTN} onClick={onOpenTemplate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="flex-none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
              Planilha modelo
            </button>
          )}
          {hasResults && (
            <div data-dropdown className="relative inline-flex">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={openMenu === "export"}
                onClick={() => setOpenMenu((m) => (m === "export" ? null : "export"))}
                className={`group ${ACTION_BTN_ACCENT}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="flex-none"><path d="M12 15V3"></path><path d="m7 10 5 5 5-5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                Exportar
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className={CHEVRON}><path d="m6 9 6 6 6-6"></path></svg>
              </button>
              {openMenu === "export" && (
                <ul role="menu" className={`${MENU} right-0`}>
                  <li role="menuitem" className={MENU_ITEM} onClick={exportXlsx}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
                    Exportar <strong>.xlsx</strong>
                  </li>
                  <li role="menuitem" className={MENU_ITEM} onClick={exportCsv}>
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
        <div
          role="status"
          className="mb-3 flex flex-none items-center gap-2 rounded-md border border-line border-l-[3px] border-l-accent bg-accent-soft py-0.5 pr-0.5 pl-3 text-[15px] text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-accent"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            Exportando no layout de <strong>{template.fileName}</strong>
          </span>
          <button
            type="button"
            aria-label="Remover planilha modelo"
            title="Remover modelo"
            onClick={onClearTemplate}
            className={ICON_BUTTON}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="block flex-none"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>
      )}

      {!hasResults && (
        <div className="relative flex flex-col items-center gap-2 rounded-lg border border-line bg-surface px-4 py-8 text-center shadow-[var(--shadow-sm)]">
          <p className="m-0 text-muted">
            Nenhum resultado ainda. Configure os lotes e clique em <strong>Gerar</strong>.
          </p>
        </div>
      )}

      {hasResults && (
        <div className="relative flex min-h-0 w-full min-w-0 flex-[0_1_auto] flex-col overflow-hidden rounded-lg border border-line bg-surface p-0 shadow-[var(--shadow-sm)]">
          <div className="max-w-full min-h-0 w-full min-w-0 flex-[0_1_auto] overflow-auto overscroll-contain bg-surface">
            <table className="w-full table-fixed border-collapse text-[15px] max-[520px]:table-auto">
              <colgroup>
                <col className="w-12 max-[520px]:w-auto" />
                <col className="w-16 max-[520px]:w-auto" />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th aria-label="Seleção" className={`${TH} pr-0 align-middle`}></th>
                  <th className={`${TH} ${NUM}`}>#</th>
                  <th className={TH}>Nome</th>
                  <th className={TH}>
                    <span className="inline-flex items-center gap-1.5">
                      CPF
                      <button
                        ref={copyBtnRef}
                        type="button"
                        aria-label="Copiar CPFs"
                        onClick={() => copyText(results.map((r) => r.cpf).join("\n"))}
                        onMouseEnter={showCopyTooltip}
                        onMouseLeave={hideCopyTooltip}
                        onFocus={showCopyTooltip}
                        onBlur={hideCopyTooltip}
                        className="inline-flex size-[22px] cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-inherit hover:bg-line active:bg-line-strong"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                      </button>
                      {/* Só é montado depois de um hover/focus, então nunca roda no prerender,
                          onde document não existe. Não trocar por estado inicial não-nulo. */}
                      {copyTooltipPos &&
                        createPortal(
                          <div
                            style={{ top: copyTooltipPos.top, left: copyTooltipPos.left }}
                            className="pointer-events-none fixed z-100 -translate-x-1/2 translate-y-[calc(-100%-6px)] rounded-md bg-ink px-2 py-1 text-[12px] leading-none font-medium whitespace-nowrap text-surface"
                          >
                            Copiar CPFs
                          </div>,
                          document.body
                        )}
                    </span>
                  </th>
                  <th className={TH}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={i}
                    aria-selected={selected.has(i)}
                    className="hover:bg-surface-alt aria-selected:bg-accent-soft [&:last-child>td]:border-b-0"
                  >
                    <td className={`${TD} pr-0 align-middle`}>
                      <Checkbox
                        checked={selected.has(i)}
                        label={`Selecionar linha ${i + 1}`}
                        onToggle={() => toggleRow(i)}
                      />
                    </td>
                    <td className={`${TD} ${NUM} font-mono text-[13px] text-faint`}>{i + 1}</td>
                    <td className={TD}>{r.name}</td>
                    <td
                      className={`${TD} font-mono font-medium [font-variant-numeric:tabular-nums] max-[520px]:whitespace-nowrap`}
                    >
                      {r.cpf}
                    </td>
                    <td className={TD}>
                      <span className="inline-flex min-w-[34px] items-center justify-center rounded-md border border-line bg-surface-alt px-1.5 py-0.5 font-mono text-[13px] font-semibold text-ink">
                        {r.uf}
                      </span>
                    </td>
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
