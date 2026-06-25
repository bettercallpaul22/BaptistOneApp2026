import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
  emptyText?: string;
  filterOptions?: boolean;
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
  searchQuery,
  onSearchChange,
  loading = false,
  emptyText = 'No results found',
  filterOptions = true,
  multi = false,
  disabled = false,
  error,
  renderItem,
  onChange,
}: AppDropdownProps<TOption>) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 300;

    setDropdownStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 9999,
      ...(showAbove
        ? { bottom: `${window.innerHeight - rect.top + 4}px` }
        : { top: `${rect.bottom + 4}px` }),
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('[role="listbox"]')
      ) {
        setOpen(false);
      }
    };
    if (open) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('resize', calculatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, calculatePosition]);

  const resolvedQuery = searchQuery ?? query;
  const values = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  const filtered = useMemo(
    () =>
      filterOptions
        ? options.filter((option) => option.label.toLowerCase().includes(resolvedQuery.toLowerCase()))
        : options,
    [filterOptions, options, resolvedQuery],
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
    <div className="relative grid min-w-0 gap-1.5" ref={containerRef} onKeyDown={handleKeyDown}>
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
        <ChevronDown className={clsx('size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && createPortal(
        <div
          style={dropdownStyle}
          className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_20px_45px_rgba(11,31,74,0.16)]"
        >
          {searchable && (
            <input
              autoFocus
              className="m-2 w-[calc(100%-1rem)] rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#0B1F4A] outline-none placeholder:text-[#8A96AA] focus:border-[#123B8D]"
              placeholder="Search"
              value={resolvedQuery}
              onChange={(event) => {
                const nextQuery = event.target.value;

                if (onSearchChange) {
                  onSearchChange(nextQuery);
                } else {
                  setQuery(nextQuery);
                }

                setActiveIndex(0);
              }}
            />
          )}
          <div className="max-h-[24rem] overflow-auto overscroll-contain p-1.5" role="listbox" aria-multiselectable={multi}>
            {loading && (
              <span className="flex items-center gap-2 p-2 text-xs font-semibold text-[#123B8D]">
                <span className="size-3.5 animate-spin rounded-full border-2 border-[#D9E4F6] border-t-[#123B8D]" aria-hidden />
                Loading
              </span>
            )}
            {filtered.map((option, index) => {
              const selected = values.includes(option.value);

              return (
                <button
                  className={clsx(
                    'relative flex min-h-14 w-full items-start gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 pr-8 text-left text-sm text-[#46556E] hover:bg-[#EAF1FF] hover:text-[#123B8D]',
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
                  <span className="min-w-0 flex-1 overflow-hidden">{renderItem ? renderItem(option, selected) : option.label}</span>
                  {selected && <span className="absolute top-4 right-3 size-1.5 rounded-full bg-[#123B8D]" aria-hidden />}
                </button>
              );
            })}
            {!loading && filtered.length === 0 && <span className="block p-2 text-xs text-[#79859A]">{emptyText}</span>}
          </div>
        </div>,
        document.body,
      )}
      {error && <span className="text-xs text-[#DC2626]">{error}</span>}
    </div>
  );
};
