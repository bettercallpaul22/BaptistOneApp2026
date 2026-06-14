import type { ReactNode } from 'react';
import { AppText } from '@/components/common';

export const SectionShell = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
    <div className="flex items-center justify-between gap-3">
      <AppText variant="h6">{title}</AppText>
      {action}
    </div>
    {children}
  </section>
);
