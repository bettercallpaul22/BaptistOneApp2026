import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback';
import { AppDropdown, AppFileUploadField, AppInput, AppSwitch } from '@/components/form';
import { useAppDispatch } from '@/store/hooks';
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
import { SpouseInviteSearch } from './SpouseInviteSearch';

export const ProfileSectionEditModal = ({
  sectionKey,
  sectionTitle,
  sectionData,
  open,
  onClose,
}: {
  sectionKey: keyof ProfileCompletion;
  sectionTitle: string;
  sectionData: unknown;
  open: boolean;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const fields = useMemo(
    () => getEditableFields(sectionKey, sectionData),
    [sectionData, sectionKey],
  );
  const [formValues, setFormValues] = useState<Record<string, EditableFieldValue>>(() =>
    buildInitialFormValues(sectionData, fields),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const visibleFields = useMemo(
    () => getVisibleFields(sectionKey, fields, formValues),
    [fields, formValues, sectionKey],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFormValues(buildInitialFormValues(sectionData, fields));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fields, sectionData]);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await dispatch(
        updateProfileCompletionSectionThunk({
          sectionKey: String(sectionKey),
          data: buildSectionPayload(visibleFields, formValues),
        }),
      ).unwrap();
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
        {submitError && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {submitError}
          </div>
        )}
        {sectionKey === 'spouseInformation' && <SpouseInviteSearch />}
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
                  children.map((child, index) => (
                    <div
                      className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3"
                      key={index}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <AppText variant="bodySmall" weight="bold">
                          Child {index + 1}
                        </AppText>
                        <AppButton
                          leftIcon={<Trash2 className="size-4" aria-hidden />}
                          size="sm"
                          variant="ghost"
                          onClick={() => removeChild(field.name, index)}
                        >
                          Remove
                        </AppButton>
                      </div>
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
                          onChange={(event) =>
                            setChildValue(field.name, index, 'dob', event.target.value)
                          }
                        />
                        <AppInput
                          label="Age"
                          min={0}
                          type="number"
                          value={child.age}
                          onChange={(event) =>
                            setChildValue(field.name, index, 'age', event.target.value)
                          }
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
                  ))
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
              value={String(value)}
              disabled={field.disabled}
              onChange={(event) => setFieldValue(field.name, event.target.value)}
            />
          );
        })}
      </form>
    </AppModal>
  );
};
