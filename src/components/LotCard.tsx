import { useState } from "react";
import type { Lot } from "@/types";
import { MAX_QTY_PER_LOT, clampQty } from "@/lib/cpf";
import { Checkbox } from "@/components/Checkbox";
import { SegmentedControl } from "@/components/SegmentedControl";
import { UfDropdown } from "@/components/UfDropdown";

type LotCardProps = {
  readonly lot: Lot;
  readonly index: number;
  readonly canRemove: boolean;
  readonly onChange: (patch: Partial<Lot>) => void;
  readonly onDuplicate: () => void;
  readonly onRemove: () => void;
};

const ICON_BUTTON =
  "has-tooltip inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-muted transition-[background-color,border-color,color] duration-120 enabled:hover:bg-surface-alt enabled:hover:text-ink enabled:active:bg-line disabled:cursor-not-allowed disabled:opacity-45";

const INPUT =
  "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[16px] text-ink transition-[border-color,box-shadow] duration-120 placeholder:text-faint hover:border-faint focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent-soft focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong";

export function LotCard({ lot, index, canRemove, onChange, onDuplicate, onRemove }: LotCardProps) {
  const [qtyInput, setQtyInput] = useState(String(lot.qty));
  const modeLabelId = `mode-label-${lot.id}`;

  return (
    <div className="relative mb-3 flex flex-col gap-2 rounded-lg border border-line bg-surface px-6 pt-4 pb-6 shadow-[var(--shadow-sm)]">
      <div className="-mx-6 mb-4 flex items-center justify-between border-b border-line pr-3 pb-3 pl-6">
        <div className="text-[15px] font-semibold text-ink">Lote {index + 1}</div>
        <div className="flex gap-1">
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label="Duplicar lote"
            data-tooltip="Duplicar"
            onClick={onDuplicate}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="block flex-none"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            aria-label="Remover lote"
            data-tooltip="Remover"
            disabled={!canRemove}
            onClick={onRemove}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="block flex-none"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="block">
          <label className="mb-1.5 block text-[14px] font-semibold text-muted">
            Quantidade (máx. {MAX_QTY_PER_LOT} por lote)
          </label>
          <input
            className={`${INPUT} font-mono [font-variant-numeric:tabular-nums]`}
            type="text"
            inputMode="numeric"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            onBlur={() => {
              const clamped = clampQty(qtyInput);
              setQtyInput(String(clamped));
              onChange({ qty: clamped });
            }}
          />
        </div>

        <UfDropdown value={lot.uf} onChange={(uf) => onChange({ uf })} />
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-[16px] font-semibold">
        <Checkbox checked={lot.genName} onToggle={() => onChange({ genName: !lot.genName })} />
        Gerar nome
      </label>

      {lot.genName && (
        <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 rounded-md bg-surface-alt p-3">
          <div className="block">
            <label id={modeLabelId} className="mb-1.5 block text-[14px] font-semibold text-muted">
              Nome
            </label>
            <SegmentedControl
              name={`name-mode-${lot.id}`}
              ariaLabelledBy={modeLabelId}
              value={lot.nameMode}
              onChange={(v) => onChange({ nameMode: v as Lot["nameMode"] })}
              className="w-full"
              optionClassName="flex-1"
              options={[
                { value: "aleatorio", label: "Aleatório" },
                { value: "prefixo", label: "Com prefixo" },
              ]}
            />
          </div>
          <div className="block">
            <label className="mb-1.5 block text-[14px] font-semibold text-muted">Prefixo do nome</label>
            <input
              className={INPUT}
              type="text"
              placeholder="Ex: Matheus"
              value={lot.prefix}
              disabled={lot.nameMode !== "prefixo"}
              onChange={(e) => onChange({ prefix: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
