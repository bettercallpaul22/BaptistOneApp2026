import { useState } from 'react';
import clsx from 'clsx';

export interface AppAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  xl: 'size-20 text-2xl',
} as const;

export const AppAvatar = ({ src, name, size = 'md', online = false }: AppAvatarProps) => {
  const [imageState, setImageState] = useState<{ src?: string; loaded: boolean; failed: boolean }>({
    loaded: false,
    failed: false,
  });
  const imageLoaded = imageState.src === src && imageState.loaded;
  const imageFailed = imageState.src === src && imageState.failed;
  const showImage = Boolean(src && !imageFailed);
  const showSkeleton = showImage && !imageLoaded;

  return (
    <span
      className={clsx(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF1FF] font-extrabold text-[#123B8D]',
        sizeClasses[size],
      )}
      aria-label={name}
    >
      {showSkeleton && <span className="absolute inset-0 animate-pulse bg-[#DCE7FA]" aria-hidden />}
      {showImage ? (
        <img
          className={clsx('size-full object-cover transition-opacity duration-200', imageLoaded ? 'opacity-100' : 'opacity-0')}
          alt=""
          src={src}
          onError={() => setImageState({ src, loaded: false, failed: true })}
          onLoad={() => setImageState({ src, loaded: true, failed: false })}
        />
      ) : (
        initials(name)
      )}
      <span
        className={clsx('absolute right-0.5 bottom-0.5 size-3 rounded-full border-2 border-white bg-slate-300', online && 'bg-[#22C55E]')}
        aria-hidden
      />
    </span>
  );
};
