import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Building2, CalendarDays, Church, Clock3, FileText, Mail, MapPin, Music2, Phone, RefreshCw, Search, User, Users, Wallet } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppAvatar, AppCard, ProfileCard } from '@/components/display';
import { AppLoader, AppModal, AppStateFeedback } from '@/components/feedback';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import { AppShell } from '@/layouts/AppShell';
import {
  getLeaderAvatarUrl,
  getLeaderGroupTitle,
  getLeaderName,
  getLeadershipGroups,
  getLeaderRole,
} from '@/pages/church/churchLeadershipUtils';
import {
  formatEventDate,
  formatEventType,
  formatFileSize,
  getDocumentName,
  getEventLocation,
  getEventTitle,
  getFileExtension,
  sortByOrderAndDate,
} from '@/pages/church/churchResourceUtils';
import { paths } from '@/routes/paths';
import type { ChurchDocumentItem, ChurchEventItem, ChurchLeadershipItem, PublicChurchDetails } from '@/types/church';

type AppTabPageKind = 'bible' | 'hymnal' | 'church' | 'wallet' | 'profile';

const tabContent: Record<
  AppTabPageKind,
  {
    title: string;
    subtitle: string;
    icon: typeof BookOpen;
    primaryAction: string;
    items: Array<{ title: string; description: string; icon: typeof BookOpen }>;
  }
> = {
  bible: {
    title: 'Bible',
    subtitle: 'Read, bookmark, and continue your scripture study.',
    icon: BookOpen,
    primaryAction: 'Continue Reading',
    items: [
      { title: 'John 3', description: 'Last opened passage', icon: BookOpen },
      { title: 'Bookmarks', description: 'Saved verses and notes', icon: Search },
      { title: 'Reading Plan', description: 'Daily devotional guide', icon: Church },
    ],
  },
  hymnal: {
    title: 'Hymnal',
    subtitle: 'Browse Baptist hymns for worship and devotion.',
    icon: Music2,
    primaryAction: 'Open Hymnal',
    items: [
      { title: 'Amazing Grace', description: 'Recently viewed hymn', icon: Music2 },
      { title: 'Favorites', description: 'Your saved hymns', icon: Search },
      { title: 'Choir List', description: 'Songs for upcoming service', icon: Church },
    ],
  },
  church: {
    title: 'Church',
    subtitle: 'Stay connected with Faith BC Lugbe activities.',
    icon: Building2,
    primaryAction: 'View Church Profile',
    items: [
      { title: 'Membership', description: 'Complete your church connection', icon: User },
      { title: 'Events', description: 'Upcoming services and programs', icon: Church },
      { title: 'Departments', description: 'Groups and ministry teams', icon: Building2 },
    ],
  },
  wallet: {
    title: 'Wallet',
    subtitle: 'Manage giving, wallet balance, and payment history.',
    icon: Wallet,
    primaryAction: 'Give Now',
    items: [
      { title: 'Recent Giving', description: 'Tithe - ₦50,000', icon: Wallet },
      { title: 'History', description: 'View previous giving records', icon: Search },
      { title: 'Payment Methods', description: 'Cards and transfer options', icon: Building2 },
    ],
  },
  profile: {
    title: 'Profile',
    subtitle: 'Manage your member details and preferences.',
    icon: User,
    primaryAction: 'Edit Profile',
    items: [
      { title: 'Samson A.', description: 'Faith BC Lugbe member', icon: User },
      { title: 'Church Connection', description: 'Membership profile pending', icon: Church },
      { title: 'Preferences', description: 'Notifications and account settings', icon: Search },
    ],
  },
};

interface AppTabPageProps {
  kind: AppTabPageKind;
}

const IconBadge = ({ children }: { children: ReactNode }) => (
  <span className="grid size-12 place-items-center rounded-xl bg-[#EAF1FF] text-[#123B8D]">{children}</span>
);

const getChurchImage = (church: PublicChurchDetails) =>
  church.coverImageUrl || church.coverImage || church.image || church.logo || null;

