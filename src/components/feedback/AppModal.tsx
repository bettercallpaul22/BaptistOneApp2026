import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AppButton } from '@/components/common/AppButton';

export interface AppModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  footerLayout?: 'default' | 'split';
  onClose: () => void;
}

export const AppModal = ({ open, title, children, footer, footerLayout = 'default', onClose }: AppModalProps) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B1F4A]/60 p-4" role="presentation" onMouseDown={onClose}>
      <section
        className="w-full max-w-[34rem] overflow-hidden rounded-xl bg-white shadow-[0_24px_60px_rgba(11,31,74,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 p-4">
          <h2 className="m-0 text-lg font-semibold text-[#0B1F4A]">{title}</h2>
          <AppButton aria-label="Close modal" size="sm" variant="ghost" onClick={onClose}>
            Close
          </AppButton>
        </header>
        <div className="p-4 text-[#46556E]">{children}</div>
        {footer && (
          <footer
            className={clsx(
              'flex items-center gap-4 border-t border-slate-100 p-4',
              footerLayout === 'split' ? '[&>*]:flex-1' : 'justify-between',
            )}
          >
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
};
