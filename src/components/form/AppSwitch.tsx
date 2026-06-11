import { type ButtonHTMLAttributes, useState } from 'react';
import clsx from 'clsx';

export interface AppSwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

export const AppSwitch = ({ checked, defaultChecked = false, onCheckedChange, label, className, disabled, ...props }: AppSwitchProps) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      className={clsx(
        'group inline-flex items-center gap-2 border-0 bg-transparent text-sm text-[#46556E] focus-visible:outline-none disabled:opacity-55',
        className,
      )}
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={toggle}
      {...props}
    >
      <span
        className={clsx(
          'relative h-[1.4rem] w-10 rounded-full bg-slate-300 transition group-focus-visible:ring-4 group-focus-visible:ring-[#123B8D]/15 after:absolute after:top-[0.2rem] after:left-[0.2rem] after:size-4 after:rounded-full after:bg-white after:shadow-[0_1px_4px_rgba(11,31,74,0.18)] after:transition',
          isChecked && 'bg-[#123B8D] after:translate-x-[1.1rem]',
        )}
      />
      {label && <span>{label}</span>}
    </button>
  );
};
