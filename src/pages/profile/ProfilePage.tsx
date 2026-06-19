import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppScrollableTabs } from '@/components/common';
import { AppAvatar } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import { fetchProfileCompletionThunk } from '@/store/thunks/profileThunk';
import {
  ChurchMembershipPanel,
  ProfileCompletionView,
  ProfileError,
  ProfileLoading,
  ProfileProgressSummary,
} from './components';
import { ProfileSectionEditModal } from './components/ProfileSectionEditModal';
import { tabs, tabText } from './config/profileConfig';
import type { ProfileLocationState, ProfileTab } from './types/profilePageTypes';
import { getProfileDisplayName } from './utils/profileDisplayUtils';

const avatarOnlyFieldNames = ['avatarFileId'];

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const memberFetchRequested = useRef(false);
  const requestedProfileTab = (location.state as ProfileLocationState)?.profileTab;
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    requestedProfileTab === 'church' || requestedProfileTab === 'profile'
      ? requestedProfileTab
      : 'profile',
  );
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const memberAccount = useAppSelector((state) => state.member.data);
  const { data, error, loading } = useAppSelector((state) => state.profile);
  const headerAvatarName =
    memberAccount?.basicProfile?.displayName ||
    [memberAccount?.basicProfile?.firstName, memberAccount?.basicProfile?.lastName]
      .filter(Boolean)
      .join(' ') ||
    (data ? getProfileDisplayName(data) : 'Member Profile');
  const headerAvatarSrc =
    (data?.personalInformation?.avatarFile as Record<string, unknown>)?.url as string ||
    memberAccount?.basicProfile?.avatarUrl ||
    undefined;

  const shouldFetchProfile = isAuthenticated && activeTab === 'profile' && !data && !loading && !error;

  useEffect(() => {
    if (!isAuthenticated) {
      memberFetchRequested.current = false;
      return;
    }

    if (memberFetchRequested.current) return;

    memberFetchRequested.current = true;
    dispatch(fetchMemberAccountThunk());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (shouldFetchProfile) {
      dispatch(fetchProfileCompletionThunk());
    }
  }, [dispatch, shouldFetchProfile]);

  const retryProfileFetch = useCallback(() => {
    dispatch(fetchProfileCompletionThunk());
  }, [dispatch]);

  const openAvatarEditor = useCallback(() => {
    if (data) {
      setIsAvatarEditorOpen(true);
    }
  }, [data]);

  const activePanel = useMemo(() => {
    if (activeTab === 'church') {
      return <ChurchMembershipPanel />;
    }

    if (loading && !data) {
      return <ProfileLoading />;
    }

    if (error && !data) {
      return <ProfileError message={error} onRetry={retryProfileFetch} />;
    }

    if (data) {
      return <ProfileCompletionView profile={data} onAvatarClick={openAvatarEditor} />;
    }

    return null;
  }, [activeTab, data, error, loading, openAvatarEditor, retryProfileFetch]);

  return (
    <AppShell
      headerAvatar={<AppAvatar name={headerAvatarName} src={headerAvatarSrc} size="md" />}
      mobileHeaderAddon={
        <div className="min-w-0 bg-white/95 shadow-[0_8px_18px_rgba(11,31,74,0.04)] backdrop-blur-xl">
          <div className="min-w-0 overflow-hidden border-b border-[#E5E7EB]">
            <div className="mx-auto max-w-[78rem] min-w-0 overflow-hidden">
              <AppScrollableTabs
                tabs={tabs}
                value={activeTab}
                ariaLabel="Profile sections"
                fullWidthTabs
                onValueChange={(next) => setActiveTab(next as ProfileTab)}
              />
            </div>
          </div>
          {activeTab === 'profile' && data && (
            <ProfileProgressSummary
              profile={data}
              className="mx-auto max-w-[78rem] gap-3 px-4 py-4"
              onAvatarClick={openAvatarEditor}
            />
          )}
        </div>
      }
    >
      <div className="min-w-0">
        <section
          className="mx-auto max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9"
          role="tabpanel"
          aria-label={tabText[activeTab]}
        >
          {activePanel}
        </section>
        {data && (
          <ProfileSectionEditModal
            open={isAvatarEditorOpen}
            sectionKey="personalInformation"
            sectionTitle="Profile Avatar"
            sectionData={data.personalInformation}
            fieldNames={avatarOnlyFieldNames}
            onClose={() => setIsAvatarEditorOpen(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
