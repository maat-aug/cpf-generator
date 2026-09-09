import { useEffect, useLayoutEffect, useRef } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  name: string;
  options: [SegmentedOption, SegmentedOption];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function SegmentedControl({ name, options, value, onChange, ariaLabel, ariaLabelledBy }: SegmentedControlProps) {
  const checkedIndex = options.findIndex(o => o.value === value);
  const segRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useIsomorphicLayoutEffect(() => {
    const segEl = segRef.current;
    const thumb = thumbRef.current;
    if (!segEl) return;
    const checked = segEl.querySelector<HTMLElement>('.seg-opt.is-checked');
    if (!checked) return;
    const instant = firstRender.current;
    firstRender.current = false;
    // See the original vanilla implementation: reading offsetLeft/offsetWidth
    // forces a layout flush that commits the thumb's CSS-fallback position as
    // a real "previous" style, so the very first placement must skip the
    // transition or it visibly animates in from that bogus starting point.
    if (instant && thumb) thumb.style.transition = 'none';
    segEl.style.setProperty('--thumb-left', `${checked.offsetLeft}px`);
    segEl.style.setProperty('--thumb-width', `${checked.offsetWidth}px`);
    if (instant && thumb) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      thumb.offsetHeight;
      thumb.style.transition = '';
    }
  }, [value]);

  return (
    <div
      className="seg"
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-checked={checkedIndex}
      ref={segRef}
    >
      <div className="seg-thumb" ref={thumbRef} />
      {options.map(opt => (
        <label key={opt.value} className={`seg-opt ${opt.value === value ? 'is-checked' : ''}`}>
          <input
            type="radio"
            name={name}
            checked={opt.value === value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
