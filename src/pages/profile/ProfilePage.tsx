import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppScrollableTabs } from '@/components/common';
import { UserProfileImage } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProfileCompletionThunk } from '@/store/thunks/profileThunk';
import {
  ChurchMembershipPanel,
  ProfileCompletionView,
  ProfileError,
  ProfileLoading,
  ProfileProgressSummary,
} from './components';
import { tabs, tabText } from './config/profileConfig';
import type { ProfileLocationState, ProfileTab } from './types/profilePageTypes';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const requestedProfileTab = (location.state as ProfileLocationState)?.profileTab;
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    requestedProfileTab === 'church' || requestedProfileTab === 'profile'
      ? requestedProfileTab
      : 'profile',
  );
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { data, error, loading } = useAppSelector((state) => state.profile);

  const profileFetchRequested = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      profileFetchRequested.current = false;
      return;
    }
    if (profileFetchRequested.current || loading) return;
    profileFetchRequested.current = true;
    dispatch(fetchProfileCompletionThunk());
  }, [dispatch, isAuthenticated, loading]);

  const retryProfileFetch = useCallback(() => {
    dispatch(fetchProfileCompletionThunk());
  }, [dispatch]);

  const activePanel = useMemo(() => {
    if (activeTab === 'church') {
      return <ChurchMembershipPanel />;
    }

    if (loading) {
      return <ProfileLoading />;
    }

    if (error && !data) {
      return <ProfileError message={error} onRetry={retryProfileFetch} />;
    }

    if (data) {
      return <ProfileCompletionView profile={data} />;
    }

    return <ProfileLoading />;
  }, [activeTab, data, error, loading, retryProfileFetch]);

  return (
    <AppShell
      headerAvatar={<UserProfileImage size="md" />}
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
      </div>
    </AppShell>
  );
}
