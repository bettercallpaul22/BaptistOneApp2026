import { forwardRef, type InputHTMLAttributes, useId, useState } from 'react';
import clsx from 'clsx';

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ id, label, error, helperText, className, type = 'text', disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    return (
      <label className={clsx('grid gap-1.5 text-[#0B1F4A]', disabled && 'opacity-60')}>
        {label && <span className="text-xs font-bold">{label}</span>}
        <span
          className={clsx(
            'flex min-h-11 items-center rounded-lg border border-[#E5E7EB] bg-white transition focus-within:border-[#123B8D] focus-within:ring-4 focus-within:ring-[#123B8D]/10',
            error && 'border-[#DC2626]',
            className,
          )}
        >
          <input
            ref={ref}
            id={inputId}
            className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-3 text-sm text-[#0B1F4A] outline-none placeholder:text-[#8A96AA]"
            type={resolvedType}
            aria-invalid={Boolean(error)}
            aria-describedby={error || helperText ? `${inputId}-message` : undefined}
            disabled={disabled}
            {...props}
          />
          {isPassword && (
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="shrink-0 border-0 bg-transparent px-3.5 text-xs font-bold text-[#123B8D]"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={disabled}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </span>
        {(error || helperText) && (
          <span id={`${inputId}-message`} className={clsx('text-xs text-[#79859A]', error && 'text-[#DC2626]')}>
            {error ?? helperText}
          </span>
        )}
      </label>
    );
  },
);

AppInput.displayName = 'AppInput';
