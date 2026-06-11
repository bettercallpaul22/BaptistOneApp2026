import { type ButtonHTMLAttributes, memo, type ReactNode } from 'react';
import clsx from 'clsx';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<AppButtonVariant, string> = {
  primary: 'bg-[#123B8D] text-white shadow-[0_12px_24px_rgba(18,59,141,0.18)]',
  secondary: 'bg-[#D4A017] text-[#0B1F4A]',
  outline: 'border-[#D6DEEB] bg-white text-[#123B8D]',
  ghost: 'bg-transparent text-[#123B8D]',
  danger: 'bg-[#DC2626] text-white',
};

const sizeClasses: Record<AppButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-xs',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-[3.125rem] px-6 text-base',
};

export const AppButton = memo(
  ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    type = 'button',
    ...props
  }: AppButtonProps) => (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#123B8D]/20 disabled:cursor-not-allowed disabled:opacity-65 enabled:hover:-translate-y-px',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : leftIcon}
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
      {!loading && rightIcon}
    </button>
  ),
);

AppButton.displayName = 'AppButton';
