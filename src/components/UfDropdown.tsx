import { useEffect, useRef, useState } from 'react';
import { UF_OPTIONS, ufLabel } from '../lib/cpf';

interface UfDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function UfDropdown({ value, onChange }: UfDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div className="field uf-dropdown" ref={rootRef}>
      <label>Estado</label>
      <button
        type="button"
        className="uf-dropdown-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span>{ufLabel(value)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
      </button>
      {open && (
        <ul role="listbox" className="cpf-dropdown-pop">
          {UF_OPTIONS.map(o => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={o.value === value ? 'is-selected' : ''}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
