import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Pencil, Church, ChevronDown } from 'lucide-react';
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
import { ConsentSection } from './ConsentSection';
import { ProfileProgressSummary } from './ProfileProgressSummary';
import { ProfileSectionEditModal } from './ProfileSectionEditModal';
import { SectionShell } from './SectionShell';

export const ProfileCompletionView = ({ profile }: { profile: ProfileCompletion }) => {
  const navigate = useNavigate();
  const [editingSection, setEditingSection] = useState<{
    key: keyof ProfileCompletion;
    title: string;
  } | null>(null);

  return (
    <div className="grid gap-5">
      <ProfileProgressSummary profile={profile} className="hidden min-[1181px]:grid" />

      <div className="grid gap-4 lg:grid-cols-2">
        {informationGroups.map((group) => {
          const entries = getSectionEntries(profile[group.key]);
          const hiddenFields: Record<string, string[]> = {
            employmentInformation: [
              'school',
              'course'
         
            ],
            personalInformation: [
              'profilePhotoFileId',
              'profilePhotoFile',
              'avatarFile',
              'avatarFileId',
              'languagesSpoken',
              'marritalStatus',
              'displayName',
              'otherName',
              'countryCode',
            ],
            contactInformation: [
              'address',
              'phoneNumber',
              'whatsapp',
              'country',
              'countryCode',
              'emailAddress',
            ],
            salvationInformation: [
          'salvationDate',
            ],
            baptismInformation: [
              'baptismDate',
              'passportPhotoFile',
              'membershipTransferLetterFile',
            ],
            membershipInformation: [
              'skills',
              'availability',
              'ministryUnit',
              'serviceRole',
              'churchId',
              'churchName',
            ],
            emergencyContact: ['fullName'],
            dependants: ['dependants'],
            documents: [
              'passportPhotoFileId',
              'passportPhotoFile',
              'validIdFileId',
              'validIdFile',
              'baptismCertificateFileId',
              'baptismCertificateFile',
              'membershipTransferLetterFileId',
              'membershipTransferLetterFile',
              'otherDocumentFileIds',
              'otherDocumentFiles',
              'otherDocumentUrls',
            ],
          };
          const isFamilyInfo = group.key === 'familyInformation';

          const familyChildren = isFamilyInfo
            ? (() => {
                const fi = profile.familyInformation;
                const nested1 = fi?.familyInformation;
                if (nested1 && typeof nested1 === 'object' && !Array.isArray(nested1)) {
                  const nested2 = (nested1 as Record<string, unknown>).familyInformation;
                  if (nested2 && typeof nested2 === 'object' && !Array.isArray(nested2)) {
                    const children = (nested2 as Record<string, unknown>).children;
                    return Array.isArray(children) ? children : [];
                  }
                }
                return [];
              })()
            : [];

          const visibleEntries = isFamilyInfo
            ? []
            : entries.filter(([key, value]) => {
                if (hiddenFields[group.key]?.includes(key)) return false;
                if (group.key === 'childrenInformation' && Array.isArray(value)) {
                  return value.length > 0;
                }
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
              {isFamilyInfo ? (
                <>
                  {typeof profile.familyInformation?.spouseName === 'string' &&
                    profile.familyInformation.spouseName.trim() && (
                      <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0">
                        <AppText variant="caption" color="textMuted" weight="bold">
                          Spouse Name
                        </AppText>
                        <div className="text-sm font-semibold text-[#0B1F4A]">
                          {profile.familyInformation.spouseName}
                        </div>
                      </div>
                    )}
                  {familyChildren.length > 0 ? (
                    <div className="grid gap-2">
                      {familyChildren.map((child, index) => {
                        const c = child as Record<string, unknown>;
                        const name = typeof c.name === 'string' ? c.name : `Child ${index + 1}`;
                        const gender = typeof c.gender === 'string' && c.gender ? c.gender : null;
                        const age = typeof c.age === 'number' ? c.age : null;
                        const dob = typeof c.dob === 'string' ? c.dob : null;

                        return (
                          <details className="group rounded-lg bg-[#F8FAFC]" key={index}>
                            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-black text-[#0B1F4A]">
                                  {name}
                                  {gender
                                    ? ` · ${gender.charAt(0).toUpperCase() + gender.slice(1)}`
                                    : ''}
                                  {age !== null ? ` · ${age} yrs` : ''}
                                </div>
                              </div>
                              <ChevronDown
                                className="size-4 shrink-0 text-[#123B8D] transition-transform duration-200 group-open:rotate-180"
                                aria-hidden
                              />
                            </summary>
                            <div className="border-t border-[#E7ECF4] px-3 py-2">
                              {dob && (
                                <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-2 last:border-b-0 last:pb-0">
                                  <AppText variant="caption" color="textMuted" weight="bold">
                                    Date of Birth
                                  </AppText>
                                  <div className="text-sm font-semibold text-[#0B1F4A]">
                                    {formatMaybeDate(dob)}
                                  </div>
                                </div>
                              )}
                              {age !== null && (
                                <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-2 last:border-b-0 last:pb-0">
                                  <AppText variant="caption" color="textMuted" weight="bold">
                                    Age
                                  </AppText>
                                  <div className="text-sm font-semibold text-[#0B1F4A]">{age}</div>
                                </div>
                              )}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  ) : (
                    <AppText variant="bodyMedium" color="textMuted">
                      {emptyText}
                    </AppText>
                  )}
                </>
              ) : visibleEntries.length ? (
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

      {/* <SectionShell title="Ministry Information">
        <AppButton
          leftIcon={<Church className="size-4" aria-hidden />}
          onClick={() => navigate(paths.ministries)}
        >
          Go to Ministry
        </AppButton>
      </SectionShell> */}

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

      <ConsentSection profile={profile} />

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
