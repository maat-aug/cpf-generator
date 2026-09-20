type CheckboxProps = {
  readonly checked: boolean;
  readonly label?: string;
  readonly onToggle: () => void;
};

export function Checkbox({ checked, label, onToggle }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="group inline-flex size-[22px] flex-none cursor-pointer items-center justify-center rounded-[5px] border border-line-strong bg-surface p-0 text-on-accent transition-[background-color,border-color] duration-150 [-webkit-tap-highlight-color:transparent] hover:border-faint aria-checked:border-accent aria-checked:bg-accent"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        aria-hidden="true"
        className="block size-[14px] overflow-visible"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
          className="fill-none [stroke-dasharray:26] [stroke-dashoffset:26] transition-[stroke-dashoffset] duration-[160ms] group-aria-checked:[stroke-dashoffset:0]"
        />
      </svg>
    </button>
  );
}
