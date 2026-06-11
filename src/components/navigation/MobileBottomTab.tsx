import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, Church, Home, Music2, User } from 'lucide-react';
import { AppButton } from '@/components/common';
import { AppModal } from '@/components/feedback';
import { paths } from '@/routes/paths';
import { useAppSelector } from '@/store/hooks';

const tabs = [
  { label: 'Home', to: paths.home, icon: Home, protected: false, match: (pathname: string) => pathname === paths.home },
  { label: 'Bible', to: paths.bible, icon: BookOpen, protected: false, match: (pathname: string) => pathname === paths.bible },
  { label: 'Hymnal', to: paths.hymnal, icon: Music2, protected: false, match: (pathname: string) => pathname === paths.hymnal },
  { label: 'Church', to: paths.church, icon: Church, protected: true, match: (pathname: string) => pathname === paths.church },
  { label: 'Profile', to: paths.profile, icon: User, protected: true, match: (pathname: string) => pathname === paths.profile },
];

interface MobileBottomTabProps {
  hidden?: boolean;
}

export const MobileBottomTab = ({ hidden = false }: MobileBottomTabProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  const closeLoginPrompt = () => setIsLoginPromptOpen(false);

  const handleLoginPromptConfirm = () => {
    setIsLoginPromptOpen(false);
    navigate(paths.login);
  };

  return (
    <>
      <nav
        className={clsx(
          'fixed right-0 bottom-0 left-0 z-50 grid min-h-[calc(4.75rem+env(safe-area-inset-bottom))] grid-cols-5 gap-1 border-t border-[#E5E7EB] bg-white/95 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-18px_42px_rgba(11,31,74,0.14)] backdrop-blur transition duration-[220ms] ease-out',
          hidden && 'translate-y-full opacity-0',
        )}
        aria-label="Web app bottom navigation"
      >
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;

          return (
            <Link
              className={clsx(
                'group relative grid min-w-0 place-items-center gap-1 overflow-hidden rounded-xl border border-transparent px-1 py-1 text-[0.6875rem] font-bold text-[#79859A] transition-all duration-300 ease-out active:scale-95',
                active
                  ? '-translate-y-1 border-[#123B8D] bg-[#EAF1FF] text-[#123B8D]'
                  : 'hover:-translate-y-0.5 hover:bg-slate-50 hover:text-[#123B8D]',
              )}
              key={tab.label}
              to={tab.to}
              onClick={(event) => {
                if (!tab.protected || isAuthenticated) return;

                event.preventDefault();
                setIsLoginPromptOpen(true);
              }}
            >
              <span
                className={clsx(
                  'grid size-8 place-items-center rounded-full transition-all duration-300 ease-out',
                  active ? 'animate-[tab-pop_360ms_ease-out_both] bg-white text-[#123B8D]' : 'group-hover:bg-[#EAF1FF]',
                )}
              >
                <Icon className={clsx('size-5 transition-transform duration-300', active && 'fill-[#123B8D]/10')} aria-hidden />
              </span>
              <span className={clsx('truncate transition-all duration-300', active ? 'translate-y-0 opacity-100' : 'translate-y-0.5 opacity-80')}>
                {tab.label}
              </span>
              <span
                className={clsx(
                  'h-1 w-8 origin-center rounded-full bg-[#123B8D] transition-opacity duration-300',
                  active ? 'animate-[tab-glow_220ms_ease-out_both]' : 'opacity-0',
                )}
                aria-hidden
              />
            </Link>
          );
        })}
      </nav>
      <AppModal
        open={isLoginPromptOpen}
        title="Login required"
        onClose={closeLoginPrompt}
        footerLayout="split"
        footer={
          <>
            <AppButton variant="outline" onClick={closeLoginPrompt}>
              Cancel
            </AppButton>
            <AppButton onClick={handleLoginPromptConfirm}>Login</AppButton>
          </>
        }
      >
        Please login to continue.
      </AppModal>
    </>
  );
};
