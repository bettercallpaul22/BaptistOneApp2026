import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Building2, Church, Clock3, Mail, MapPin, Music2, Phone, RefreshCw, Search, User, Users, Wallet } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppCard } from '@/components/display';
import { AppLoader } from '@/components/feedback';
import { useChurchScreenBootstrapApi } from '@/hooks/useChurchScreenBootstrapApi';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import type { ChurchPerson, PublicChurchDetails } from '@/types/church';

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

const getChurchLocation = (church: PublicChurchDetails) =>
  [church.address?.city, church.address?.state, church.address?.country]
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .join(', ');

const getChurchEmail = (church: PublicChurchDetails) =>
  church.contactEmail || church.email || church.contact?.contactEmail || church.contact?.email || null;

const getChurchPhone = (church: PublicChurchDetails) =>
  church.contactPhone || church.phone || church.contact?.contactPhone || church.contact?.phone || null;

const getPersonName = (person: ChurchPerson) => {
  const firstLast = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return person.displayName || person.name || firstLast || person.email || null;
};

const getPeopleSummary = (people: ChurchPerson[] | undefined, fallback: string) => {
  if (!people?.length) return null;

  const names = people.map(getPersonName).filter(Boolean);
  if (!names.length) return `${people.length} ${fallback}`;

  const visibleNames = names.slice(0, 2).join(', ');
  const remainingCount = names.length - 2;

  return remainingCount > 0 ? `${visibleNames} +${remainingCount} more` : visibleNames;
};

const formatMembershipSize = (church: PublicChurchDetails) => {
  const size = church.membershipSize ?? church.memberCount;

  if (typeof size !== 'number') return null;

  return `${new Intl.NumberFormat().format(size)} members`;
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
  const image = getChurchImage(church);
  const location = getChurchLocation(church);
  const email = getChurchEmail(church);
  const phone = getChurchPhone(church);
  const membershipSize = formatMembershipSize(church);
  const adminsSummary = getPeopleSummary(church.admins, 'admins');
  const pastorsSummary = getPeopleSummary(church.pastors, 'pastors');

  return (
    <section className="overflow-hidden rounded-xl border border-[#D6DEEB] bg-white shadow-[0_16px_34px_rgba(11,31,74,0.1)]">
      <div className="relative min-h-44 bg-[#EAF1FF]">
        {image ? (
          <img className="h-48 w-full object-cover" src={image} alt={church.name} />
        ) : (
          <div className="grid h-48 place-items-center bg-[#EAF1FF] text-[#123B8D]">
            <Church className="size-16" aria-hidden />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B1F4A]/65 to-transparent" />
      </div>

      <div className="grid gap-5 p-4 sm:p-5">
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
          </div>
          <div className="grid gap-1">
            <AppText variant="h2">{church.name}</AppText>
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

        {(adminsSummary || pastorsSummary) && (
          <div className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
            {pastorsSummary && (
              <div className="grid gap-0.5">
                <AppText variant="caption" color="textMuted">
                  Pastors
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {pastorsSummary}
                </AppText>
              </div>
            )}
            {adminsSummary && (
              <div className="grid gap-0.5">
                <AppText variant="caption" color="textMuted">
                  Admins
                </AppText>
                <AppText variant="bodySmall" weight="bold">
                  {adminsSummary}
                </AppText>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const ChurchTabScreen = () => {
  const navigate = useNavigate();
  const { church, error, loading, membershipStatus, retry } = useChurchScreenBootstrapApi();

  if (loading && !church) {
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
    <div className="pb-28">
      <ChurchBanner church={church} />
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
