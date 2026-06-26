import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Camera, Gift } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback/AppModal';
import { AppFileUploadField } from '@/components/form';
import { UserProfileImage } from '@/components/display/UserProfileImage';
import type { FileUploadModule } from '@/types/fileUpload';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfileCompletionSectionThunk } from '@/store/thunks/profileThunk';
import type { ProfileCompletion } from '@/types/profile';
import { formatCurrencyValue } from '../utils/profileFormatters';

interface ProfileProgressSummaryProps {
  profile: ProfileCompletion;
  className?: string;
}

export const ProfileProgressSummary = ({
  profile,
  className,
}: ProfileProgressSummaryProps) => {
  const dispatch = useAppDispatch();
  const memberAccount = useAppSelector((state) => state.member.data);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const rewardBucketValue = `${profile.rewardBalance}:${profile.currency}`;
  const previousRewardBucketValue = useRef(rewardBucketValue);
  const [isRewardBucketAnimating, setIsRewardBucketAnimating] = useState(false);
  const sectionEntries = Object.entries(profile.sections);
  const completedSections = sectionEntries.filter(([, section]) => section.completed);
  const incompleteSections = sectionEntries.length - completedSections.length;
  const progress = Math.min(100, Math.max(0, profile.completionScore));
  const rewardBalance = useMemo(
    () => formatCurrencyValue(profile.rewardBalance, profile.currency.charAt(0).toUpperCase() + profile.currency.slice(1)),
    [profile.currency, profile.rewardBalance],
  );

  useEffect(() => {
    if (previousRewardBucketValue.current === rewardBucketValue) return;

    previousRewardBucketValue.current = rewardBucketValue;
    setIsRewardBucketAnimating(true);

    const timeoutId = window.setTimeout(() => setIsRewardBucketAnimating(false), 650);

    return () => window.clearTimeout(timeoutId);
  }, [rewardBucketValue]);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadError(null);
  };

  const displayName =
    memberAccount?.basicProfile?.username ||
    [memberAccount?.basicProfile?.firstName, memberAccount?.basicProfile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'Member';

  const module: FileUploadModule = 'baptistone_member';

  const handleAvatarUpload = async (fileIds: string | string[]) => {
    const avatarFileId = Array.isArray(fileIds) ? fileIds[0] : fileIds;
    setUploadError(null);

    try {
      await dispatch(
        updateProfileCompletionSectionThunk({
          sectionKey: 'personalInformation',
          data: { avatarFileId },
        }),
      ).unwrap();
      closeUploadModal();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : 'Unable to update profile image.';
      setUploadError(message);
    }
  };

  return (
    <div className={clsx('grid gap-5', className)}>
      <div className="grid justify-items-center pt-2">
        <div className="relative">
          <UserProfileImage size="lg" onClick={openUploadModal} />
          <span className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full border-2 border-white bg-[#123B8D] text-white shadow-sm">
            <Camera className="size-3.5" aria-hidden />
          </span>
        </div>
        <AppText variant="h5" className="mt-2 text-center">
          {displayName}
        </AppText>
      </div>

      <AppModal
        open={isUploadModalOpen}
        onClose={closeUploadModal}
        title="Update profile image"
        footer={
          <div className="col-span-2 grid grid-cols-2 gap-3">
            <AppButton fullWidth size="md" variant="outline" onClick={closeUploadModal}>
              Close
            </AppButton>
          </div>
        }
      >
        <div className="grid gap-3">
          {uploadError && (
            <span className="text-xs font-semibold text-[#DC2626]">{uploadError}</span>
          )}
          <AppFileUploadField
            module={module}
            isPublic={false}
            onChange={(fileIds) => {
              if (!fileIds) return;
              void handleAvatarUpload(fileIds);
            }}
          />
        </div>
      </AppModal>

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
                App Rewards
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