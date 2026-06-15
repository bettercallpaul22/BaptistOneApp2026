import { type ReactNode } from 'react';
import { AlertCircle, CalendarDays, Church, Clock3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { AppLoader } from '@/components/feedback';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { ChurchEventsPanel } from '@/pages/church/ChurchEventsPanel';

const EventsStatusMessage = ({
  action,
  description,
  icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) => (
  <div className="grid min-h-[55vh] place-items-center px-2 pb-24">
    <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
      {icon}
      <div className="grid gap-1">
        <AppText variant="h6" align="center">
          {title}
        </AppText>
        <AppText variant="bodySmall" color="textSecondary" align="center">
          {description}
        </AppText>
      </div>
      {action}
    </div>
  </div>
);

export default function EventsPage() {
  const navigate = useNavigate();
  const bootstrap = useChurchScreenBootstrapApi();
  const { church, error, eventsMeta, loading, membershipStatus, retry } = bootstrap;

  const renderContent = () => {
    if (loading && (!church || !eventsMeta)) {
      return (
        <div className="grid min-h-[55vh] place-items-center pb-24">
          <AppLoader label="Loading events" />
        </div>
      );
    }

    if (error) {
      return (
        <EventsStatusMessage
          title="Unable to load events"
          description={error}
          icon={
            <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
              <AlertCircle className="size-6" aria-hidden />
            </span>
          }
          action={
            <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={loading} onClick={retry}>
              Retry
            </AppButton>
          }
        />
      );
    }

    if (membershipStatus === 'PENDING') {
      return (
        <EventsStatusMessage
          title="Church request under review"
          description="Your church request is under review. Events will appear here after approval."
          icon={
            <span className="grid size-12 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
              <Clock3 className="size-6" aria-hidden />
            </span>
          }
        />
      );
    }

    if (membershipStatus !== 'APPROVED') {
      return (
        <EventsStatusMessage
          title="Join a church to continue"
          description="Join a church to access events and updates."
          icon={
            <span className="grid size-12 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
              <Church className="size-6" aria-hidden />
            </span>
          }
          action={<AppButton onClick={() => navigate(paths.profile, { state: { profileTab: 'church' } })}>Join church</AppButton>}
        />
      );
    }

    if (!church) {
      return (
        <EventsStatusMessage
          title="Events unavailable"
          description="Your membership is approved, but church details could not be found."
          icon={
            <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
              <AlertCircle className="size-6" aria-hidden />
            </span>
          }
          action={
            <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={loading} onClick={retry}>
              Retry
            </AppButton>
          }
        />
      );
    }

    return <ChurchEventsPanel bootstrap={bootstrap} />;
  };

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <header className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">
            <CalendarDays className="size-6" aria-hidden />
          </span>
          <div className="grid min-w-0 gap-1">
            <AppText variant="h4">Events</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Upcoming programs and activities.
            </AppText>
          </div>
        </header>

        {renderContent()}
      </main>
    </AppShell>
  );
}
