import { type InputHTMLAttributes, useId } from 'react';
import clsx from 'clsx';

export interface AppCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const AppCheckbox = ({ id, label, error, className, ...props }: AppCheckboxProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={clsx('grid gap-1', className)}>
      <label className="inline-flex items-center gap-2 text-sm text-[#46556E]" htmlFor={inputId}>
        <input id={inputId} className="peer sr-only" type="checkbox" aria-invalid={Boolean(error)} {...props} />
        <span className="grid size-4 place-items-center rounded border border-slate-300 bg-white peer-checked:border-[#123B8D] peer-checked:bg-[#123B8D] peer-focus-visible:ring-4 peer-focus-visible:ring-[#123B8D]/15 after:hidden after:size-2 after:rotate-45 after:border-r-2 after:border-b-2 after:border-white peer-checked:after:block" />
        {label && <span>{label}</span>}
      </label>
      {error && <span className="text-xs text-[#DC2626]">{error}</span>}
    </div>
  );
};
