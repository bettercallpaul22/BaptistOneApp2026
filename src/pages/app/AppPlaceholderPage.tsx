import { AppText } from '@/components/common';
import { AppCard } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';

interface AppPlaceholderPageProps {
  title: string;
}

export default function AppPlaceholderPage({ title }: AppPlaceholderPageProps) {
  return (
    <AppShell>
      <div className="mx-auto grid max-w-[78rem] gap-6 px-4 py-6 sm:px-6 md:px-9 md:py-9">
        <AppCard className="shadow-[0_10px_22px_rgba(11,31,74,0.08)]">
          <div className="grid min-h-52 place-items-center gap-2 text-center">
            <AppText variant="h3">{title}</AppText>
            <AppText variant="bodyMedium" color="textSecondary">
              This section is coming soon.
            </AppText>
          </div>
        </AppCard>
      </div>
    </AppShell>
  );
}
