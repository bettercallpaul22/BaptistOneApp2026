import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface AppScrollableTab {
  value: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

export interface AppScrollableTabsProps {
  tabs: AppScrollableTab[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  fullWidthTabs?: boolean;
}

export const AppScrollableTabs = ({
  tabs,
  value,
  onValueChange,
  ariaLabel = 'Section tabs',
  className,
  fullWidthTabs = false,
}: AppScrollableTabsProps) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const enabledTabs = useMemo(() => tabs.filter((tab) => !tab.disabled), [tabs]);

  useEffect(() => {
    tabRefs.current[value]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();

    const currentIndex = enabledTabs.findIndex((tab) => tab.value === value);
    if (currentIndex === -1) return;

    const lastIndex = enabledTabs.length - 1;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? lastIndex
          : event.key === 'ArrowLeft'
            ? Math.max(0, currentIndex - 1)
            : Math.min(lastIndex, currentIndex + 1);
    const nextTab = enabledTabs[nextIndex];

    if (nextTab) {
      onValueChange(nextTab.value);
      tabRefs.current[nextTab.value]?.focus();
    }
  };

  return (
    <div
      className={clsx(
        'w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <div
        className={clsx(
          'mx-auto flex w-max min-w-full snap-x snap-mandatory border-b border-[#D5DAE6] px-4 sm:px-6',
          fullWidthTabs ? 'gap-0' : 'justify-center gap-8 sm:gap-10 md:gap-12',
        )}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.value === value;

          return (
            <button
              key={tab.value}
              ref={(node) => {
                tabRefs.current[tab.value] = node;
              }}
              className={clsx(
                'relative inline-flex min-h-12 max-w-[11rem] shrink-0 snap-start items-center justify-center gap-2 px-0 pb-3 pt-2 text-base font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#123B8D]/15 disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-none sm:text-lg',
                fullWidthTabs && 'max-w-none flex-1 px-3',
                active ? 'text-[#0B1F4A]' : 'text-[#8A8BAA] hover:text-[#123B8D]',
              )}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              disabled={tab.disabled}
              title={tab.label}
              onClick={() => onValueChange(tab.value)}
            >
              {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
              <span className="min-w-0 truncate whitespace-nowrap">{tab.label}</span>
              {tab.badge && (
                <span
                  className={clsx(
                    'min-w-4 shrink-0 rounded-full px-1.5 py-px text-center text-[0.625rem] font-black',
                    active ? 'bg-[#D4A017] text-[#0B1F4A]' : 'bg-[#EAF1FF] text-[#123B8D]',
                  )}
                >
                  {tab.badge}
                </span>
              )}
              {active && (
                <span className="absolute right-0 bottom-[-1px] left-0 h-1 rounded-full bg-[#D4A017]" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
