import { useState } from 'react';
import type { Lot } from '../types';
import { MAX_QTY_PER_LOT, clampQty } from '../lib/cpf';
import { SegmentedControl } from './SegmentedControl';
import { UfDropdown } from './UfDropdown';

interface LotCardProps {
  lot: Lot;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<Lot>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function LotCard({ lot, index, canRemove, onChange, onDuplicate, onRemove }: LotCardProps) {
  const [qtyInput, setQtyInput] = useState(String(lot.qty));
  const modeLabelId = `mode-label-${lot.id}`;

  return (
    <div className="card elev-sm lot-card">
      <div className="lot-card-head">
        <div className="card-kicker">Lote {index + 1}</div>
        <div className="lot-card-actions">
          <button
            type="button"
            className="btn btn-ghost btn-icon has-tooltip"
            aria-label="Duplicar lote"
            data-tooltip="Duplicar"
            onClick={onDuplicate}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
          </button>
          {canRemove && (
            <button
              type="button"
              className="btn btn-ghost btn-icon has-tooltip"
              aria-label="Remover lote"
              data-tooltip="Remover"
              onClick={onRemove}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          )}
        </div>
      </div>

      <div className="lot-grid">
        <div className="field">
          <label>Quantidade (máx. {MAX_QTY_PER_LOT} por lote)</label>
          <input
            className="input qty-input"
            type="text"
            inputMode="numeric"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            onBlur={() => {
              const clamped = clampQty(qtyInput);
              setQtyInput(String(clamped));
              onChange({ qty: clamped });
            }}
          />
        </div>

        <UfDropdown value={lot.uf} onChange={(uf) => onChange({ uf })} />
      </div>

      <label className="checkbox-row">
        <button
          type="button"
          className="au-checkbox"
          role="checkbox"
          aria-checked={lot.genName}
          onClick={() => onChange({ genName: !lot.genName })}
        >
          <svg className="au-checkbox-indicator" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
            <path className="au-checkbox-check" strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
          </svg>
        </button>
        Gerar nome
      </label>

      {lot.genName && (
        <div className="lot-name-grid">
          <div className="field">
            <label id={modeLabelId}>Nome</label>
            <SegmentedControl
              name={`name-mode-${lot.id}`}
              ariaLabelledBy={modeLabelId}
              value={lot.nameMode}
              onChange={(v) => onChange({ nameMode: v as Lot['nameMode'] })}
              options={[
                { value: 'aleatorio', label: 'Aleatório' },
                { value: 'prefixo', label: 'Com prefixo' },
              ]}
            />
          </div>
          <div className="field field-prefix">
            <label>Prefixo do nome</label>
            <input
              className="input"
              type="text"
              placeholder="Ex: Matheus"
              value={lot.prefix}
              disabled={lot.nameMode !== 'prefixo'}
              onChange={(e) => onChange({ prefix: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
