import { Link } from 'react-router-dom';
import clsx from 'clsx';

export type QuickActionCardTone = 'primary' | 'gold' | 'plain';

export interface QuickActionCardProps {
  label: string;
  icon: string;
  tone?: QuickActionCardTone;
  to?: string;
  className?: string;
  onClick?: () => void;
}

const toneClasses: Record<QuickActionCardTone, string> = {
  primary: 'border-[#123B8D] bg-[#123B8D] text-white shadow-[0_10px_18px_rgba(18,59,141,0.2)]',
  gold: 'border-[#D4A017] bg-[#D4A017] text-white shadow-[0_10px_18px_rgba(212,160,23,0.2)]',
  plain: 'border-[#E5E7EB] bg-white text-[#123B8D] shadow-[0_8px_16px_rgba(11,31,74,0.08)]',
};

const textClasses: Record<QuickActionCardTone, string> = {
  primary: 'text-white',
  gold: 'text-white',
  plain: 'text-[#123B8D]',
};

const baseClasses =
  'grid aspect-square min-h-24 place-items-center gap-2 rounded-xl border p-3 text-center text-sm font-extrabold leading-tight tracking-[0] transition hover:-translate-y-0.5';

export const QuickActionCard = ({ label, icon, tone = 'plain', to, className, onClick }: QuickActionCardProps) => {
  const content = (
    <>
      <img className="size-8 object-contain" src={icon} alt="" aria-hidden />
      <span className={textClasses[tone]}>{label}</span>
    </>
  );
  const resolvedClassName = clsx(baseClasses, toneClasses[tone], className);

  if (to) {
    return (
      <Link className={resolvedClassName} to={to} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button className={resolvedClassName} type="button" onClick={onClick}>
      {content}
    </button>
  );
};
