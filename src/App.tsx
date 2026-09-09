import { useRef, useState } from 'react';
import type { Lot, ResultRow } from './types';
import { clampQty, generateCpfForUf, generateName } from './lib/cpf';
import { WavesBackground } from './components/WavesBackground';
import { LotCard } from './components/LotCard';
import { GenerateBar } from './components/GenerateBar';
import { ResultsSection } from './components/ResultsSection';
import { ImportModal } from './components/ImportModal';

let nextLotId = 1;
function makeLot(): Lot {
  return { id: nextLotId++, qty: 1, uf: 'ALEATORIO', genName: false, nameMode: 'aleatorio', prefix: '' };
}

export function App() {
  const [lots, setLots] = useState<Lot[]>(() => [makeLot()]);
  const [formatted, setFormatted] = useState(true);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [generated, setGenerated] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

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
        const name = lot.genName ? generateName(lot.nameMode === 'prefixo' ? lot.prefix : '') : '—';
        out.push({ name, cpf, uf });
      }
    }
    setResults(out);
    setGenerated(true);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="dark-theme">
      <WavesBackground />

      <div className="page">
        <main className="container">
          <header className="page-header">
            <h1>Gerador de CPFs</h1>
            <p className="page-subtitle">Gere CPFs válidos e em lotes, com estado de origem controlado por você.</p>
          </header>

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

          <div id="generate-bar-section">
            <GenerateBar formatted={formatted} onFormattedChange={setFormatted} onGenerate={onGenerate} />
          </div>

          <div ref={resultRef}>
            <ResultsSection results={results} generated={generated} onOpenImport={() => setImportOpen(true)} />
          </div>
        </main>
      </div>

      <ImportModal
        open={importOpen}
        formatted={formatted}
        onClose={() => setImportOpen(false)}
        onImported={(rows) => { setResults(rows); setGenerated(true); }}
      />
    </div>
  );
}
