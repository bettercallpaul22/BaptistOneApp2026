import { forwardRef, type ChangeEvent, type InputHTMLAttributes, useId, useState } from 'react';
import clsx from 'clsx';

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  lowercase?: boolean;
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ id, label, error, helperText, className, type = 'text', disabled, value, defaultValue, onChange, lowercase = false, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');

    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    // Determine if there's a value — works for both controlled and uncontrolled
    const hasValue = value !== undefined
      ? String(value).length > 0
      : String(internalValue).length > 0;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (lowercase) {
        e.target.value = e.target.value.toLowerCase();
      }

      if (value === undefined) setInternalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <label className={clsx('grid gap-1', disabled && 'opacity-60')}>
        {label && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
            {label}
          </span>
        )}
        <span
          className={clsx(
            'flex min-h-11 items-center overflow-hidden rounded-[10px] border-[1.5px] bg-white transition-all duration-150',
            'focus-within:border-[#123B8D] focus-within:ring-3 focus-within:ring-[#123B8D]/10',
            error
              ? 'border-[#DC2626] focus-within:border-[#DC2626] focus-within:ring-[#DC2626]/10'
              : hasValue
              ? 'border-[#9BAAC0]'
              : 'border-[#D5DCE8]',
            className,
          )}
        >
            <input
              ref={ref}
              id={inputId}
            className="min-w-0 flex-1 self-stretch border-0 bg-transparent px-3.5 py-2.5 text-sm text-[#0B1F4A] outline-none placeholder:text-[#A8B3C4]"
            type={resolvedType}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={error || helperText ? `${inputId}-message` : undefined}
            disabled={disabled}
            onChange={handleChange}
            {...props}
          />
          {isPassword && (
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="shrink-0 border-0 bg-transparent px-3.5 text-[11px] font-bold tracking-wide text-[#123B8D] transition-opacity hover:opacity-70"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={disabled}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </span>
        {(error || helperText) && (
          <span
            id={`${inputId}-message`}
            className={clsx(
              'mt-0.5 text-[11.5px]',
              error ? 'text-[#DC2626]' : 'text-[#8A96AA]',
            )}
          >
            {error ?? helperText}
          </span>
        )}
      </label>
    );
  },
);

AppInput.displayName = 'AppInput';
