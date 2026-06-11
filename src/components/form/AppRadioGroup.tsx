export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface AppRadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
}

export const AppRadioGroup = ({ name, options, value, label, error, onChange }: AppRadioGroupProps) => (
  <fieldset className="grid gap-2.5 border-0 p-0" aria-invalid={Boolean(error)}>
    {label && <legend className="mb-0.5 text-xs font-bold text-[#0B1F4A]">{label}</legend>}
    {options.map((option) => (
      <label className="inline-flex items-center gap-2 text-sm text-[#46556E]" key={option.value}>
        <input
          className="peer sr-only"
          checked={value === option.value}
          disabled={option.disabled}
          name={name}
          type="radio"
          value={option.value}
          onChange={() => onChange?.(option.value)}
        />
        <span className="size-4 rounded-full border border-slate-300 peer-checked:border-[5px] peer-checked:border-[#123B8D] peer-focus-visible:ring-4 peer-focus-visible:ring-[#123B8D]/15" />
        <span>{option.label}</span>
      </label>
    ))}
    {error && <span className="text-xs text-[#DC2626]">{error}</span>}
  </fieldset>
);
