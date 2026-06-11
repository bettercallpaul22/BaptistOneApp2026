import clsx from 'clsx';

export interface AppLoaderProps {
  variant?: 'spinner' | 'skeleton' | 'page';
  label?: string;
  className?: string;
}

export const AppLoader = ({ variant = 'spinner', label = 'Loading', className }: AppLoaderProps) => {
  if (variant === 'skeleton') {
    return <div className={clsx('min-h-20 animate-pulse rounded-xl bg-slate-100', className)} aria-label={label} />;
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center gap-2.5 text-sm font-bold text-[#123B8D]',
        variant === 'page' && 'min-h-screen w-full',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="size-6 animate-spin rounded-full border-[3px] border-[#D9E4F6] border-t-[#123B8D]" />
      <span>{label}</span>
    </div>
  );
};
