import clsx from 'clsx';

export interface AppImageProps {
  src?: string | null;
  alt?: string | null;
  variant?: 'square' | 'circular';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'size-16',
  md: 'size-24',
  lg: 'size-36',
  full: 'h-40 w-full',
} as const;

const variantClasses = {
  square: 'rounded-lg',
  circular: 'rounded-full',
} as const;

export const AppImage = ({ src, alt, variant = 'square', size = 'md', className }: AppImageProps) => (
  <span
    className={clsx(
      'inline-grid shrink-0 place-items-center overflow-hidden border border-[#E5E7EB] bg-[#F8FAFC] text-xs font-bold text-[#6B7890]',
      sizeClasses[size],
      variantClasses[variant],
      className,
    )}
  >
    {src ? <img className="size-full object-cover" alt={alt ?? ''} src={src} /> : 'No image'}
  </span>
);
