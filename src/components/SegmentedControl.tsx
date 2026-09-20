import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type SegmentedOption = {
  readonly value: string;
  readonly label: string;
};

type SegmentedControlProps = {
  readonly name: string;
  readonly options: readonly [SegmentedOption, SegmentedOption];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly ariaLabel?: string;
  readonly ariaLabelledBy?: string;
  /** Larguras do próprio controle, que antes vinham de regras descendentes no CSS. */
  readonly className?: string;
  readonly optionClassName?: string;
};

export function SegmentedControl({
  name,
  options,
  value,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  className = "",
  optionClassName = "",
}: SegmentedControlProps) {
  const segRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useIsomorphicLayoutEffect(() => {
    const segEl = segRef.current;
    const thumb = thumbRef.current;
    if (!segEl) return;
    // O data-checked é o contrato com este seletor: trocá-lo por classe utilitária
    // faz o thumb parar de se mover sem nenhum erro no console.
    const checked = segEl.querySelector<HTMLElement>('[data-checked="true"]');
    if (!checked) return;
    const instant = firstRender.current;
    firstRender.current = false;
    // See the original vanilla implementation: reading offsetLeft/offsetWidth
    // forces a layout flush that commits the thumb's CSS-fallback position as
    // a real "previous" style, so the very first placement must skip the
    // transition or it visibly animates in from that bogus starting point.
    if (instant && thumb) thumb.style.transition = "none";
    segEl.style.setProperty("--thumb-left", `${checked.offsetLeft}px`);
    segEl.style.setProperty("--thumb-width", `${checked.offsetWidth}px`);
    if (instant && thumb) {
      void thumb.offsetHeight;
      thumb.style.transition = "";
    }
  }, [value]);

  return (
    <div
      className={`relative inline-flex h-11 items-stretch overflow-hidden rounded-md border border-line bg-surface-alt p-[3px] ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      ref={segRef}
    >
      <div className="seg-thumb" ref={thumbRef} />
      {options.map((opt) => (
        <label
          key={opt.value}
          data-checked={opt.value === value}
          className={`relative z-1 inline-flex cursor-pointer items-center justify-center gap-1.5 px-4 text-[15px] font-semibold whitespace-nowrap text-muted transition-colors duration-150 hover:text-ink data-[checked=true]:text-ink has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-2 has-[input:focus-visible]:outline-accent ${optionClassName}`}
        >
          <input
            type="radio"
            name={name}
            checked={opt.value === value}
            onChange={() => onChange(opt.value)}
            className="pointer-events-none absolute size-0 opacity-0"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
