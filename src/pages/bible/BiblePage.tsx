import { lazy, Suspense, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { AppLoader } from '@/components/feedback';
import { AppShell } from '@/layouts/AppShell';

const BibleReader = lazy(() => import('./BibleReader'));

interface BiblePageProps {
  onBottomTabHiddenChange?: (hidden: boolean) => void;
}

const BibleLoading = () => (
  <div className="min-h-[calc(100vh-4rem)] bg-[#F6F8FC] px-4 pt-5 pb-36 sm:px-6 md:px-9 md:py-8 md:pb-32">
    <div className="mx-auto grid max-w-[78rem] gap-5">
      <section className="grid gap-4 rounded-2xl border border-[#E5EAF3] bg-white p-5 shadow-[0_12px_30px_rgba(11,31,74,0.08)] sm:p-6">
        <div className="flex items-center gap-3 text-[#123B8D]">
          <span className="grid size-11 place-items-center rounded-xl bg-[#EAF1FF]">
            <BookOpen className="size-6" aria-hidden />
          </span>
          <h1 className="m-0 text-3xl font-black tracking-[0] text-[#0B1F4A]">Bible</h1>
        </div>
        <AppLoader className="justify-start py-4" label="Loading Bible" />
      </section>
      <section className="grid gap-4 rounded-2xl border border-[#E5EAF3] bg-white p-5 shadow-[0_10px_24px_rgba(11,31,74,0.05)] sm:p-7">
        {Array.from({ length: 10 }, (_, index) => (
          <div className="flex animate-pulse gap-3" key={index}>
            <span className="size-7 rounded-full bg-[#E8EEF9]" />
            <span className="h-5 flex-1 rounded-full bg-[#EDF2FA]" />
          </div>
        ))}
      </section>
    </div>
  </div>
);

export default function BiblePage({ onBottomTabHiddenChange }: BiblePageProps) {
  useEffect(() => {
    onBottomTabHiddenChange?.(false);
  }, [onBottomTabHiddenChange]);

  return (
    <AppShell>
      <Suspense fallback={<BibleLoading />}>
        <BibleReader onBottomTabHiddenChange={onBottomTabHiddenChange} />
      </Suspense>
    </AppShell>
  );
}
