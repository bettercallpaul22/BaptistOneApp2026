import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Search, Send } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppAvatar } from '@/components/display';
import { AppInput } from '@/components/form';
import { useAppDispatch } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import { familyInviteService } from '../services/familyInviteService';
import type { FamilyMemberSearchItem, InviteFamilyMemberPayload } from '../types/familyInviteTypes';
import { getSubmitErrorMessage } from '../utils/profileFormatters';

const defaultInviteMessage = 'Please join BaptistOne so we can complete our family profile.';

const getMemberName = (member: FamilyMemberSearchItem) =>
  member.displayName?.trim() || member.username?.trim() || member.email?.trim() || 'Spouse';

const getMemberEmail = (member: FamilyMemberSearchItem) =>
  member.contactEmail?.trim() || member.email?.trim() || '';

const getMemberPhone = (member: FamilyMemberSearchItem) => member.contactPhone?.trim() || '';

const buildMemberInvitePayload = (member: FamilyMemberSearchItem): InviteFamilyMemberPayload => {
  const email = getMemberEmail(member);
  const phone = getMemberPhone(member);

  return {
    relationship: 'SPOUSE',
    name: getMemberName(member),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    message: defaultInviteMessage,
  };
};

export const SpouseInviteSearch = () => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<FamilyMemberSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitedMemberId, setInvitedMemberId] = useState<string | null>(null);
  const [invitingMemberId, setInvitingMemberId] = useState<string | null>(null);
  const [manualInviteLoading, setManualInviteLoading] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMessage, setManualMessage] = useState(defaultInviteMessage);
  const trimmedQuery = query.trim();
  const canManualInvite = Boolean(manualName.trim() && (manualEmail.trim() || manualPhone.trim()));
  const hasSearched = Boolean(trimmedQuery);

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const abortController = new AbortController();
    const debounceTimer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await familyInviteService.searchMembers(trimmedQuery, {
          signal: abortController.signal,
        });
        setItems(response.data?.items ?? []);
      } catch (error) {
        if (abortController.signal.aborted) return;

        setItems([]);
        setSearchError(getSubmitErrorMessage(error));
      } finally {
        if (!abortController.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      abortController.abort();
      window.clearTimeout(debounceTimer);
    };
  }, [trimmedQuery]);

  const searchStatusMessage = useMemo(() => {
    if (!hasSearched) return 'Search by name, email, username, or phone.';
    if (searchLoading) return 'Searching members...';
    if (searchError) return searchError;
    if (!items.length) return 'No spouse found for your search.';
    return null;
  }, [hasSearched, items.length, searchError, searchLoading]);

  const handleInvite = async (payload: InviteFamilyMemberPayload, memberId?: string) => {
    setInviteError(null);
    if (memberId) setInvitingMemberId(memberId);
    else setManualInviteLoading(true);

    try {
      const response = await familyInviteService.inviteMember(payload);
      if (memberId) setInvitedMemberId(memberId);
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Spouse invite sent',
          message: response.message || 'Your spouse invite has been sent.',
        }),
      );
    } catch (error) {
      const message = getSubmitErrorMessage(error);
      setInviteError(message);
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to invite spouse',
          message,
        }),
      );
    } finally {
      if (memberId) setInvitingMemberId(null);
      else setManualInviteLoading(false);
    }
  };

  const handleManualInvite = () => {
    const email = manualEmail.trim();
    const phone = manualPhone.trim();

    if (!canManualInvite) return;

    void handleInvite({
      relationship: 'SPOUSE',
      name: manualName.trim(),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      message: manualMessage.trim() || defaultInviteMessage,
    });
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;

    setQuery(nextQuery);
    setInviteError(null);
    setInvitedMemberId(null);

    if (!nextQuery.trim()) {
      setItems([]);
      setSearchError(null);
      setSearchLoading(false);
    }
  };

  return (
    <section className="grid gap-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <div className="grid gap-1">
        <AppText variant="bodyMedium" weight="bold">
          Find spouse on BaptistOne
        </AppText>
        <AppText variant="bodySmall" color="textSecondary">
          Search for your spouse and send an invite to join your family profile.
        </AppText>
      </div>

      <AppInput
        label="Search spouse"
        placeholder="Search by name, email, username, or phone"
        value={query}
        onChange={handleQueryChange}
      />

      {searchStatusMessage && (
        <div
          className={`rounded-lg border p-3 text-sm font-semibold ${
            searchError
              ? 'border-red-100 bg-red-50 text-red-700'
              : 'border-[#E5E7EB] bg-white text-[#6B7890]'
          }`}
        >
          {searchStatusMessage}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-2" role="list" aria-label="Spouse search results">
          {items.map((member) => {
            const name = getMemberName(member);
            const email = getMemberEmail(member);
            const phone = getMemberPhone(member);
            const canInviteMember = Boolean(email || phone);
            const isInvited = invitedMemberId === member.memberId;

            return (
              <div
                className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={member.memberId}
                role="listitem"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <AppAvatar name={name} src={member.avatarUrl ?? undefined} size="md" />
                  <div className="grid min-w-0 gap-1">
                    <span className="min-w-0 truncate text-sm font-black text-[#0B1F4A]">
                      {name}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-[#5A6880]">
                      {member.username ? `@${member.username}` : 'No username'}
                    </span>
                    {member.churchName && (
                      <span className="min-w-0 truncate text-xs font-semibold text-[#5A6880]">
                        {member.churchName}
                      </span>
                    )}
                  </div>
                </div>
                <AppButton
                  leftIcon={<Send className="size-4" aria-hidden />}
                  loading={invitingMemberId === member.memberId}
                  size="sm"
                  variant={isInvited ? 'outline' : 'primary'}
                  disabled={!canInviteMember || isInvited}
                  onClick={() =>
                    void handleInvite(buildMemberInvitePayload(member), member.memberId)
                  }
                >
                  {isInvited ? 'Invited' : 'Invite'}
                </AppButton>
              </div>
            );
          })}
        </div>
      )}

      {inviteError && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {inviteError}
        </div>
      )}

      <div className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
        <div className="flex items-center gap-2 text-[#123B8D]">
          <Search className="size-4" aria-hidden />
          <AppText variant="bodySmall" weight="bold">
            Invite manually
          </AppText>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AppInput
            label="Name"
            placeholder="Jane Doe"
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
          />
          <AppInput
            label="Email"
            placeholder="jane@example.com"
            type="email"
            value={manualEmail}
            onChange={(event) => setManualEmail(event.target.value)}
          />
        </div>
        <AppInput
          label="Phone"
          placeholder="+2348012345678"
          type="tel"
          value={manualPhone}
          onChange={(event) => setManualPhone(event.target.value)}
        />
        <label className="grid gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
            Message
          </span>
          <textarea
            className="min-h-24 rounded-[10px] border-[1.5px] border-[#D5DCE8] bg-white px-3.5 py-2.5 text-sm text-[#0B1F4A] outline-none transition-all duration-150 placeholder:text-[#A8B3C4] focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
            value={manualMessage}
            onChange={(event) => setManualMessage(event.target.value)}
          />
        </label>
        <AppButton
          fullWidth
          leftIcon={<Send className="size-4" aria-hidden />}
          loading={manualInviteLoading}
          disabled={!canManualInvite}
          variant="outline"
          onClick={handleManualInvite}
        >
          Send manual invite
        </AppButton>
      </div>
    </section>
  );
};
