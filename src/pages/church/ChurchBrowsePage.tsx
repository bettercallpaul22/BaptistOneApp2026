import { ArrowLeft, CalendarDays, FileText, UserRoundCheck, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { getLeaderTypeKey } from './churchLeadershipUtils';
import { ChurchDocumentsPanel } from './ChurchDocumentsPanel';
import { ChurchEventsPanel } from './ChurchEventsPanel';
import { ChurchLeadershipPanel } from './ChurchLeadershipPanel';

type ChurchBrowseTab = 'leaders' | 'ministers' | 'deacons' | 'council' | 'events' | 'documents';

const defaultTab: ChurchBrowseTab = 'leaders';
const browseTabs: Array<{ value: ChurchBrowseTab; label: string; type?: string; icon: typeof Users }> = [
  { value: 'leaders', label: 'Leaders', icon: Users },
  { value: 'ministers', label: 'Ministers', type: 'MINISTER', icon: UserRoundCheck },
  { value: 'deacons', label: 'Deacons', type: 'DEACON', icon: UserRoundCheck },
  { value: 'council', label: 'Council', type: 'COUNCIL', icon: UserRoundCheck },
  { value: 'events', label: 'Events', icon: CalendarDays },
  { value: 'documents', label: 'Documents', icon: FileText },
];

const getSafeTab = (tab: string | null): ChurchBrowseTab =>
  browseTabs.some((item) => item.value === tab) ? (tab as ChurchBrowseTab) : defaultTab;

const getBadge = (value: number | undefined) => (typeof value === 'number' && value > 0 ? String(value) : undefined);

const ChurchBrowsePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const bootstrap = useChurchScreenBootstrapApi();
  const activeTab = getSafeTab(searchParams.get('tab'));

  const tabItems = browseTabs.map((tab) => {
    const filteredLeadershipCount = tab.type
      ? bootstrap.leadership.filter((leader) => getLeaderTypeKey(leader) === tab.type).length
      : bootstrap.leadershipMeta?.total;

    return {
      ...tab,
      badge:
        tab.value === 'events'
          ? getBadge(bootstrap.eventsMeta?.total)
          : tab.value === 'documents'
            ? getBadge(bootstrap.documentsMeta?.total)
            : getBadge(filteredLeadershipCount),
    };
  });
  const activeBrowseTab = browseTabs.find((tab) => tab.value === activeTab) ?? browseTabs[0];

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: getSafeTab(value) }, { replace: true });
  };

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <div className="flex items-center gap-3">
          <AppButton aria-label="Back to church" size="sm" variant="outline" onClick={() => navigate(paths.church)}>
            <ArrowLeft className="size-4" aria-hidden />
          </AppButton>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h5">Browse church</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Explore church leaders, events, and documents.
            </AppText>
          </div>
        </div>

        <AppScrollableTabs
          tabs={tabItems}
          value={activeTab}
          ariaLabel="Church browse sections"
          onValueChange={handleTabChange}
        />

        {activeTab === 'events' ? (
          <ChurchEventsPanel bootstrap={bootstrap} />
        ) : activeTab === 'documents' ? (
          <ChurchDocumentsPanel bootstrap={bootstrap} />
        ) : (
          <ChurchLeadershipPanel bootstrap={bootstrap} type={activeBrowseTab.type} />
        )}
      </main>
    </AppShell>
  );
};

export default ChurchBrowsePage;
