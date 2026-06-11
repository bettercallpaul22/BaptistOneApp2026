import { Link } from 'react-router-dom';
import {
  BookMarked,
  Clock3,
  HeartHandshake,
  MapPin,
  Megaphone,
  Share2,
  Sprout,
} from 'lucide-react';
import bibleIcon from '@/assets/icons/app_bible.svg';
import eventIcon from '@/assets/icons/app_event.svg';
import givingIcon from '@/assets/icons/app_giving.svg';
import hymnIcon from '@/assets/icons/app_hymn.svg';
import prayerIcon from '@/assets/icons/app_prayer.svg';
import walletIcon from '@/assets/icons/app_wallet.svg';
import { AppButton, AppText } from '@/components/common';
import { AppCard, QuickActionCard, type QuickActionCardTone } from '@/components/display';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { useAppSelector } from '@/store/hooks';
import { type TypographyVariant } from '@/theme';

type QuickAction = {
  label: string;
  icon: string;
  tone: QuickActionCardTone;
  to?: string;
};

const quickActions: QuickAction[] = [
  { label: 'Bible', icon: bibleIcon, tone: 'primary', to: paths.bible },
  { label: 'Hymns', icon: hymnIcon, tone: 'gold', to: paths.hymnal },
  { label: 'Prayer', icon: prayerIcon, tone: 'plain' },
  { label: 'Events', icon: eventIcon, tone: 'plain' },
  { label: 'Giving', icon: givingIcon, tone: 'plain' },
  { label: 'Wallet', icon: walletIcon, tone: 'plain' },
];

const verseImage =
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1200&q=80';

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';

  return 'Good evening';
};

const getFirstName = (name?: string | null) => name?.trim().split(/\s+/)[0] || null;

