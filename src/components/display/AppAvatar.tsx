import clsx from 'clsx';

export interface AppAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
} as const;

export const AppAvatar = ({ src, name, size = 'md', online = false }: AppAvatarProps) => (
  <span
    className={clsx('relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF1FF] font-extrabold text-[#123B8D]', sizeClasses[size])}
    aria-label={name}
  >
    {src ? <img className="size-full object-cover" alt="" src={src} /> : initials(name)}
    <span
      className={clsx('absolute right-0.5 bottom-0.5 size-3 rounded-full border-2 border-white bg-slate-300', online && 'bg-[#22C55E]')}
      aria-hidden
    />
  </span>
);
