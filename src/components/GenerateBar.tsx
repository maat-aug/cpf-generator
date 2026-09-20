import { SegmentedControl } from "@/components/SegmentedControl";

type GenerateBarProps = {
  readonly formatted: boolean;
  readonly onFormattedChange: (formatted: boolean) => void;
  readonly onGenerate: () => void;
  /** Selected result rows; when > 0 the button regenerates them instead of generating. */
  readonly regenCount: number;
};

export function GenerateBar({ formatted, onFormattedChange, onGenerate, regenCount }: GenerateBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line-strong bg-surface p-2 shadow-[var(--shadow-md)] max-[520px]:w-full">
      <SegmentedControl
        name="fmt"
        ariaLabel="Formato do CPF"
        value={formatted ? "formatted" : "plain"}
        onChange={(v) => onFormattedChange(v === "formatted")}
        className="max-[520px]:flex-1"
        optionClassName="max-[520px]:flex-1 max-[520px]:px-2"
        options={[
          { value: "formatted", label: "Formatado" },
          { value: "plain", label: "Apenas números" },
        ]}
      />
      <button
        type="button"
        onClick={onGenerate}
        className="h-11 min-w-32 cursor-pointer rounded-md border border-accent bg-accent px-6 text-[16px] font-bold text-on-accent transition-colors duration-100 hover:border-accent-hover hover:bg-accent-hover active:bg-accent-active max-[520px]:min-w-0 max-[520px]:px-4"
      >
        {regenCount ? `Regerar (${regenCount})` : "Gerar"}
      </button>
    </div>
  );
}
