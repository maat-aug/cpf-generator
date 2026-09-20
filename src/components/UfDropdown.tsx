import { useEffect, useRef, useState } from "react";
import { UF_OPTIONS, ufLabel } from "@/lib/cpf";

type UfDropdownProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
};

export function UfDropdown({ value, onChange }: UfDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div className="relative block" ref={rootRef}>
      <label className="mb-1.5 block text-[14px] font-semibold text-muted">Estado</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-3 text-left text-[16px] text-ink transition-[border-color,box-shadow] duration-120 hover:border-faint focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent-soft focus-visible:outline-none"
      >
        <span>{ufLabel(value)}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-none text-muted transition-transform duration-[160ms] group-aria-expanded:rotate-180"
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 m-0 max-h-[280px] list-none overflow-auto rounded-md border border-line-strong bg-surface p-1 shadow-[var(--shadow-md)]"
        >
          {UF_OPTIONS.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="cursor-pointer rounded-md px-2.5 py-[7px] text-[15px] hover:bg-accent-soft hover:text-accent aria-selected:bg-accent-soft aria-selected:font-semibold aria-selected:text-accent"
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
