import { LogOut } from 'lucide-react';
import { QuickActionCard } from '@/components/display';
import { AppMobileHeader } from '@/components/navigation';
import { menuItems } from './menuItems';

interface MenuScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const MenuScreen = ({ isOpen, onClose, onLogout }: MenuScreenProps) => {
  if (!isOpen) return null;

  return (
    <section
      className="fixed inset-0 z-[70] grid grid-rows-[auto_minmax(0,1fr)_auto] bg-[#F7F8FB] text-[#123B8D]"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <AppMobileHeader title="Menu" action="close" position="static" onActionPress={onClose} />

      <div className="overflow-y-auto px-4 py-7 sm:px-6 sm:py-10">
        <nav className="mx-auto grid max-w-[39rem] grid-cols-3 gap-3" aria-label="Menu navigation">
          {menuItems.map((item) => (
            <QuickActionCard key={item.label} className="sm:min-h-32" {...item} onClick={onClose} />
          ))}
        </nav>
      </div>

      <footer className="border-t border-[#E5E7EB] bg-[#F8FAFD] px-6 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-10">
        <button
          className="flex min-h-14 items-center gap-4 border-0 bg-transparent text-2xl font-medium text-[#DC2626]"
          type="button"
          onClick={onLogout}
        >
          <LogOut className="size-9" strokeWidth={2.5} aria-hidden />
          <span>Logout</span>
        </button>
      </footer>
    </section>
  );
};