const normalizeChurchImageSrc = (src?: string | null) =>
  src?.startsWith('http://') ? src.replace(/^http:\/\//, 'https://') : src;

const getChurchLocation = (church: PublicChurchDetails) =>
  [church.address?.city, church.address?.state, church.address?.country]
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .join(', ');

const getChurchEmail = (church: PublicChurchDetails) =>
  church.contactEmail || church.email || church.contact?.contactEmail || church.contact?.email || null;

const getChurchPhone = (church: PublicChurchDetails) =>
  church.contactPhone || church.phone || church.contact?.contactPhone || church.contact?.phone || null;

const formatMembershipSize = (church: PublicChurchDetails) => {
  const size = church.membershipSize ?? church.memberCount;

  if (typeof size !== 'number') return null;

  return `${new Intl.NumberFormat().format(size)} members`;
};

const getComplianceBadgeClasses = (status?: string | null) => {
  const normalizedStatus = status?.trim().toUpperCase();

  if (normalizedStatus === 'COMPLIANT' || normalizedStatus === 'VERIFIED' || normalizedStatus === 'APPROVED') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  }

  if (normalizedStatus === 'PENDING' || normalizedStatus === 'UNDER_REVIEW' || normalizedStatus === 'IN_REVIEW') {
    return 'border-amber-100 bg-amber-50 text-amber-700';
  }

  if (normalizedStatus === 'NON_COMPLIANT' || normalizedStatus === 'REJECTED' || normalizedStatus === 'FAILED') {
    return 'border-rose-100 bg-rose-50 text-rose-700';
  }

  return 'border-[#E5E7EB] bg-[#F8FAFC] text-[#43536D]';
};

