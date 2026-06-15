import clsx from 'clsx';
import { AppButton } from '@/components/common';
import { AppAvatar } from './AppAvatar';

export interface ProfileCardProps {
  name: string;
  role: string;
  avatarUrl?: string | null;
  className?: string;
  detailsLabel?: string;
  onViewDetails?: () => void;
}

export const ProfileCard = ({ name, role, avatarUrl, className, detailsLabel = 'View details', onViewDetails }: ProfileCardProps) => (
  <article
    className={clsx(
      'flex h-[220px] min-w-0 flex-col items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 pt-4 pb-5 text-center shadow-[0_12px_24px_rgba(212,160,23,0.16)]',
      className,
    )}
  >
    <AppAvatar name={name} src={avatarUrl ?? undefined} size="xl" />
    <div className="grid min-w-0 gap-1">
      <span className="truncate text-sm font-black text-[#0B1F4A]">{name}</span>
      <span className="truncate text-xs font-semibold text-[#5A6880]">{role}</span>
    </div>
    {onViewDetails && (
      <AppButton className="mt-auto mb-1 min-h-8 px-3 text-[11px]" size="sm" onClick={onViewDetails}>
        {detailsLabel}
      </AppButton>
    )}
  </article>
);
