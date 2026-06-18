import { type ChangeEvent } from 'react';
import { Delete, X } from 'lucide-react';
import clsx from 'clsx';

export interface AppMoneyInputProps {
  value: string;
  currency: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  presets?: string[];
  onChange: (value: string) => void;
}

const defaultPresets = ['1000', '2000', '5000'];
const keypadValues = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const sanitizeMoneyValue = (value: string) => value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

const formatMoney = (value: string, currency: string) => {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const formatPresetMoney = (value: string, currency: string) => `${currency} ${Number(value || 0).toLocaleString()}`;

export const AppMoneyInput = ({
  value,
  currency,
  label = 'Amount',
  error,
  disabled = false,
  presets = defaultPresets,
  onChange,
}: AppMoneyInputProps) => {
  const displayValue = value ? formatMoney(value, currency) : formatMoney('0', currency);

  const updateValue = (nextValue: string) => {
    onChange(sanitizeMoneyValue(nextValue));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateValue(event.target.value);
  };

  const appendDigit = (digit: string) => {
    updateValue(`${value}${digit}`);
  };

  const deleteDigit = () => {
    updateValue(value.slice(0, -1));
  };

  return (
    <div className={clsx('grid gap-4', disabled && 'opacity-70')}>
      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">{label}</span>
        <span className="grid gap-1 rounded-xl border border-[#D6DEEB] bg-[#F8FAFC] p-3 focus-within:border-[#123B8D] focus-within:ring-3 focus-within:ring-[#123B8D]/10">
          <span className="text-xs font-bold uppercase text-[#5A6880]">{currency}</span>
          <input
            className="w-full border-0 bg-transparent p-0 text-3xl font-black leading-10 text-[#0B1F4A] outline-none placeholder:text-[#A8B3C4]"
            disabled={disabled}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            type="text"
            value={value}
            onChange={handleInputChange}
          />
          <span className="text-sm font-semibold text-[#46556E]">{displayValue}</span>
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            className={clsx(
              'min-h-9 rounded-full border px-3.5 text-sm font-black transition enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60',
              value === preset
                ? 'border-[#123B8D] bg-[#123B8D] text-white shadow-[0_10px_20px_rgba(18,59,141,0.16)]'
                : 'border-[#D6DEEB] bg-white text-[#123B8D]',
            )}
            disabled={disabled}
            key={preset}
            type="button"
            onClick={() => updateValue(preset)}
          >
            {formatPresetMoney(preset, currency)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {keypadValues.map((digit) => (
          <button
            className="grid min-h-12 place-items-center rounded-lg border border-[#D6DEEB] bg-white text-lg font-black text-[#0B1F4A] transition enabled:hover:-translate-y-px enabled:hover:border-[#123B8D] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            key={digit}
            type="button"
            onClick={() => appendDigit(digit)}
          >
            {digit}
          </button>
        ))}
        <button
          className="grid min-h-12 place-items-center rounded-lg border border-[#D6DEEB] bg-white text-[#123B8D] transition enabled:hover:-translate-y-px enabled:hover:border-[#123B8D] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || !value}
          type="button"
          onClick={deleteDigit}
          aria-label="Delete digit"
        >
          <Delete className="size-5" aria-hidden />
        </button>
        <button
          className="grid min-h-12 place-items-center rounded-lg border border-[#D6DEEB] bg-white text-[#123B8D] transition enabled:hover:-translate-y-px enabled:hover:border-[#123B8D] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || !value}
          type="button"
          onClick={() => updateValue('')}
          aria-label="Clear amount"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {error && <p className="m-0 text-xs font-semibold text-[#DC2626]">{error}</p>}
    </div>
  );
};
