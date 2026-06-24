import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Pencil, Church } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { paths } from '@/routes/paths';
import type { ProfileCompletion } from '@/types/profile';
import { emptyText, informationGroups } from '../config/profileConfig';
import { formatLabel, formatMaybeDate } from '../utils/profileFormatters';
import {
  getSectionEntries,
  isEmptyValue,
  renderInformationEntry,
} from '../utils/profileDisplayUtils';
import { ProfileProgressSummary } from './ProfileProgressSummary';
import { ProfileSectionEditModal } from './ProfileSectionEditModal';
import { SectionShell } from './SectionShell';

export const ProfileCompletionView = ({
  profile,
}: {
  profile: ProfileCompletion;
}) => {
  const navigate = useNavigate();
  const [editingSection, setEditingSection] = useState<{
    key: keyof ProfileCompletion;
    title: string;
  } | null>(null);

  return (
    <div className="grid gap-5">
      <ProfileProgressSummary
        profile={profile}
        className="hidden min-[1181px]:grid"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {informationGroups.map((group) => {
          const entries = getSectionEntries(profile[group.key]);
          const hiddenFields: Record<string, string[]> = {
            personalInformation: ['profilePhotoFileId', 'profilePhotoFile'],
          };
          const visibleEntries = entries.filter(([key, value]) => {
            if (hiddenFields[group.key]?.includes(key)) return false;
            return !isEmptyValue(value);
          });

          return (
            <SectionShell
              title={group.title}
              action={
                <AppButton
                  leftIcon={<Pencil className="size-3.5" aria-hidden />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingSection({ key: group.key, title: group.title })}
                >
                  Update
                </AppButton>
              }
              key={String(group.key)}
            >
              {visibleEntries.length ? (
                <div className="grid gap-3">
                  {visibleEntries.map(([key, value]) => renderInformationEntry(key, value))}
                </div>
              ) : (
                <AppText variant="bodyMedium" color="textMuted">
                  {emptyText}
                </AppText>
              )}
            </SectionShell>
          );
        })}
      </div>

      <SectionShell title="Ministry Information">
        <AppButton
          leftIcon={<Church className="size-4" aria-hidden />}
          onClick={() => navigate(paths.ministries)}
        >
          Go to Ministry
        </AppButton>
      </SectionShell>

      <SectionShell title="Rewards">
        {profile.rewards.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.rewards.map((reward) => (
              <div className="grid gap-2 rounded-lg border border-[#EEF2F7] p-3" key={reward.id}>
                <div className="flex items-center gap-2">
                  <Gift className="size-4 text-[#D4A017]" aria-hidden />
                  <AppText variant="bodyMedium" weight="bold">
                    {reward.points} {reward.currency}
                  </AppText>
                </div>
                <AppText variant="bodySmall" color="textSecondary">
                  {formatLabel(reward.sectionKey)} - {formatLabel(reward.reason)}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {formatMaybeDate(reward.createdAt)}
                </AppText>
              </div>
            ))}
          </div>
        ) : (
          <AppText variant="bodyMedium" color="textMuted">
            {emptyText}
          </AppText>
        )}
      </SectionShell>

      {editingSection && (
        <ProfileSectionEditModal
          open
          sectionKey={editingSection.key}
          sectionTitle={editingSection.title}
          sectionData={profile[editingSection.key]}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
};
