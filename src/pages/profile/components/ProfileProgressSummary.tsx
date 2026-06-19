import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Camera, Gift } from 'lucide-react';
import { AppText } from '@/components/common';
import { AppAvatar } from '@/components/display';
import type { ProfileCompletion } from '@/types/profile';
import { formatCurrencyValue } from '../utils/profileFormatters';
import { getProfileDisplayName } from '../utils/profileDisplayUtils';

interface ProfileProgressSummaryProps {
  profile: ProfileCompletion;
  className?: string;
  onAvatarClick?: () => void;
}

export const ProfileProgressSummary = ({
  profile,
  className,
  onAvatarClick,
}: ProfileProgressSummaryProps) => {
  const rewardBucketValue = `${profile.rewardBalance}:${profile.currency}`;
  const previousRewardBucketValue = useRef(rewardBucketValue);
  const [isRewardBucketAnimating, setIsRewardBucketAnimating] = useState(false);
  const sectionEntries = Object.entries(profile.sections);
  const completedSections = sectionEntries.filter(([, section]) => section.completed);
  const incompleteSections = sectionEntries.length - completedSections.length;
  const progress = Math.min(100, Math.max(0, profile.completionScore));
  const profileDisplayName = getProfileDisplayName(profile);
  const avatarUrl = (profile.personalInformation?.avatarFile as Record<string, unknown>)?.url as
    | string
    | undefined;
  const rewardBalance = useMemo(
    () => formatCurrencyValue(profile.rewardBalance, profile.currency),
    [profile.currency, profile.rewardBalance],
  );

  useEffect(() => {
    if (previousRewardBucketValue.current === rewardBucketValue) return;

    previousRewardBucketValue.current = rewardBucketValue;
    setIsRewardBucketAnimating(true);

    const timeoutId = window.setTimeout(() => setIsRewardBucketAnimating(false), 650);

    return () => window.clearTimeout(timeoutId);
  }, [rewardBucketValue]);

  return (
    <div className={clsx('grid gap-5', className)}>
      <div className="grid justify-items-center pt-2">
        <button
          type="button"
          className="group relative rounded-full ring-4 ring-white shadow-[0_8px_18px_rgba(11,31,74,0.08)] outline-none transition-transform focus-visible:ring-[#123B8D]/30 active:scale-95"
          aria-label="Update profile avatar"
          onClick={onAvatarClick}
        >
          <AppAvatar name={profileDisplayName} src={avatarUrl} size="lg" />
          <span
            className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-white bg-[#123B8D] text-white shadow-sm"
            aria-hidden
          >
            <Camera className="size-3.5" />
          </span>
        </button>
      </div>

      <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <AppText variant="h5">Profile Progress</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {completedSections.length} completed, {incompleteSections} pending
            </AppText>
          </div>
          <div
            className={`inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#F0D37A] bg-[#FFF8E4] px-3 text-[#0B1F4A] shadow-[0_8px_18px_rgba(212,160,23,0.12)] ${
              isRewardBucketAnimating ? 'animate-[reward-bucket-pop_650ms_ease-out_both]' : ''
            }`}
            aria-live="polite"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#D4A017] text-white">
              <Gift className="size-4" aria-hidden />
            </span>
            <span className="grid gap-0.5">
              <span className="text-[0.65rem] leading-none font-black tracking-[0.08em] text-[#7C6517] uppercase">
                Balance
              </span>
              <span className="max-w-32 truncate text-sm leading-4 font-black">
                {rewardBalance}
              </span>
            </span>
          </div>
        </div>
        <div className="relative h-8 overflow-hidden rounded-full bg-[#EAF1FF]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#D4A017]"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-0 grid place-items-center text-sm font-black text-[#0B1F4A]">
            {profile.completionScore}%
          </span>
        </div>
      </section>
    </div>
  );
};