export default function HomePage() {
  const authData = useAppSelector((state) => state.auth.authData);
  const { isDesktop, isFoldableDevice, isIPad, isMediumDevice, isSmallDevice, isTablet } = useDeviceProfile();
  const greeting = getTimeOfDayGreeting();
  const displayName =
    getFirstName(authData?.profile.displayName) ||
    getFirstName(authData?.user.firstName) ||
    'there';
  const verseTextVariant: TypographyVariant = isSmallDevice
    ? 'h6'
    : isMediumDevice
      ? 'h5'
      : isFoldableDevice
        ? 'h4'
      : isTablet || isIPad
        ? 'h3'
        : 'h2';
  const verseReferenceVariant: TypographyVariant = isDesktop ? 'bodyLarge' : 'bodySmall';
  const verseLineClamp = isDesktop ? undefined : isTablet || isIPad ? 4 : 3;

  return (
    <AppShell>
      <div className="mx-auto grid max-w-[78rem] gap-1 px-4 py-5 sm:px-6 md:px-9 md:py-9">
          <header className="grid">
            <AppText variant={isSmallDevice ? 'h6' : 'h4'}>{greeting}, {displayName}</AppText>
          </header>

          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="grid gap-7">
              <article
                className="relative min-h-[11.7rem] overflow-hidden rounded-2xl bg-cover bg-center p-4 text-white shadow-[0_14px_28px_rgba(11,31,74,0.15)] sm:min-h-[19.5rem] sm:p-6"
                style={{
                  backgroundImage: `linear-gradient(90deg,rgba(13,31,58,0.38),rgba(13,31,58,0.2)),url(${verseImage})`,
                }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,13,27,0.1)_0%,rgba(4,13,27,0.55)_100%)]" />
                <div className="relative z-10 flex h-full min-h-[9.7rem] flex-col justify-between gap-2 sm:min-h-[15rem] sm:gap-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-md bg-white px-3 py-1.5 text-xs font-extrabold text-[#0B1F4A] sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm">
                      Verse of the Day
                    </span>
                    <div className="flex gap-2 sm:gap-3">
                      <BookMarked className="size-5 sm:size-6" aria-hidden />
                      <Share2 className="size-5 sm:size-6" aria-hidden />
                    </div>
                  </div>
                  <AppText variant={verseTextVariant} color="textInverse" weight="regular" lineClamp={verseLineClamp}>
                    &quot;For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.&quot;
                  </AppText>
                  <AppText variant={verseReferenceVariant} color="textInverse" weight="semibold">
                    - John 3:16 (NIV)
                  </AppText>
                </div>
              </article>

              <section className="grid gap-4">
                <AppText variant="h4">Quick Access</AppText>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {quickActions.map((action) => (
                    <QuickActionCard key={action.label} {...action} />
                  ))}
                </div>
              </section>

              <AppCard className="shadow-[0_10px_22px_rgba(11,31,74,0.08)]">
                <div className="grid gap-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Megaphone className="size-5 text-[#D4A017]" aria-hidden />
                      <AppText variant="h5">Church Updates</AppText>
                    </div>
                    <Link className="text-sm font-bold text-[#123B8D]" to={paths.home}>
                      View all
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    <AppText variant="bodySmall" color="textMuted">
                      Yesterday • Pastor&apos;s Desk
                    </AppText>
                    <AppText variant="subtitle">Midweek Service Time Change</AppText>
                    <AppText variant="bodyMedium" color="textSecondary">
                      Please note that this week&apos;s Wednesday Bible study will commence at 6:00 PM instead of the usual 5:30 PM due to...
                    </AppText>
                  </div>
                </div>
              </AppCard>
            </section>

            <aside className="grid content-start gap-7">
              <AppCard>
                <div className="grid gap-5">
                  <AppText variant="h4">Upcoming Event</AppText>
                  <div className="grid gap-5 rounded-lg border border-[#E5E7EB] bg-[#FBFCFE] p-5">
                    <div className="grid grid-cols-[4rem_1fr] gap-4">
                      <div className="grid size-16 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-center">
                        <span className="block text-sm font-extrabold text-red-500">Oct</span>
                        <span className="block text-2xl font-extrabold text-[#0B1F4A]">15</span>
                      </div>
                      <div className="grid gap-2">
                        <AppText variant="subtitle">Youth Harvest Thanksgiving</AppText>
                        <div className="grid gap-1 text-sm text-[#79859A]">
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="size-4" aria-hidden />
                            09:00 AM - 01:00 PM
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-4 fill-current/10" aria-hidden />
                            Main Auditorium
                          </span>
                        </div>
                      </div>
                    </div>
                    <AppButton variant="outline">RSVP Now</AppButton>
                  </div>
                </div>
              </AppCard>

              <section className="grid gap-5 rounded-xl bg-[#123B8D] p-6 text-white shadow-[0_12px_24px_rgba(18,59,141,0.24)]">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-white/15">
                    <HeartHandshake className="size-6" aria-hidden />
                  </span>
                  <AppText variant="h4" color="textInverse">
                    Prayer Wall
                  </AppText>
                </div>
                <AppText variant="bodyLarge" color="#D8E4FF">
                  Share your burdens or join in praying for others in the community.
                </AppText>
                <div className="grid gap-3">
                  <AppButton variant="outline">Submit Request</AppButton>
                  <AppButton className="border-white/25 bg-transparent text-white shadow-none" variant="outline">
                    View Community Prayers
                  </AppButton>
                </div>
              </section>

              <AppCard>
                <div className="grid gap-5">
                  <div className="flex items-center justify-between gap-4">
                    <AppText variant="h4">Recent Giving</AppText>
                    <Link className="text-sm font-bold text-[#123B8D]" to={paths.home}>
                      History
                    </Link>
                  </div>
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-[#E5E7EB] bg-[#FBFCFE] p-4">
                    <span className="grid size-11 place-items-center rounded-full bg-green-100 text-green-600">
                      <Sprout className="size-6 fill-current/10" aria-hidden />
                    </span>
                    <div>
                      <AppText variant="subtitle">Tithe</AppText>
                      <AppText variant="bodySmall" color="textMuted">
                        Oct 1, 2023
                      </AppText>
                    </div>
                    <AppText variant="subtitle">₦50,000</AppText>
                  </div>
                  <AppButton className="bg-[#111827] text-white" leftIcon={<span className="text-xl leading-none">+</span>}>
                    Give Now
                  </AppButton>
                </div>
              </AppCard>
            </aside>
          </div>
      </div>
    </AppShell>
  );
}
