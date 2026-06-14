import { AppLoader } from '@/components/feedback';

export const ProfileLoading = () => (
  <div className="grid gap-4">
    <div className="min-h-36 animate-pulse rounded-xl bg-[#EAF1FF]" />
    <div className="grid gap-3 sm:grid-cols-2">
      <AppLoader variant="skeleton" className="min-h-28" label="Loading profile summary" />
      <AppLoader variant="skeleton" className="min-h-28" label="Loading profile progress" />
    </div>
  </div>
);
