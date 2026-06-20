import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useAppSelector } from '@/store/hooks';

export interface UserProfileImageProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
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

// Module-level cache survives remounts and route changes
const resolvedUrlCache = new Map<string, string | null>();

const getAvatarSrcCandidates = (src?: string): string[] => {
  if (!src) return [];
  const httpsUrl = src.replace(/^http:\/\//, 'https://');
  const httpUrl = src.startsWith('http://') ? src : null;
  return [httpsUrl, ...(httpUrl ? [httpUrl] : [])];
};

const getProfileAvatarUrl = (profileData: unknown) =>
  ((profileData as { personalInformation?: { avatarFile?: { url?: unknown } } } | null)
    ?.personalInformation?.avatarFile?.url as string | undefined) || undefined;

export const UserProfileImage = ({ size = 'md', className }: UserProfileImageProps) => {
  const profileData = useAppSelector((state) => state.profile.data);
  const memberAccount = useAppSelector((state) => state.member.data);
  const authData = useAppSelector((state) => state.auth.authData);
  const user = useAppSelector((state) => state.auth.user);

  const src =
  memberAccount?.basicProfile?.avatar.url ||
    getProfileAvatarUrl(profileData) ||
    authData?.profile?.avatarUrl ||
    undefined;

  const name =
    memberAccount?.basicProfile?.displayName ||
    [memberAccount?.basicProfile?.firstName, memberAccount?.basicProfile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    [authData?.user?.firstName, authData?.user?.lastName].filter(Boolean).join(' ') ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Member';

  const avatarSrcCandidates = useMemo(() => getAvatarSrcCandidates(src), [src]);

  const [candidateIndex, setCandidateIndex] = useState<number>(() => {
    if (!src) return 0;
    const cached = resolvedUrlCache.get(src);
    if (cached === undefined) return 0;          // not yet resolved
    if (cached === null) return -1;              // all candidates failed
    const idx = avatarSrcCandidates.indexOf(cached);
    return idx >= 0 ? idx : 0;
  });

  const [imageState, setImageState] = useState<{ src?: string; loaded: boolean; failed: boolean }>(
    () => {
      if (!src) return { loaded: false, failed: false };
      const cached = resolvedUrlCache.get(src);
      // Pre-seed as loaded if we have a known-good URL — skips skeleton flash on remount
      if (cached) return { src: cached, loaded: true, failed: false };
      return { loaded: false, failed: false };
    },
  );

  const avatarSrc = candidateIndex >= 0 ? avatarSrcCandidates[candidateIndex] : undefined;
  const imageLoaded = imageState.src === avatarSrc && imageState.loaded;
  const imageFailed = imageState.src === avatarSrc && imageState.failed;
  const showImage = Boolean(avatarSrc && !imageFailed);
  const showSkeleton = showImage && !imageLoaded;

  // Only reset state when src URL itself changes (new avatar upload etc.)
  const prevSrcRef = useRef(src);
  useEffect(() => {
    if (prevSrcRef.current === src) return;
    prevSrcRef.current = src;
    setCandidateIndex(0);
    setImageState({ loaded: false, failed: false });
  }, [src]);

  return (
    <span
      className={clsx(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF1FF] font-extrabold text-[#123B8D]',
        sizeClasses[size],
        className,
      )}
      aria-label={name}
    >
      {showSkeleton && <span className="absolute inset-0 animate-pulse bg-[#DCE7FA]" aria-hidden />}
      {showImage ? (
        <img
          className={clsx(
            'size-full object-cover transition-opacity duration-200',
            imageLoaded ? 'opacity-100' : 'opacity-0',
          )}
          alt=""
          src={avatarSrc}
          onError={() => {
            const nextCandidateIndex = candidateIndex + 1;
            if (avatarSrcCandidates[nextCandidateIndex]) {
              setCandidateIndex(nextCandidateIndex);
              setImageState({ loaded: false, failed: false });
              return;
            }
            if (src) resolvedUrlCache.set(src, null);
            setImageState({ src: avatarSrc, loaded: false, failed: true });
          }}
          onLoad={() => {
            if (src && avatarSrc) resolvedUrlCache.set(src, avatarSrc);
            setImageState({ src: avatarSrc, loaded: true, failed: false });
          }}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
};