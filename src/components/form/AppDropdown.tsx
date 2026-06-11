import { type ReactNode, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface AppDropdownProps<TOption extends DropdownOption = DropdownOption> {
  label?: string;
  options: TOption[];
  value?: string | string[];
  placeholder?: string;
  searchable?: boolean;
  multi?: boolean;
  disabled?: boolean;
  error?: string;
  renderItem?: (option: TOption, selected: boolean) => ReactNode;
  onChange?: (value: string | string[]) => void;
}

export const AppDropdown = <TOption extends DropdownOption>({
  label,
  options,
  value,
  placeholder = 'Select an option',
  searchable = false,
  multi = false,
  disabled = false,
  error,
  renderItem,
  onChange,
}: AppDropdownProps<TOption>) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const values = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );
  const selectedLabel = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label)
    .join(', ');

  const selectOption = (option: TOption) => {
    if (option.disabled) return;

    if (multi) {
      const next = values.includes(option.value)
        ? values.filter((item) => item !== option.value)
        : [...values, option.value];
      onChange?.(next);
      return;
    }

    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === 'Enter' && open && filtered[activeIndex]) {
      event.preventDefault();
      selectOption(filtered[activeIndex]);
    }

    if (event.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="relative grid min-w-0 gap-1.5" onKeyDown={handleKeyDown}>
      {label && <span className="text-xs font-bold text-[#0B1F4A]">{label}</span>}
      <button
        ref={triggerRef}
        className={clsx(
          'flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-left text-[#0B1F4A] focus-visible:border-[#123B8D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#123B8D]/10',
          error && 'border-[#DC2626]',
        )}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((state) => !state)}
      >
        <span className={clsx('min-w-0 truncate', !selectedLabel && 'text-[#8A96AA]')}>{selectedLabel || placeholder}</span>
        <span aria-hidden>{open ? '^' : 'v'}</span>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+0.375rem)] right-0 left-0 z-20 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_20px_45px_rgba(11,31,74,0.16)]">
          {searchable && (
            <input
              autoFocus
              className="m-2 w-[calc(100%-1rem)] rounded-lg border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#123B8D]"
              placeholder="Search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
            />
          )}
          <div className="max-h-60 overflow-auto p-1.5" role="listbox" aria-multiselectable={multi}>
            {filtered.map((option, index) => {
              const selected = values.includes(option.value);

              return (
                <button
                  className={clsx(
                    'flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-2.5 text-left text-[#46556E] hover:bg-[#EAF1FF] hover:text-[#123B8D]',
                    selected && 'font-bold',
                    index === activeIndex && 'bg-[#EAF1FF] text-[#123B8D]',
                  )}
                  disabled={option.disabled}
                  key={option.value}
                  role="option"
                  aria-selected={selected}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {renderItem ? renderItem(option, selected) : option.label}
                  {selected && <span className="size-1.5 rounded-full bg-[#123B8D]" aria-hidden />}
                </button>
              );
            })}
            {filtered.length === 0 && <span className="block p-2 text-xs text-[#79859A]">No results found</span>}
          </div>
        </div>
      )}
      {error && <span className="text-xs text-[#DC2626]">{error}</span>}
    </div>
  );
};
