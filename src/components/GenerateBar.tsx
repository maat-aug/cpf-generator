import { SegmentedControl } from './SegmentedControl';

interface GenerateBarProps {
  formatted: boolean;
  onFormattedChange: (formatted: boolean) => void;
  onGenerate: () => void;
}

export function GenerateBar({ formatted, onFormattedChange, onGenerate }: GenerateBarProps) {
  return (
    <div className="card elev-md generate-bar">
      <SegmentedControl
        name="fmt"
        ariaLabel="Formato do CPF"
        value={formatted ? 'formatted' : 'plain'}
        onChange={(v) => onFormattedChange(v === 'formatted')}
        options={[
          { value: 'formatted', label: 'Formatado' },
          { value: 'plain', label: 'Apenas números' },
        ]}
      />
      <button type="button" className="cpf-hover-btn" onClick={onGenerate}>
        <div className="cpf-hover-btn-dot"></div>
        <span className="cpf-hover-btn-label">Gerar</span>
        <div className="cpf-hover-btn-reveal">
          <span>Gerar</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </div>
      </button>
    </div>
  );
}
