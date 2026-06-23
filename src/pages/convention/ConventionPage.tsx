import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { AppScrollableTabs, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import { setConventionId, clearConventionData } from '@/store/slices/conventionSlice';
import { getConventionIdFromMember } from '@/types/convention';
import { ProgramsTab } from './tabs/ProgramsTab';
import { PublicationsTab } from './tabs/PublicationsTab';
import { AnnouncementsTab } from './tabs/AnnouncementsTab';
import { DocumentsTab } from './tabs/DocumentsTab';

type ConventionTab = 'programs' | 'publications' | 'announcement' | 'documents';

const tabItems = [
  { value: 'programs', label: 'Programs' },
  { value: 'publications', label: 'Publications' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'documents', label: 'Documents' },
] as const;

export default function ConventionPage() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<ConventionTab>('programs');
  const member = useAppSelector((state) => state.member.data);
  const memberLoading = useAppSelector((state) => state.member.loading);
  const conventionId = useAppSelector((state) => state.convention.conventionId);

  useEffect(() => {
    if (!member && !memberLoading) {
      dispatch(fetchMemberAccountThunk());
    }
  }, [dispatch, member, memberLoading]);

  useEffect(() => {
    if (member) {
      const id = getConventionIdFromMember(member);
      if (id !== conventionId) {
        dispatch(setConventionId(id));
      }
    }
  }, [member, conventionId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearConventionData());
    };
  }, [dispatch]);

  if (memberLoading && !member) {
    return (
      <AppShell>
        <main className="grid min-h-[65vh] place-items-center px-4">
          <AppLoader label="Loading convention" />
        </main>
      </AppShell>
    );
  }

  if (!conventionId) {
    return (
      <AppShell>
        <main className="mx-auto grid w-full max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9">
          <div className="grid min-h-[55vh] place-items-center">
            <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
                <CalendarDays className="size-7" />
              </span>
              <div className="grid gap-2">
                <AppText variant="h5" align="center">No convention available</AppText>
                <AppText variant="bodyMedium" color="textSecondary" align="center">
                  Your church does not have an active convention. Please contact your church admin.
                </AppText>
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      mobileHeaderAddon={
        <div className="min-w-0 bg-white/95 backdrop-blur-xl">
          <div className="min-w-0 border-b border-[#E5E7EB]">
            <div className="mx-auto max-w-[78rem] px-4 py-5 sm:px-6 md:px-9">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#123B8D] to-[#0B1F4A] text-white shadow-[0_4px_12px_rgba(18,59,141,0.3)]">
                  <CalendarDays className="size-5" aria-hidden />
                </span>
                <div className="grid gap-0.5">
                  <AppText variant="h5" className="font-bold text-[#0B1F4A]">
                    Convention
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    Programs, publications, and announcements
                  </AppText>
                </div>
              </div>
            </div>
            <div className="mx-auto max-w-[78rem]">
              <AppScrollableTabs
                tabs={tabItems.map((item) => ({ value: item.value, label: item.label }))}
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as ConventionTab)}
                ariaLabel="Convention navigation tabs"
                fullWidthTabs
              />
            </div>
          </div>
        </div>
      }
    >
      <main className="min-w-0">
        <section className="mx-auto max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9" role="tabpanel" aria-label={activeTab}>
          {activeTab === 'programs' && <ProgramsTab conventionId={conventionId} />}
          {activeTab === 'publications' && <PublicationsTab conventionId={conventionId} />}
          {activeTab === 'announcement' && <AnnouncementsTab conventionId={conventionId} />}
          {activeTab === 'documents' && <DocumentsTab conventionId={conventionId} />}
        </section>
      </main>
    </AppShell>
  );
}
