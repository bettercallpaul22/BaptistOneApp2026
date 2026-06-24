import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Plus, Trash2, X, ChevronDown, Search } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback';
import { AppDropdown, AppFileUploadField, AppInput, AppSwitch } from '@/components/form';
import { useAppDispatch } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import { updateProfileCompletionSectionThunk } from '@/store/thunks/profileThunk';
import type { ProfileCompletion } from '@/types/profile';
import { memberUploadDefaults } from '../config/profileConfig';
import type {
  ChildFormValue,
  DependantFormValue,
  EditableFieldValue,
} from '../types/profilePageTypes';
import { formatLabel, getSubmitErrorMessage } from '../utils/profileFormatters';
import {
  buildInitialFormValues,
  buildSectionPayload,
  createEmptyChild,
  createEmptyDependant,
  getEditableFields,
  getVisibleFields,
  isStringArray,
} from '../utils/profileFormUtils';

const SearchSelectField = ({
  fieldLabel,
  value,
  options,
  placeholder,
  onChange,
}: {
  fieldLabel: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
        {fieldLabel}
      </span>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => searchInputRef.current?.focus(), 0);
            }
          }}
          className={`flex w-full items-center justify-between rounded-[10px] border-[1.5px] bg-white px-3.5 py-2.5 text-sm text-left transition-all duration-150 ${
            isOpen
              ? 'border-[#123B8D] ring-3 ring-[#123B8D]/10'
              : 'border-[#D5DCE8] hover:border-[#123B8D]'
          }`}
        >
          <span className={selectedOption ? 'text-[#0B1F4A]' : 'text-[#A8B3C4]'}>
            {selectedOption?.label ?? placeholder ?? `Select ${fieldLabel}`}
          </span>
          <ChevronDown
            className={`size-4 text-[#5A6880] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#D5DCE8] bg-white shadow-lg">
            <div className="border-b border-[#EEF2F7] p-2">
              <div className="flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2">
                <Search className="size-4 text-[#A8B3C4]" aria-hidden />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#0B1F4A] outline-none placeholder:text-[#A8B3C4]"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[#A8B3C4]">No options found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      value === option.value
                        ? 'bg-[#EEF4FF] text-[#123B8D] font-semibold'
                        : 'text-[#0B1F4A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProfileSectionEditModal = ({
  sectionKey,
  sectionTitle,
  sectionData,
  fieldNames,
  open,
  onClose,
}: {
  sectionKey: keyof ProfileCompletion;
  sectionTitle: string;
  sectionData: unknown;
  fieldNames?: string[];
  open: boolean;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const editableFields = useMemo(
    () => getEditableFields(sectionKey, sectionData),
    [sectionData, sectionKey],
  );
  const fields = useMemo(
    () => {
      return fieldNames?.length
        ? editableFields.filter((field) => fieldNames.includes(field.name))
        : editableFields;
    },
    [editableFields, fieldNames],
  );
  const [formValues, setFormValues] = useState<Record<string, EditableFieldValue>>(() =>
    buildInitialFormValues(sectionData, editableFields),
  );
  const initialValuesRef = useRef<Record<string, EditableFieldValue>>(
    buildInitialFormValues(sectionData, editableFields),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});
  const visibleFields = useMemo(
    () => getVisibleFields(sectionKey, fields, formValues),
    [fields, formValues, sectionKey],
  );

  const hasChanges = useMemo(() => {
    const current = JSON.stringify(formValues);
    const initial = JSON.stringify(initialValuesRef.current);
    return current !== initial;
  }, [formValues]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const initial = buildInitialFormValues(sectionData, editableFields);
      initialValuesRef.current = initial;
      setFormValues(initial);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [editableFields, sectionData]);

  const setFieldValue = (name: string, value: EditableFieldValue) => {
    setFormValues((current) => ({ ...current, [name]: value }));
    setSubmitError(null);
  };

  const setChildValue = (
    fieldName: string,
    index: number,
    childKey: keyof ChildFormValue,
    value: string,
  ) => {
    setFormValues((current) => {
      const children = Array.isArray(current[fieldName])
        ? ([...(current[fieldName] as ChildFormValue[])] as ChildFormValue[])
        : [];
      children[index] = { ...(children[index] ?? createEmptyChild()), [childKey]: value };
      return { ...current, [fieldName]: children };
    });
    setSubmitError(null);
  };

  const addChild = (fieldName: string) => {
    setFormValues((current) => {
      const children = Array.isArray(current[fieldName])
        ? (current[fieldName] as ChildFormValue[])
        : [];
      return { ...current, [fieldName]: [...children, createEmptyChild()] };
    });
    setSubmitError(null);
  };

  const removeChild = (fieldName: string, index: number) => {
    setFormValues((current) => {
      const children = Array.isArray(current[fieldName])
        ? (current[fieldName] as ChildFormValue[])
        : [];
      return { ...current, [fieldName]: children.filter((_, childIndex) => childIndex !== index) };
    });
    setSubmitError(null);
  };

  const setDependantValue = (
    fieldName: string,
    index: number,
    dependantKey: keyof DependantFormValue,
    value: string | boolean,
  ) => {
    setFormValues((current) => {
      const dependants = Array.isArray(current[fieldName])
        ? ([...(current[fieldName] as DependantFormValue[])] as DependantFormValue[])
        : [];
      dependants[index] = {
        ...(dependants[index] ?? createEmptyDependant()),
        [dependantKey]: value,
      };
      return { ...current, [fieldName]: dependants };
    });
    setSubmitError(null);
  };

  const addDependant = (fieldName: string) => {
    setFormValues((current) => {
      const dependants = Array.isArray(current[fieldName])
        ? (current[fieldName] as DependantFormValue[])
        : [];
      return { ...current, [fieldName]: [...dependants, createEmptyDependant()] };
    });
    setSubmitError(null);
  };

  const removeDependant = (fieldName: string, index: number) => {
    setFormValues((current) => {
      const dependants = Array.isArray(current[fieldName])
        ? (current[fieldName] as DependantFormValue[])
        : [];
      return {
        ...current,
        [fieldName]: dependants.filter((_, dependantIndex) => dependantIndex !== index),
      };
    });
    setSubmitError(null);
  };

  const toggleCollapse = (key: string) => {
    setCollapsedItems((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await dispatch(
        updateProfileCompletionSectionThunk({
          sectionKey: String(sectionKey),
          data: buildSectionPayload(
            fieldNames?.length
              ? getVisibleFields(sectionKey, editableFields, formValues)
              : visibleFields,
            formValues,
          ),
        }),
      ).unwrap();
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Profile updated',
          message: `${sectionTitle} has been updated successfully.`,
        }),
      );
      onClose();
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      open={open}
      title={`Update ${sectionTitle}`}
      footer={
        <>
          <AppButton fullWidth variant="secondary" type="button" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            fullWidth
            form={`profile-${String(sectionKey)}-form`}
            loading={submitting}
            disabled={!hasChanges}
            type="submit"
          >
            Save
          </AppButton>
        </>
      }
      onClose={onClose}
    >
      <form
        className="grid min-h-[20rem] max-h-[74vh] content-start gap-4 overflow-y-auto pb-8 pr-1"
        id={`profile-${String(sectionKey)}-form`}
        onSubmit={handleSubmit}
      >
        {sectionKey === 'identityInformation' && (
          <div className="rounded-lg border border-[#EEF2F7] bg-[#F8FAFC] p-3">
            <AppText variant="caption" color="textSecondary">
              Your identity information is required to enable wallet and payment features on your account.
            </AppText>
          </div>
        )}
        {submitError && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {submitError}
          </div>
        )}
        {visibleFields.map((field) => {
          const fieldLabel = field.label ?? formatLabel(field.name);
          const value = formValues[field.name] ?? '';

          if (field.type === 'select') {
            return (
              <AppDropdown
                key={field.name}
                label={fieldLabel}
                options={field.options ?? []}
                placeholder={field.placeholder ?? `Select ${fieldLabel}`}
                disabled={field.disabled}
                value={String(value)}
                onChange={(nextValue) =>
                  setFieldValue(
                    field.name,
                    Array.isArray(nextValue) ? (nextValue[0] ?? '') : nextValue,
                  )
                }
              />
            );
          }

          if (field.type === 'radio') {
            const options = field.options ?? [];
            return (
              <div className="grid gap-2" key={field.name}>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                  {fieldLabel}
                </span>
                <div className="flex flex-wrap gap-3">
                  {options.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                        value === option.value
                          ? 'border-[#123B8D] bg-[#EEF4FF] text-[#123B8D]'
                          : 'border-[#D5DCE8] bg-white text-[#5A6880] hover:border-[#123B8D]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => setFieldValue(field.name, option.value)}
                        className="sr-only"
                      />
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                          value === option.value
                            ? 'border-[#123B8D]'
                            : 'border-[#D5DCE8]'
                        }`}
                      >
                        {value === option.value && (
                          <span className="size-2 rounded-full bg-[#123B8D]" />
                        )}
                      </span>
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          }

          if (field.type === 'search-select') {
            return (
              <SearchSelectField
                key={field.name}
                fieldLabel={fieldLabel}
                value={String(value)}
                options={field.options ?? []}
                placeholder={field.placeholder}
                onChange={(nextValue) => setFieldValue(field.name, nextValue)}
              />
            );
          }

          if (field.type === 'multi-select') {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            const options = field.options ?? [];

            const toggleOption = (optionValue: string) => {
              const next = selected.includes(optionValue)
                ? selected.filter((v) => v !== optionValue)
                : [...selected, optionValue];
              setFieldValue(field.name, next);
            };

            return (
              <div className="grid gap-2" key={field.name}>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                  {fieldLabel}
                </span>
                <div className="rounded-[10px] border-[1.5px] border-[#D5DCE8] bg-white p-2">
                  {selected.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {selected.map((val) => {
                        const option = options.find((o) => o.value === val);
                        return (
                          <span
                            key={val}
                            className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#123B8D]"
                          >
                            {option?.label ?? val}
                            <button
                              type="button"
                              onClick={() => toggleOption(val)}
                              className="ml-0.5 rounded-full p-0.5 hover:bg-[#D6DEEB]"
                            >
                              <X className="size-3" aria-hidden />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {options
                      .filter((o) => !selected.includes(o.value))
                      .map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleOption(option.value)}
                          className="rounded-full border border-[#D5DCE8] bg-white px-2.5 py-1 text-xs font-medium text-[#5A6880] transition-colors hover:border-[#123B8D] hover:text-[#123B8D]"
                        >
                          {option.label}
                        </button>
                      ))}
                  </div>
                  {selected.length === 0 && options.length === 0 && (
                    <span className="text-xs text-[#A8B3C4]">No options available</span>
                  )}
                </div>
              </div>
            );
          }

          if (field.type === 'children-list') {
            const children = Array.isArray(value) ? (value as ChildFormValue[]) : [];

            return (
              <div className="grid gap-3" key={field.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                    {fieldLabel}
                  </span>
                  <AppButton
                    leftIcon={<Plus className="size-4" aria-hidden />}
                    size="sm"
                    variant="outline"
                    onClick={() => addChild(field.name)}
                  >
                    Add child
                  </AppButton>
                </div>
                {children.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#6B7890]">
                    No child added yet.
                  </div>
                ) : (
                  children.map((child, index) => {
                    const isCollapsed = collapsedItems[`${field.name}-${index}`] ?? false;
                    const computedAge = child.dob
                      ? String(Math.floor((Date.now() - new Date(child.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
                      : '';
                    return (
                      <div
                        className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC]"
                        key={index}
                      >
                        <div className="flex items-center justify-between gap-3 px-3 py-2">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left"
                            onClick={() => toggleCollapse(`${field.name}-${index}`)}
                          >
                            <ChevronDown
                              className={`size-4 text-[#5A6880] transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                              aria-hidden
                            />
                            <AppText variant="bodySmall" weight="bold">
                              {child.name || `Child ${index + 1}`}
                              {computedAge ? `, ${computedAge} yrs` : ''}
                            </AppText>
                          </button>
                          <AppButton
                            leftIcon={<Trash2 className="size-4" aria-hidden />}
                            size="sm"
                            variant="ghost"
                            onClick={() => removeChild(field.name, index)}
                          >
                            Remove
                          </AppButton>
                        </div>
                        {!isCollapsed && (
                          <div className="grid gap-3 border-t border-[#E5E7EB] p-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <AppInput
                                label="Name"
                                value={child.name}
                                onChange={(event) =>
                                  setChildValue(field.name, index, 'name', event.target.value)
                                }
                              />
                              <AppDropdown
                                label="Gender"
                                options={[
                                  { label: 'Male', value: 'male' },
                                  { label: 'Female', value: 'female' },
                                ]}
                                placeholder="Select gender"
                                value={child.gender}
                                onChange={(nextValue) =>
                                  setChildValue(
                                    field.name,
                                    index,
                                    'gender',
                                    Array.isArray(nextValue) ? (nextValue[0] ?? '') : nextValue,
                                  )
                                }
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <AppInput
                                label="Date Of Birth"
                                type="date"
                                value={child.dob}
                                onChange={(event) => {
                                  setChildValue(field.name, index, 'dob', event.target.value);
                                  if (event.target.value) {
                                    const age = Math.floor(
                                      (Date.now() - new Date(event.target.value).getTime()) /
                                        (365.25 * 24 * 60 * 60 * 1000),
                                    );
                                    setChildValue(field.name, index, 'age', String(age));
                                  }
                                }}
                              />
                              <AppInput
                                label="Age"
                                type="number"
                                value={computedAge}
                                disabled
                              />
                            </div>
                            <AppInput
                              label="School"
                              value={child.school}
                              onChange={(event) =>
                                setChildValue(field.name, index, 'school', event.target.value)
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          }

          if (field.type === 'dependants-list') {
            const dependants = Array.isArray(value) ? (value as DependantFormValue[]) : [];

            return (
              <div className="grid gap-3" key={field.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                    {fieldLabel}
                  </span>
                  <AppButton
                    leftIcon={<Plus className="size-4" aria-hidden />}
                    size="sm"
                    variant="outline"
                    onClick={() => addDependant(field.name)}
                  >
                    Add dependant
                  </AppButton>
                </div>
                {dependants.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#6B7890]">
                    No dependant added yet.
                  </div>
                ) : (
                  dependants.map((dependant, index) => (
                    <div
                      className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3"
                      key={index}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <AppText variant="bodySmall" weight="bold">
                          Dependant {index + 1}
                        </AppText>
                        <AppButton
                          leftIcon={<Trash2 className="size-4" aria-hidden />}
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDependant(field.name, index)}
                        >
                          Remove
                        </AppButton>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AppInput
                          label="Name"
                          value={dependant.name}
                          onChange={(event) =>
                            setDependantValue(field.name, index, 'name', event.target.value)
                          }
                        />
                        <AppInput
                          label="Relationship"
                          value={dependant.relationship}
                          onChange={(event) =>
                            setDependantValue(field.name, index, 'relationship', event.target.value)
                          }
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AppInput
                          label="Phone"
                          type="tel"
                          value={dependant.phone}
                          onChange={(event) =>
                            setDependantValue(field.name, index, 'phone', event.target.value)
                          }
                        />
                        <AppInput
                          label="Age"
                          min={0}
                          type="number"
                          value={dependant.age}
                          onChange={(event) =>
                            setDependantValue(field.name, index, 'age', event.target.value)
                          }
                        />
                      </div>
                      <div className="rounded-lg border border-[#EEF2F7] bg-white p-3">
                        <AppSwitch
                          checked={dependant.isLivingWithUser}
                          label="Living With User"
                          onCheckedChange={(checked) =>
                            setDependantValue(field.name, index, 'isLivingWithUser', checked)
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          }

          if (field.type === 'file' || field.type === 'file-list') {
            return (
              <AppFileUploadField
                key={field.name}
                label={fieldLabel}
                value={
                  field.type === 'file-list' ? (isStringArray(value) ? value : []) : String(value)
                }
                module={field.uploadModule ?? memberUploadDefaults.uploadModule}
                isPublic={field.isPublic ?? memberUploadDefaults.isPublic}
                multiple={field.type === 'file-list'}
                accept={field.accept}
                disabled={submitting}
                onChange={(nextValue) => setFieldValue(field.name, nextValue)}
              />
            );
          }

          if (field.type === 'boolean') {
            return (
              <div className="rounded-lg border border-[#EEF2F7] p-3" key={field.name}>
                <AppSwitch
                  checked={Boolean(value)}
                  label={fieldLabel}
                  onCheckedChange={(checked) => setFieldValue(field.name, checked)}
                />
              </div>
            );
          }

          if (field.type === 'textarea' || field.type === 'list') {
            return (
              <label className="grid gap-1" key={field.name}>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                  {fieldLabel}
                </span>
                <textarea
                  className="min-h-24 rounded-[10px] border-[1.5px] border-[#D5DCE8] bg-white px-3.5 py-2.5 text-sm text-[#0B1F4A] outline-none transition-all duration-150 placeholder:text-[#A8B3C4] disabled:opacity-60 focus:border-[#123B8D] focus:ring-3 focus:ring-[#123B8D]/10"
                  disabled={field.disabled}
                  placeholder={field.placeholder}
                  value={String(value)}
                  onChange={(event) => setFieldValue(field.name, event.target.value)}
                />
              </label>
            );
          }

          return (
            <AppInput
              key={field.name}
              label={fieldLabel}
              placeholder={field.placeholder}
              type={field.type ?? 'text'}
              inputMode={field.type === 'tel' ? 'numeric' : undefined}
              pattern={field.type === 'tel' ? '[0-9]*' : undefined}
              value={String(value)}
              disabled={field.disabled}
              onChange={(event) => {
                const nextValue = field.type === 'tel'
                  ? event.target.value.replace(/[^0-9]/g, '')
                  : event.target.value;
                setFieldValue(field.name, nextValue);
              }}
            />
          );
        })}
      </form>
    </AppModal>
  );
};
