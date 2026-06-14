import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppAvatar } from '@/components/display';
import { AppStateFeedback } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { familyInviteService } from '@/pages/profile/services/familyInviteService';
import type { UserFamilyMember, UserFamilyResponse } from '@/pages/profile/types/familyInviteTypes';
import { paths } from '@/routes/paths';
import { formatDate } from '@/utils/formatDate';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
};

const formatLinkedDate = (value: string) => {
  try {
    return formatDate(value);
  } catch {
    return value;
  }
};

const getFamilyMemberName = (member: UserFamilyMember) =>
  member.displayName?.trim() || member.username?.trim() || member.email?.trim() || 'Family member';

const getFamilyMemberContact = (member: UserFamilyMember) =>
  [member.contactEmail || member.email, member.contactPhone].filter(Boolean).join(' - ');

const FamilyMembersPage = () => {
  const navigate = useNavigate();
  const [familyData, setFamilyData] = useState<NonNullable<UserFamilyResponse['data']> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = familyData?.members ?? [];

  const fetchFamily = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await familyInviteService.getFamily();
      setFamilyData(response.data ?? null);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Unable to load family members.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchFamily();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchFamily]);

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <div className="flex items-center gap-3">
          <AppButton
            aria-label="Back to family"
            size="sm"
            variant="outline"
            onClick={() => navigate(paths.family)}
          >
            <ArrowLeft className="size-4" aria-hidden />
          </AppButton>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h5">Family members</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {familyData?.family?.name ?? 'Your family'}
            </AppText>
          </div>
        </div>

        <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.06)]">
          {loading && !members.length && (
            <AppStateFeedback state="loading" label="Loading family members" className="min-h-40" />
          )}
          {error && !members.length && (
            <AppStateFeedback
              state="error"
              title="Unable to load members"
              description={error}
              retrying={loading}
              className="min-h-44"
              onRetry={() => void fetchFamily()}
            />
          )}
          {!loading && !error && !members.length && (
            <AppStateFeedback
              state="empty"
              title="No family members yet"
              description="Linked family members will appear here."
              className="min-h-40"
            />
          )}
          {members.map((member) => {
            const name = getFamilyMemberName(member);
            const contact = getFamilyMemberContact(member);

            return (
              <div
                className="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3"
                key={member.memberId}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <AppAvatar name={name} src={member.avatarUrl ?? undefined} size="md" />
                  <div className="grid min-w-0 gap-1">
                    <span className="truncate text-sm font-black text-[#0B1F4A]">{name}</span>
                    {contact && (
                      <span className="truncate text-xs font-semibold text-[#5A6880]">
                        {contact}
                      </span>
                    )}
                    {member.familyLinkedAt && (
                      <span className="truncate text-xs font-semibold text-[#8A96AA]">
                        Linked {formatLinkedDate(member.familyLinkedAt)}
                      </span>
                    )}
                  </div>
                </div>
                {member.familyRole && (
                  <span className="inline-flex shrink-0 rounded-full border border-[#EAF1FF] bg-white px-2.5 py-1 text-[0.6875rem] font-black text-[#123B8D]">
                    {member.familyRole}
                  </span>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </AppShell>
  );
};

export default FamilyMembersPage;
