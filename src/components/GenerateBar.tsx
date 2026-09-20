import { SegmentedControl } from './SegmentedControl';

interface GenerateBarProps {
  formatted: boolean;
  onFormattedChange: (formatted: boolean) => void;
  onGenerate: () => void;
  /** Selected result rows; when > 0 the button regenerates them instead of generating. */
  regenCount: number;
}

export function GenerateBar({ formatted, onFormattedChange, onGenerate, regenCount }: GenerateBarProps) {
  return (
    <div className="generate-bar">
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
      <button type="button" className="push-btn" onClick={onGenerate}>
        {regenCount ? `Regerar (${regenCount})` : 'Gerar'}
      </button>
    </div>
  );
}