const ChurchStatusMessage = ({
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

const ChurchBanner = ({ church }: { church: PublicChurchDetails }) => {
  const navigate = useNavigate();
  const image = normalizeChurchImageSrc(getChurchImage(church));
  const location = getChurchLocation(church);
  const email = getChurchEmail(church);
  const phone = getChurchPhone(church);
  const membershipSize = formatMembershipSize(church);
  const complianceBadge = church.complianceBadge;
  const complianceBadgeLabel =
    complianceBadge?.visible && typeof complianceBadge.label === 'string' ? complianceBadge.label.trim() : '';

  return (
    <section className="overflow-hidden rounded-xl border border-[#D6DEEB] bg-white shadow-[0_12px_26px_rgba(11,31,74,0.08)]">
      <div className="relative h-36 overflow-hidden bg-[#EAF1FF] sm:h-44">
        {image ? (
          <img className="h-full w-full object-cover object-center" src={image} alt={church.name} />
        ) : (
          <div className="grid h-full place-items-center bg-[#EAF1FF] text-[#123B8D]">
            <Church className="size-12" aria-hidden />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0B1F4A]/45 to-transparent" />
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {church.status && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-emerald-700">
                {church.status}
              </span>
            )}
            {membershipSize && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#43536D]">
                <Users className="size-3.5" aria-hidden />
                {membershipSize}
              </span>
            )}
            {complianceBadgeLabel && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getComplianceBadgeClasses(
                  complianceBadge?.status,
                )}`}
                title={complianceBadge?.kycStatus ? `KYC status: ${complianceBadge.kycStatus}` : undefined}
              >
                <AlertCircle className="size-3.5" aria-hidden />
                {complianceBadgeLabel}
              </span>
            )}
          </div>
          <div className="grid gap-1">
            <h2 className="m-0 text-[1.65rem] font-black leading-tight text-[#0B1F4A] sm:text-[2rem]">
              {church.name}
            </h2>
            {church.about && (
              <AppText variant="bodyMedium" color="textSecondary">
                {church.about}
              </AppText>
            )}
          </div>
        </div>

        <div className="grid gap-2 text-sm font-semibold text-[#43536D]">
          {location && (
            <span className="inline-flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
              <span className="min-w-0 truncate">{location}</span>
            </span>
          )}
          {email && (
            <span className="inline-flex min-w-0 items-center gap-2">
              <Mail className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
              <span className="min-w-0 truncate">{email}</span>
            </span>
          )}
          {phone && (
            <span className="inline-flex min-w-0 items-center gap-2">
              <Phone className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
              <span className="min-w-0 truncate">{phone}</span>
            </span>
          )}
        </div>

        <AppButton onClick={() => navigate(paths.churchBrowse)}>
          Browse church
        </AppButton>
      </div>
    </section>
  );
};

const ChurchLeaderDetailsModal = ({ leader, onClose }: { leader: ChurchLeadershipItem | null; onClose: () => void }) => (
  <AppModal
    open={Boolean(leader)}
    title="Leader details"
    onClose={onClose}
    footer={
      <AppButton className="col-span-2" variant="secondary" onClick={onClose}>
        Close
      </AppButton>
    }
  >
    {leader && (
      <div className="grid gap-5">
        <div className="grid justify-items-center gap-3 text-center">
          <AppAvatar name={getLeaderName(leader)} src={getLeaderAvatarUrl(leader)} size="xl" />
          <div className="grid gap-1">
            <AppText variant="h5" align="center">
              {getLeaderName(leader)}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" align="center">
              {getLeaderRole(leader)} - {getLeaderGroupTitle(leader)}
            </AppText>
          </div>
        </div>

        {(leader.email || leader.phone) && (
          <div className="grid gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-sm font-semibold text-[#43536D]">
            {leader.email && (
              <span className="inline-flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
                <span className="min-w-0 truncate">{leader.email}</span>
              </span>
            )}
            {leader.phone && (
              <span className="inline-flex min-w-0 items-center gap-2">
                <Phone className="size-4 shrink-0 text-[#123B8D]" aria-hidden />
                <span className="min-w-0 truncate">{leader.phone}</span>
              </span>
            )}
          </div>
        )}

        <AppText variant="bodyMedium" color="textSecondary">
          {leader.bio?.trim() || 'No biography has been added yet.'}
        </AppText>
      </div>
    )}
  </AppModal>
);

const ChurchLeadersSection = ({
  leadership,
  loading,
}: {
  leadership: ChurchLeadershipItem[];
  loading: boolean;
}) => {
  const navigate = useNavigate();
  const [selectedLeader, setSelectedLeader] = useState<ChurchLeadershipItem | null>(null);
  const leadershipGroups = getLeadershipGroups(leadership);

  return (
    <section className="grid gap-4">
      <AppText variant="h5">Church leaders</AppText>

      {loading ? (
        <AppStateFeedback state="loading" label="Loading church leaders" className="min-h-44" />
      ) : leadershipGroups.length ? (
        <div className="grid gap-4">
          {leadershipGroups.map((group) => (
            <div className="grid gap-2" key={group.title}>
              <div className="flex items-center justify-between gap-3">
                <AppText variant="subtitle">{group.title}</AppText>
                {group.people.length > 2 && (
                  <AppButton
                    className="min-h-8 px-3 text-xs"
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(paths.churchLeadership(group.type.toLowerCase()))}
                  >
                    View all
                  </AppButton>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {group.people.slice(0, 2).map((leader) => (
                  <ProfileCard
                    key={leader.id}
                    name={getLeaderName(leader)}
                    role={getLeaderRole(leader)}
                    avatarUrl={getLeaderAvatarUrl(leader)}
                    onViewDetails={() => setSelectedLeader(leader)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
          <AppText variant="bodySmall" color="textSecondary">
            No church leaders have been added yet.
          </AppText>
        </div>
      )}

      <ChurchLeaderDetailsModal leader={selectedLeader} onClose={() => setSelectedLeader(null)} />
    </section>
  );
};

const ChurchEventPreviewCard = ({ event }: { event: ChurchEventItem }) => {
  const location = getEventLocation(event);

  return (
    <article className="grid gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
          <CalendarDays className="size-5" aria-hidden />
        </span>
        <div className="grid min-w-0 gap-1">
          <span className="truncate text-sm font-black text-[#0B1F4A]">{getEventTitle(event)}</span>
          <span className="truncate text-xs font-semibold text-[#D4A017]">{formatEventType(event.type)}</span>
        </div>
      </div>
      <AppText variant="caption" color="textMuted" weight="bold">
        {formatEventDate(event)}
      </AppText>
      {location && (
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[#5A6880]">
          <MapPin className="size-3.5 shrink-0 text-[#123B8D]" aria-hidden />
          <span className="truncate">{location}</span>
        </span>
      )}
    </article>
  );
};

const ChurchEventsSection = ({ events, loading }: { events: ChurchEventItem[]; loading: boolean }) => {
  const navigate = useNavigate();
  const visibleEvents = sortByOrderAndDate(events).slice(0, 2);

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <AppText variant="h5">Events</AppText>
        {events.length > 2 && (
          <AppButton className="min-h-8 px-3 text-xs" size="sm" variant="ghost" onClick={() => navigate(paths.churchEvents)}>
            View all
          </AppButton>
        )}
      </div>

      {loading ? (
        <AppStateFeedback state="loading" label="Loading church events" className="min-h-32" />
      ) : visibleEvents.length ? (
        <div className="grid gap-3">
          {visibleEvents.map((event) => (
            <ChurchEventPreviewCard event={event} key={event.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
          <AppText variant="bodySmall" color="textSecondary">
            No church events have been added yet.
          </AppText>
        </div>
      )}
    </section>
  );
};

const ChurchDocumentPreviewCard = ({ document }: { document: ChurchDocumentItem }) => {
  const fileSize = formatFileSize(document.file?.size);

  return (
    <article className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFF8E4] text-[#D4A017]">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="grid min-w-0 gap-1">
          <span className="truncate text-sm font-black text-[#0B1F4A]">{getDocumentName(document)}</span>
          <span className="truncate text-xs font-semibold text-[#5A6880]">
            {[getFileExtension(document), fileSize].filter(Boolean).join(' - ')}
          </span>
        </div>
      </div>
      {document.file?.url && (
        <AppButton className="min-h-8 px-3 text-xs" size="sm" onClick={() => window.open(document.file?.url ?? '', '_blank', 'noopener,noreferrer')}>
          Open document
        </AppButton>
      )}
    </article>
  );
};

const ChurchDocumentsSection = ({ documents, loading }: { documents: ChurchDocumentItem[]; loading: boolean }) => {
  const navigate = useNavigate();
  const visibleDocuments = sortByOrderAndDate(documents).slice(0, 2);

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <AppText variant="h5">Documents</AppText>
        {documents.length > 2 && (
          <AppButton className="min-h-8 px-3 text-xs" size="sm" variant="ghost" onClick={() => navigate(paths.churchDocuments)}>
            View all
          </AppButton>
        )}
      </div>

      {loading ? (
        <AppStateFeedback state="loading" label="Loading church documents" className="min-h-32" />
      ) : visibleDocuments.length ? (
        <div className="grid gap-3">
          {visibleDocuments.map((document) => (
            <ChurchDocumentPreviewCard document={document} key={document.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
          <AppText variant="bodySmall" color="textSecondary">
            No church documents have been added yet.
          </AppText>
        </div>
      )}
    </section>
  );
};

const ChurchTabScreen = () => {
  const navigate = useNavigate();
  const {
    church,
    documents,
    documentsLoading,
    documentsMeta,
    error,
    events,
    eventsLoading,
    eventsMeta,
    leadership,
    leadershipLoading,
    leadershipMeta,
    loading,
    membershipStatus,
    retry,
  } =
    useChurchScreenBootstrapApi();

  if (loading && (!church || !leadershipMeta || !documentsMeta || !eventsMeta)) {
    return (
      <div className="grid min-h-[55vh] place-items-center pb-24">
        <AppLoader label="Loading church" />
      </div>
    );
  }

  if (error) {
    return (
      <ChurchStatusMessage
        title="Unable to load church"
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
      <ChurchStatusMessage
        title="Church request under review"
        description="Your church request is under review. Church features, events, departments, and updates will appear here after approval."
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
      <ChurchStatusMessage
        title="Join a church to continue"
        description="Join a church to access church features, events, departments, and church updates."
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
      <ChurchStatusMessage
        title="Church details unavailable"
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

  return (
    <div className="grid gap-5 pb-28">
      <ChurchBanner church={church} />
      <ChurchLeadersSection leadership={leadership} loading={leadershipLoading || (loading && !leadershipMeta)} />
      <ChurchEventsSection events={events} loading={eventsLoading || (loading && !eventsMeta)} />
      <ChurchDocumentsSection documents={documents} loading={documentsLoading || (loading && !documentsMeta)} />
    </div>
  );
};

export default function AppTabPage({ kind }: AppTabPageProps) {
  const content = tabContent[kind];
  const PageIcon = content.icon;

  if (kind === 'church') {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-[78rem] px-4 py-6 sm:px-6 md:px-9 md:py-9">
          <ChurchTabScreen />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto grid max-w-[78rem] gap-6 px-4 py-6 sm:px-6 md:px-9 md:py-9">
        <section className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(11,31,74,0.08)] sm:p-6">
          <IconBadge>
            <PageIcon className="size-7" aria-hidden />
          </IconBadge>
          <div className="grid gap-2">
            <AppText variant="h1">{content.title}</AppText>
            <AppText variant="bodyLarge" color="textSecondary">
              {content.subtitle}
            </AppText>
          </div>
          <div>
            <AppButton>{content.primaryAction}</AppButton>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {content.items.map((item) => {
            const ItemIcon = item.icon;

            return (
              <AppCard className="shadow-[0_10px_22px_rgba(11,31,74,0.08)]" key={item.title}>
                <div className="grid gap-4">
                  <IconBadge>
                    <ItemIcon className="size-6" aria-hidden />
                  </IconBadge>
                  <div className="grid gap-1">
                    <AppText variant="h5">{item.title}</AppText>
                    <AppText variant="bodyMedium" color="textSecondary">
                      {item.description}
                    </AppText>
                  </div>
                </div>
              </AppCard>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
