import { type ReactNode } from 'react';
import clsx from 'clsx';
import { AppLoader } from '@/components/feedback/AppLoader';

export interface AppCardProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  className?: string;
}

export const AppCard = ({ header, children, footer, loading = false, className }: AppCardProps) => (
  <section className={clsx('overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_12px_28px_rgba(11,31,74,0.1)]', className)}>
    {header && <header className="border-b border-slate-100 p-4">{header}</header>}
    <div className="p-4">{loading ? <AppLoader variant="skeleton" /> : children}</div>
    {footer && <footer className="border-t border-slate-100 p-4">{footer}</footer>}
  </section>
);
