import { type ReactNode } from 'react';
import clsx from 'clsx';
import { AppText } from '@/components/common';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  contentClassName?: string;
}

export const AuthLayout = ({ title, subtitle, children, contentClassName }: AuthLayoutProps) => (
  <main className="grid min-h-screen place-items-center bg-white px-4 py-8">
    <section className={clsx('grid w-full max-w-[26rem] gap-5', contentClassName)}>
      <div className="grid gap-1">
        <AppText variant="h4" align="center">
          {title}
        </AppText>
        <AppText variant="caption" align="center" color="textMuted">
          {subtitle}
        </AppText>
      </div>
      {children}
    </section>
  </main>
);
