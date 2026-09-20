import { useEffect, useRef, useState } from 'react';
import type { Lot, ResultRow } from './types';
import type { Template } from './lib/template';
import { clampQty, generateCpfForUf, generateName, regenerateCpf } from './lib/cpf';
import { LotCard } from './components/LotCard';
import { GenerateBar } from './components/GenerateBar';
import { ResultsSection } from './components/ResultsSection';
import { ImportModal } from './components/ImportModal';
import { SegmentedControl } from './components/SegmentedControl';

type View = 'lotes' | 'resultados';

let nextLotId = 1;
function makeLot(): Lot {
  return { id: nextLotId++, qty: 1, uf: 'ALEATORIO', genName: false, nameMode: 'aleatorio', prefix: '' };
}

export function App() {
  const [lots, setLots] = useState<Lot[]>(() => [makeLot()]);
  const [formatted, setFormatted] = useState(true);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [generated, setGenerated] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState<View>('lotes');
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  // Any new results (generate, regenerate) invalidate the selection.
  useEffect(() => setSelected(new Set()), [results]);
  const regenCount = view === 'resultados' ? selected.size : 0;
  const containerRef = useRef<HTMLDivElement>(null);

  const updateLot = (id: number, patch: Partial<Lot>) => {
    setLots(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  };

  const duplicateLot = (id: number) => {
    setLots(prev => {
      const lot = prev.find(l => l.id === id);
      if (!lot) return prev;
      return [...prev, { ...lot, id: nextLotId++ }];
    });
  };

  const removeLot = (id: number) => {
    setLots(prev => prev.filter(l => l.id !== id));
  };

  const onGenerate = () => {
    const out: ResultRow[] = [];
    for (const lot of lots) {
      const qty = clampQty(lot.qty);
      for (let i = 0; i < qty; i++) {
        const { cpf, uf } = generateCpfForUf(lot.uf, formatted);
        const name = lot.genName ? generateName(lot.nameMode === 'prefixo' ? lot.prefix : '') : '';
        out.push({ name, cpf, uf });
      }
    }
    setResults(out);
    setGenerated(true);
    setView('resultados');
    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Swap only the CPF of the chosen rows (same UF and mask).
  const regenerateRows = (indices: number[]) => {
    const pick = new Set(indices);
    setResults(results.map((r, i) => (pick.has(i) ? { ...r, cpf: regenerateCpf(r.cpf, r.uf) } : r)));
  };

  return (
    <div className={`app ${view === 'resultados' ? 'results-view' : ''}`}>
      <div className="page">
        <main className="container" ref={containerRef}>
          <header className="page-header">
            <h1>Gerador de CPFs</h1>
            <p className="page-subtitle">Gere CPFs válidos e em lotes, com estado de origem controlado por você.</p>
          </header>

          <div className="view-switch">
            <SegmentedControl
              name="view"
              ariaLabel="Seção"
              value={view}
              onChange={(v) => setView(v as View)}
              options={[
                { value: 'lotes', label: 'Configurações' },
                { value: 'resultados', label: `Resultados${results.length ? ` (${results.length})` : ''}` },
              ]}
            />
          </div>

          {view === 'lotes' && (
            <section className="panel" aria-labelledby="lots-heading">
              <h2 id="lots-heading" className="panel-heading">Configuração de lotes</h2>
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
              <button type="button" className="btn btn-secondary" onClick={() => setLots(prev => [...prev, makeLot()])}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                Adicionar lote
              </button>
            </section>
          )}

          {view === 'resultados' && (
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

          <div id="generate-bar-section">
            <GenerateBar formatted={formatted} onFormattedChange={setFormatted} onGenerate={regenCount ? () => regenerateRows([...selected]) : onGenerate} regenCount={regenCount} />
          </div>
        </main>
      </div>

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onLoaded={setTemplate}
        />
      )}
    </div>
  );
}
