import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export interface AppDatePickerProps {
  label?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange?: (value: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const formatDateValue = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const parseDateValue = (value: string): { year: number; month: number; day: number } | null => {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
};

const formatDisplayDate = (value: string): string => {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  const { year, month, day } = parsed;
  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const AppDatePicker = ({
  label,
  value,
  placeholder = 'Select date',
  disabled = false,
  error,
  onChange,
}: AppDatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parseDateValue(value ?? '');
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]); // use `value` not `parsed` to avoid infinite loop

  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 340;

    setDropdownStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      width: '280px',
      zIndex: 9999,
      ...(showAbove
        ? { bottom: `${window.innerHeight - rect.top + 4}px` }
        : { top: `${rect.bottom + 4}px` }),
    });
  }, []);

  useEffect(() => {
    if (open) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
    }
    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [open, calculatePosition]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; month: number; year: number; outsideMonth: boolean }> = [];
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: prevMonth, year: prevYear, outsideMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: viewMonth, year: viewYear, outsideMonth: false });
    }
    const remaining = 42 - days.length;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, month: nextMonth, year: nextYear, outsideMonth: true });
    }
    return days;
  }, [viewYear, viewMonth, firstDay, daysInMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange?.(formatDateValue(today.getFullYear(), today.getMonth(), today.getDate()));
    setOpen(false);
  };

  const selectDate = (day: number, month: number, year: number) => {
    onChange?.(formatDateValue(year, month, day));
    setOpen(false);
  };

  const clearDate = () => {
    onChange?.('');
    setOpen(false);
  };

  const isSelected = (day: number, month: number, year: number) =>
    parsed?.day === day && parsed?.month === month && parsed?.year === year;

  const isToday = (day: number, month: number, year: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const displayValue = value ? formatDisplayDate(value) : '';

  const yearRange = useMemo(() => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 100; y <= currentYear + 10; y++) years.push(y);
    return years;
  }, []);

  return (
    <div className="relative grid gap-1" ref={containerRef}>
      {label && (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
          {label}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex min-h-11 items-center justify-between rounded-[10px] border-[1.5px] bg-white px-3.5 py-2.5 text-left text-sm transition-all duration-150',
          error
            ? 'border-[#DC2626] focus-within:border-[#DC2626] focus-within:ring-[#DC2626]/10'
            : open
            ? 'border-[#123B8D] ring-3 ring-[#123B8D]/10'
            : 'border-[#D5DCE8] hover:border-[#123B8D]',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span className={clsx('text-sm', displayValue ? 'text-[#0B1F4A]' : 'text-[#A8B3C4]')}>
          {displayValue || placeholder}
        </span>
        <Calendar className="size-4 shrink-0 text-[#5A6880]" aria-hidden />
      </button>

      {open && createPortal(
        <>
          {/* Invisible overlay — clicking outside closes the picker cleanly */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />
          {/* Calendar dropdown sits above the overlay */}
          <div
            style={dropdownStyle}
            className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_20px_45px_rgba(11,31,74,0.16)]"
          >
            <div className="flex items-center justify-between border-b border-[#EEF2F7] px-3 py-2">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="rounded-lg p-1 text-[#5A6880] hover:bg-[#EAF1FF] hover:text-[#123B8D]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-[#0B1F4A]">
                  {MONTHS[viewMonth]}
                </span>
                <button
                  type="button"
                  onClick={() => setShowYearPicker((s) => !s)}
                  className="rounded-lg px-1.5 py-0.5 text-sm font-semibold text-[#123B8D] hover:bg-[#EAF1FF]"
                >
                  {viewYear}
                </button>
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-lg p-1 text-[#5A6880] hover:bg-[#EAF1FF] hover:text-[#123B8D]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {showYearPicker && (
              <div className="max-h-48 overflow-y-auto border-b border-[#EEF2F7] px-3 py-2">
                <div className="grid grid-cols-4 gap-1">
                  {yearRange.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setViewYear(year);
                        setShowYearPicker(false);
                      }}
                      className={clsx(
                        'rounded-lg px-2 py-1.5 text-sm transition-colors',
                        year === viewYear
                          ? 'bg-[#123B8D] font-semibold text-white'
                          : 'text-[#0B1F4A] hover:bg-[#EAF1FF] hover:text-[#123B8D]',
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-7 gap-0.5 px-3 pt-2">
              {DAYS.map((day) => (
                <span
                  key={day}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#8A96AA]"
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 p-3 pt-1">
              {calendarDays.map((item, index) => {
                const selected = isSelected(item.day, item.month, item.year);
                const todayMarker = isToday(item.day, item.month, item.year);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectDate(item.day, item.month, item.year)}
                    className={clsx(
                      'flex size-8 items-center justify-center rounded-lg text-sm transition-colors',
                      item.outsideMonth && 'text-[#C4CCD9]',
                      !item.outsideMonth && !selected && !todayMarker && 'text-[#0B1F4A] hover:bg-[#EAF1FF] hover:text-[#123B8D]',
                      selected && 'bg-[#123B8D] font-semibold text-white',
                      !selected && todayMarker && 'font-semibold text-[#123B8D] ring-1 ring-[#123B8D]',
                    )}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-[#EEF2F7] px-3 py-2">
              <button
                type="button"
                onClick={clearDate}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-[#123B8D] hover:bg-[#EAF1FF]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-[#123B8D] hover:bg-[#EAF1FF]"
              >
                Today
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}

      {error && <span className="text-xs text-[#DC2626]">{error}</span>}
    </div>
  );
};