import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Plus, Trash2, X, ChevronDown, Search, Users, Baby, Send } from 'lucide-react';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback';
import { AppDatePicker, AppDropdown, AppFileUploadField, AppInput, AppSwitch } from '@/components/form';
import { AppAvatar } from '@/components/display';
import { useAppDispatch } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import { updateProfileCompletionSectionThunk } from '@/store/thunks/profileThunk';
import type { ProfileCompletion } from '@/types/profile';
import { memberUploadDefaults } from '../config/profileConfig';
import { familyInviteService } from '../services/familyInviteService';
import type { FamilyMemberSearchItem } from '../types/familyInviteTypes';
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

const SpouseSearchSection = ({
  formValues,
  setFieldValue,
}: {
  formValues: Record<string, EditableFieldValue>;
  setFieldValue: (name: string, value: EditableFieldValue) => void;
}) => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<FamilyMemberSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const hasSearched = Boolean(trimmedQuery);

  useEffect(() => {
    if (!trimmedQuery) return;

    const abortController = new AbortController();
    const debounceTimer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await familyInviteService.searchMembers(trimmedQuery, {
          signal: abortController.signal,
        });
        setItems(response.data?.items ?? []);
      } catch (error) {
        if (abortController.signal.aborted) return;
        setItems([]);
        setSearchError('Unable to search members.');
      } finally {
        if (!abortController.signal.aborted) setSearchLoading(false);
      }
    }, 350);

    return () => {
      abortController.abort();
      window.clearTimeout(debounceTimer);
    };
  }, [trimmedQuery]);

  const searchStatusMessage = useMemo(() => {
    if (!hasSearched) return 'Search by name, email, username, or phone.';
    if (searchLoading) return 'Searching members...';
    if (searchError) return searchError;
    if (!items.length) return 'No member found. You can enter spouse details below.';
    return null;
  }, [hasSearched, items.length, searchError, searchLoading]);

  const handleLink = async (member: FamilyMemberSearchItem) => {
    const name = member.displayName?.trim() || member.username?.trim() || 'Spouse';
    setLinkingId(member.memberId);
    try {
      await familyInviteService.linkMember({
        targetMemberId: member.memberId,
        relationship: 'SPOUSE',
      });
      setFieldValue('spouseName', name);
      setFieldValue('spousePhone', member.contactPhone || '');
      setLinkedId(member.memberId);
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Spouse linked',
          message: `${name} has been linked as your spouse.`,
        }),
      );
    } catch {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to link spouse',
          message: 'Something went wrong. Please try again.',
        }),
      );
    } finally {
      setLinkingId(null);
    }
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    if (!nextQuery.trim()) {
      setItems([]);
      setSearchError(null);
      setSearchLoading(false);
    }
  };

  return (
    <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <div className="grid gap-1">
        <AppText variant="bodyMedium" weight="bold">
          Search Existing Member
        </AppText>
        <AppText variant="bodySmall" color="textSecondary">
          Search for your spouse and link them to your family profile.
        </AppText>
      </div>

      <AppInput
        label="Search By Name, Phone Number, or Email"
        placeholder="Search by name, email, username, or phone"
        value={query}
        onChange={handleQueryChange}
      />

      {searchStatusMessage && (
        <div
          className={`rounded-lg border p-3 text-sm font-semibold ${
            searchError
              ? 'border-red-100 bg-red-50 text-red-700'
              : 'border-[#E5E7EB] bg-white text-[#6B7890]'
          }`}
        >
          {searchStatusMessage}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-2" role="list" aria-label="Spouse search results">
          {items.map((member) => {
            const name = member.displayName?.trim() || member.username?.trim() || member.email?.trim() || 'Spouse';
            const email = member.contactEmail?.trim() || member.email?.trim() || '';
            const phone = member.contactPhone?.trim() || '';
            const isLinked = linkedId === member.memberId;

            return (
              <div
                className="grid gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                key={member.memberId}
                role="listitem"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <AppAvatar name={name} src={member.avatarUrl ?? undefined} size="md" />
                  <div className="grid min-w-0 gap-1">
                    <span className="min-w-0 truncate text-sm font-black text-[#0B1F4A]">
                      {name}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-[#5A6880]">
                      {[email, phone].filter(Boolean).join(' - ') || 'No contact provided'}
                    </span>
                    {member.churchName && (
                      <span className="min-w-0 truncate text-xs font-semibold text-[#8A96AA]">
                        {member.churchName}
                      </span>
                    )}
                  </div>
                </div>
                <AppButton
                  leftIcon={<Send className="size-4" aria-hidden />}
                  loading={linkingId === member.memberId}
                  size="sm"
                  variant={isLinked ? 'outline' : 'primary'}
                  disabled={isLinked}
                  onClick={() => void handleLink(member)}
                >
                  {isLinked ? 'Linked' : 'Link Spouse'}
                </AppButton>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-3 pt-1">
        <AppText variant="bodySmall" weight="bold" color="textMuted">
          If Not Found - Enter Spouse Details:
        </AppText>
        <AppInput
          label="Spouse Name"
          placeholder="Enter spouse name"
          value={String(formValues.spouseName ?? '')}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFieldValue('spouseName', e.target.value)}
        />
        <AppInput
          label="Phone Number"
          type="tel"
          placeholder="+2348030000000"
          value={String(formValues.spousePhone ?? '')}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFieldValue('spousePhone', e.target.value)}
        />
      </div>
    </section>
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
  const [activeTab, setActiveTab] = useState<string>('family-info');

  const isFamilyInformation = sectionKey === 'familyInformation';
  const familyTabs = useMemo(() => [
    { value: 'family-info', label: 'Family Info', icon: Users },
    { value: 'children', label: 'Children', icon: Baby },
  ], []);

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

  const setFamilyChildValue = (
    index: number,
    childKey: keyof ChildFormValue,
    value: string,
  ) => {
    setFormValues((current) => {
      const key = 'familyInformation.familyInformation';
      const familyInfo = current[key] && typeof current[key] === 'object' && !Array.isArray(current[key])
        ? current[key] as { children: ChildFormValue[] }
        : { children: [] as ChildFormValue[] };
      const children = [...familyInfo.children];
      children[index] = { ...(children[index] ?? createEmptyChild()), [childKey]: value };
      return { ...current, [key]: { children } as EditableFieldValue };
    });
    setSubmitError(null);
  };

  const addFamilyChild = () => {
    setFormValues((current) => {
      const key = 'familyInformation.familyInformation';
      const familyInfo = current[key] && typeof current[key] === 'object' && !Array.isArray(current[key])
        ? current[key] as { children: ChildFormValue[] }
        : { children: [] as ChildFormValue[] };
      return { ...current, [key]: { children: [...familyInfo.children, createEmptyChild()] } as EditableFieldValue };
    });
    setSubmitError(null);
  };

  const removeFamilyChild = (index: number) => {
    setFormValues((current) => {
      const key = 'familyInformation.familyInformation';
      const familyInfo = current[key] && typeof current[key] === 'object' && !Array.isArray(current[key])
        ? current[key] as { children: ChildFormValue[] }
        : { children: [] as ChildFormValue[] };
      return { ...current, [key]: { children: familyInfo.children.filter((_, childIndex) => childIndex !== index) } as EditableFieldValue };
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
      {isFamilyInformation && (
        <div className="mb-2">
          <AppScrollableTabs
            tabs={familyTabs}
            value={activeTab}
            onValueChange={setActiveTab}
            fullWidthTabs
          />
        </div>
      )}
      <form
        className="grid h-[28rem] content-start gap-4 overflow-y-auto pb-8 pr-1"
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
        {isFamilyInformation && activeTab === 'family-info' && (
          <SpouseSearchSection formValues={formValues} setFieldValue={setFieldValue} />
        )}
        {visibleFields
          .filter((field) => {
            if (!isFamilyInformation) return true;
            const childrenFieldNames = ['familyInformation.familyInformation'];
            if (activeTab === 'children') {
              return childrenFieldNames.includes(field.name) || field.type === 'family-children-list';
            }
            if (activeTab === 'family-info') {
              return !childrenFieldNames.includes(field.name)
                && field.type !== 'family-children-list'
                && field.name !== 'spouseName'
                && field.name !== 'spousePhone';
            }
            return true;
          })
          .map((field) => {
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
                              <AppDatePicker
                                label="Date Of Birth"
                                value={child.dob}
                                onChange={(nextValue) => {
                                  setChildValue(field.name, index, 'dob', nextValue);
                                  if (nextValue) {
                                    const age = Math.floor(
                                      (Date.now() - new Date(nextValue).getTime()) /
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

          if (field.type === 'family-children-list') {
            const familyInfo = value && typeof value === 'object' && !Array.isArray(value)
              ? value as { children: ChildFormValue[] }
              : { children: [] as ChildFormValue[] };
            const children = familyInfo.children ?? [];

            return (
              <div className="grid gap-3" key={field.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                    Children Information
                  </span>
                  <AppButton
                    leftIcon={<Plus className="size-4" aria-hidden />}
                    size="sm"
                    variant="outline"
                    onClick={addFamilyChild}
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
                    const isCollapsed = collapsedItems[`family-child-${index}`] ?? false;
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
                            onClick={() => toggleCollapse(`family-child-${index}`)}
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
                            onClick={() => removeFamilyChild(index)}
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
                                  setFamilyChildValue(index, 'name', event.target.value)
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
                                  setFamilyChildValue(
                                    index,
                                    'gender',
                                    Array.isArray(nextValue) ? (nextValue[0] ?? '') : nextValue,
                                  )
                                }
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <AppDatePicker
                                label="Date Of Birth"
                                value={child.dob}
                                onChange={(nextValue) => {
                                  setFamilyChildValue(index, 'dob', nextValue);
                                  if (nextValue) {
                                    const age = Math.floor(
                                      (Date.now() - new Date(nextValue).getTime()) /
                                        (365.25 * 24 * 60 * 60 * 1000),
                                    );
                                    setFamilyChildValue(index, 'age', String(age));
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
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          }

          if (field.type === 'file' || field.type === 'file-list') {
            return (
              <div className="grid gap-1" key={field.name}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">
                    {fieldLabel}
                  </span>
                  <span className={`text-[10px] font-semibold ${field.required ? 'text-[#DC2626]' : 'text-[#79859A]'}`}>
                    {field.required ? 'Required' : 'Optional'}
                  </span>
                </div>
                <AppFileUploadField
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
              </div>
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

          if (field.type === 'date') {
            return (
              <AppDatePicker
                key={field.name}
                label={fieldLabel}
                value={String(value)}
                disabled={field.disabled}
                onChange={(nextValue) => setFieldValue(field.name, nextValue)}
              />
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
              inputMode={field.type === 'tel' ? 'tel' : undefined}
              value={String(value)}
              disabled={field.disabled}
              onChange={(event) => {
                const nextValue = field.type === 'tel'
                  ? event.target.value.replace(/[^0-9+]/g, '')
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
