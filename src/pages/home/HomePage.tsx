import { type CSSProperties, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Share2,
} from 'lucide-react';
import bibleIcon from '@/assets/icons/app_bible.svg';
import eventIcon from '@/assets/icons/app_event.svg';
import familyIcon from '@/assets/icons/app_family.svg';
import forumIcon from '@/assets/icons/app_forum.svg';
import givingIcon from '@/assets/icons/app_giving.svg';
import hymnIcon from '@/assets/icons/app_hymn.svg';
import ministryIcon from '@/assets/icons/app_ministry.svg';
import walletIcon from '@/assets/icons/app_wallet.svg';
import { AppButton, AppText } from '@/components/common';
import { QuickActionCard, type QuickActionCardTone } from '@/components/display';
import { AppModal } from '@/components/feedback';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { useHomeBootstrapApi } from '@/hooks/useHomeBootstrapApi';
import { AppShell } from '@/layouts/AppShell';
import { paths } from '@/routes/paths';
import { useAppSelector } from '@/store/hooks';
import { type TypographyVariant } from '@/theme';

type QuickAction = {
  label: string;
  icon: string;
  tone: QuickActionCardTone;
  to?: string;
  requiresAuth?: boolean;
};

const quickActions: QuickAction[] = [
  { label: 'Bible', icon: bibleIcon, tone: 'primary', to: paths.bible },
  { label: 'Hymns', icon: hymnIcon, tone: 'gold', to: paths.hymnal },
  { label: 'Events', icon: eventIcon, tone: 'plain', to: paths.events, requiresAuth: true },
  { label: 'Forum', icon: forumIcon, tone: 'plain', to: paths.forum, requiresAuth: true },
  { label: 'Ministry', icon: ministryIcon, tone: 'plain', to: paths.ministries, requiresAuth: true },
  { label: 'Giving', icon: givingIcon, tone: 'plain', to: paths.donation, requiresAuth: true },
  { label: 'Wallet', icon: walletIcon, tone: 'plain', to: paths.wallet, requiresAuth: true },
  { label: 'Family', icon: familyIcon, tone: 'plain', to: paths.family, requiresAuth: true },
];

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';

  return 'Good evening';
};

const getFirstName = (name?: string | null) => name?.trim().split(/\s+/)[0] || null;

const defaultDevotionalBanner = {
  source: 'daily-scripture',
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  reference: 'John 3:16 (NIV)',
  imageUrl: null,
  overlay: null,
} as const;

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const { authData, isAuthenticated } = useAppSelector((state) => state.auth);
  const memberAccount = useAppSelector((state) => state.member.data);
  const devotionalBanner = useAppSelector((state) => state.home.devotionalBanner);
  useHomeBootstrapApi();

  const { isDesktop, isFoldableDevice, isIPad, isMediumDevice, isSmallDevice, isTablet } = useDeviceProfile();
  const greeting = getTimeOfDayGreeting();
  const displayName =
    getFirstName(memberAccount?.basicProfile?.displayName) ||
    getFirstName(memberAccount?.basicProfile?.firstName) ||
    getFirstName(authData?.profile?.displayName) ||
    getFirstName(authData?.user?.firstName) ||
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
  const banner = devotionalBanner ?? defaultDevotionalBanner;
  const bannerImageUrl = banner.imageUrl?.trim() || null;
  const bannerStyle: CSSProperties = bannerImageUrl
    ? {
        backgroundImage: `url(${JSON.stringify(bannerImageUrl)})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : {};
  const bannerOverlay = bannerImageUrl
    ? banner.overlay?.enabled
      ? banner.overlay
      : { color: '#000000', opacity: 0.38 }
    : null;
  const closeLoginPrompt = () => setIsLoginPromptOpen(false);

  const handleLoginPromptConfirm = () => {
    setIsLoginPromptOpen(false);
    navigate(paths.login);
  };

  return (
    <AppShell>
      <div className="mx-auto grid max-w-[78rem] gap-1 px-4 py-5 sm:px-6 md:px-9 md:py-9">
          <header className="grid">
            <AppText variant={isSmallDevice ? 'h6' : 'h4'}>{greeting}, {displayName}</AppText>
          </header>

          <div className="grid gap-7">
            <section className="grid gap-7">
              <article
                className="relative min-h-[11.7rem] cursor-pointer overflow-hidden rounded-2xl bg-[#06202B] p-4 text-white shadow-[0_14px_28px_rgba(11,31,74,0.15)] transition-transform duration-200 active:scale-[0.98] sm:min-h-[19.5rem] sm:p-6"
                style={bannerStyle}
                role="button"
                tabIndex={0}
                onClick={() => navigate(paths.devotional)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    navigate(paths.devotional);
                  }
                }}
              >
                {bannerOverlay ? (
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      backgroundColor: bannerOverlay.color,
                      opacity: bannerOverlay.opacity,
                    }}
                  />
                ) : null}
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
                    &quot;{banner.text}&quot;
                  </AppText>
                  <div className="grid gap-1">
                    {banner.source === 'church' && banner.title ? (
                      <AppText variant="bodySmall" color="textInverse" weight="medium" lineClamp={1}>
                        {banner.title}
                      </AppText>
                    ) : null}
                    <AppText variant={verseReferenceVariant} color="textInverse" weight="semibold">
                      - {banner.reference}
                    </AppText>
                  </div>
                </div>
              </article>

              <section className="grid gap-4">
                <AppText variant="h4">Quick Access</AppText>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {quickActions.map((action) => {
                    const shouldPromptForLogin = action.requiresAuth && !isAuthenticated;

                    return (
                      <QuickActionCard
                        key={action.label}
                        {...action}
                        to={shouldPromptForLogin ? undefined : action.to}
                        onClick={shouldPromptForLogin ? () => setIsLoginPromptOpen(true) : undefined}
                      />
                    );
                  })}
                </div>
              </section>

            </section>
          </div>
      </div>
      <AppModal
        open={isLoginPromptOpen}
        title="Login required"
        onClose={closeLoginPrompt}
        footerLayout="split"
        footer={
          <>
            <AppButton variant="secondary" onClick={closeLoginPrompt}>
              Cancel
            </AppButton>
            <AppButton onClick={handleLoginPromptConfirm}>Login</AppButton>
          </>
        }
      >
        Please login to continue.
      </AppModal>
    </AppShell>
  );
}
