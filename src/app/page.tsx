"use client";

import { useEffect, useRef, useState } from "react";
import type { Lot, ResultRow } from "@/types";
import type { Template } from "@/lib/template";
import { clampQty, generateCpfForUf, generateName, regenerateCpf } from "@/lib/cpf";
import { LotCard } from "@/components/LotCard";
import { GenerateBar } from "@/components/GenerateBar";
import { ResultsSection } from "@/components/ResultsSection";
import { ImportModal } from "@/components/ImportModal";
import { SegmentedControl } from "@/components/SegmentedControl";

type View = "lotes" | "resultados";

let nextLotId = 1;
function makeLot(): Lot {
  return { id: nextLotId++, qty: 1, uf: "ALEATORIO", genName: false, nameMode: "aleatorio", prefix: "" };
}

export default function Page() {
  const [lots, setLots] = useState<Lot[]>(() => [makeLot()]);
  const [formatted, setFormatted] = useState(true);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [generated, setGenerated] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState<View>("lotes");
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  // Any new results (generate, regenerate) invalidate the selection.
  useEffect(() => setSelected(new Set()), [results]);
  const regenCount = view === "resultados" ? selected.size : 0;
  const containerRef = useRef<HTMLDivElement>(null);

  const updateLot = (id: number, patch: Partial<Lot>) => {
    setLots((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const duplicateLot = (id: number) => {
    setLots((prev) => {
      const lot = prev.find((l) => l.id === id);
      if (!lot) return prev;
      return [...prev, { ...lot, id: nextLotId++ }];
    });
  };

  const removeLot = (id: number) => {
    setLots((prev) => prev.filter((l) => l.id !== id));
  };

  const onGenerate = () => {
    const out: ResultRow[] = [];
    for (const lot of lots) {
      const qty = clampQty(lot.qty);
      for (let i = 0; i < qty; i++) {
        const { cpf, uf } = generateCpfForUf(lot.uf, formatted);
        const name = lot.genName ? generateName(lot.nameMode === "prefixo" ? lot.prefix : "") : "";
        out.push({ name, cpf, uf });
      }
    }
    setResults(out);
    setGenerated(true);
    setView("resultados");
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Swap only the CPF of the chosen rows (same UF and mask).
  const regenerateRows = (indices: number[]) => {
    const pick = new Set(indices);
    setResults(results.map((r, i) => (pick.has(i) ? { ...r, cpf: regenerateCpf(r.cpf, r.uf) } : r)));
  };

  const isResults = view === "resultados";

  return (
    <div className={`relative ${isResults ? "h-dvh min-h-0 overflow-hidden" : "min-h-screen"}`}>
      <main
        ref={containerRef}
        className={`mx-auto max-w-[880px] px-4 pt-8 pb-24 ${isResults ? "flex h-full flex-col overflow-hidden" : ""}`}
      >
        <header className="mb-6 border-b border-line pb-4">
          <h1 className="m-0 mb-1 text-[clamp(28px,5vw,36px)] leading-[1.2] font-semibold tracking-[-0.01em] text-ink">
            Gerador de CPFs
          </h1>
          <p className="m-0 max-w-[60ch] text-[16px] text-muted">
            Gere CPFs válidos e em lotes, com estado de origem controlado por você.
          </p>
        </header>

        <div className="mb-6 flex">
          <SegmentedControl
            name="view"
            ariaLabel="Seção"
            value={view}
            onChange={(v) => setView(v as View)}
            className="w-full max-w-[420px]"
            optionClassName="flex-1"
            options={[
              { value: "lotes", label: "Configurações" },
              { value: "resultados", label: `Resultados${results.length ? ` (${results.length})` : ""}` },
            ]}
          />
        </div>

        {view === "lotes" && (
          <section className="mb-8" aria-labelledby="lots-heading">
            <h2 id="lots-heading" className="m-0 mb-3 text-[22px] leading-[1.2] font-semibold text-ink">
              Configuração de lotes
            </h2>
            <div>
              {lots.map((lot, idx) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  index={idx}
                  canRemove={lots.length > 1}
                  onChange={(patch) => updateLot(lot.id, patch)}
                  onDuplicate={() => duplicateLot(lot.id)}
                  onRemove={() => removeLot(lot.id)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLots((prev) => [...prev, makeLot()])}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line-strong bg-surface px-4 text-[15px] leading-[1.2] font-semibold text-ink shadow-[var(--shadow-sm)] transition-[background-color,border-color,color] duration-120 hover:bg-surface-alt active:bg-line"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="block flex-none"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
              Adicionar lote
            </button>
          </section>
        )}

        {view === "resultados" && (
          <ResultsSection
            results={results}
            generated={generated}
            selected={selected}
            onSelectedChange={setSelected}
            template={template}
            onOpenTemplate={() => setImportOpen(true)}
            onClearTemplate={() => setTemplate(null)}
          />
        )}

        <div className="fixed bottom-4 left-1/2 z-10 w-max max-w-[calc(100%-2rem)] -translate-x-1/2">
          <GenerateBar
            formatted={formatted}
            onFormattedChange={setFormatted}
            onGenerate={regenCount ? () => regenerateRows([...selected]) : onGenerate}
            regenCount={regenCount}
          />
        </div>
      </main>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onLoaded={setTemplate} />}
    </div>
  );
}
