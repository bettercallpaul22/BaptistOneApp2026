import { type ReactNode } from 'react';
import { BookOpen, Building2, Church, Music2, Search, User, Wallet } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppCard } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';

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

export default function AppTabPage({ kind }: AppTabPageProps) {
  const content = tabContent[kind];
  const PageIcon = content.icon;

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
