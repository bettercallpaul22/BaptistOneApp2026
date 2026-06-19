import { useEffect, useMemo, useState } from 'react';
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

const getAvatarSrcCandidates = (src?: string) => {
  if (!src) return [];
  if (src.startsWith('http://')) return [src.replace(/^http:\/\//, 'https://'), src];
  return [src];
};

export const AppAvatar = ({ src, name, size = 'md', online = false }: AppAvatarProps) => {
  const avatarSrcCandidates = useMemo(() => getAvatarSrcCandidates(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const avatarSrc = avatarSrcCandidates[candidateIndex];
  const [imageState, setImageState] = useState<{ src?: string; loaded: boolean; failed: boolean }>({
    loaded: false,
    failed: false,
  });
  const imageLoaded = imageState.src === avatarSrc && imageState.loaded;
  const imageFailed = imageState.src === avatarSrc && imageState.failed;
  const showImage = Boolean(avatarSrc && !imageFailed);
  const showSkeleton = showImage && !imageLoaded;

  useEffect(() => {
    setCandidateIndex(0);
    setImageState({ loaded: false, failed: false });
  }, [src]);

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
          src={avatarSrc}
          onError={() => {
            const nextCandidateIndex = candidateIndex + 1;

            if (avatarSrcCandidates[nextCandidateIndex]) {
              setCandidateIndex(nextCandidateIndex);
              setImageState({ loaded: false, failed: false });
              return;
            }

            setImageState({ src: avatarSrc, loaded: false, failed: true });
          }}
          onLoad={() => setImageState({ src: avatarSrc, loaded: true, failed: false })}
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
