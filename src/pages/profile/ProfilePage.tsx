import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Clock3, Gift, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AppButton, AppScrollableTabs, AppText, type AppScrollableTab } from '@/components/common';
import { AppAvatar, AppImage } from '@/components/display';
import { AppLoader, AppModal } from '@/components/feedback';
import { AppDropdown, AppFileUploadField, AppInput, AppSwitch } from '@/components/form';
import { AppShell } from '@/layouts/AppShell';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearChurchError,
  clearChurchOnboardingStatus,
  clearChurchRevokeStatus,
  setChurchQuery,
  setSelectedChurchId,
} from '@/store/slices/churchSlice';
import { pushNotification } from '@/store/slices/notificationSlice';
import {
  fetchChurchRegistrationOptionsThunk,
  onboardMemberToChurchThunk,
  revokeMembershipRequestThunk,
} from '@/store/thunks/churchThunk';
import { fetchMemberAccountThunk } from '@/store/thunks/memberThunk';
import { fetchProfileCompletionThunk, updateProfileCompletionSectionThunk } from '@/store/thunks/profileThunk';
import type { ChurchRegistrationOption } from '@/types/church';
import type { FileUploadModule } from '@/types/fileUpload';
import type { MemberAccount, MemberRecord, MembershipStatus } from '@/types/member';
import type { ProfileCompletion, ProfileFileAsset, ProfileInformationSection, ProfileSectionValue } from '@/types/profile';
import { formatDate } from '@/utils/formatDate';

type ProfileTab = 'profile' | 'church';

const tabs: AppScrollableTab[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'church', label: 'Church' },
];

const tabText: Record<ProfileTab, string> = {
  profile: 'Profile',
  church: 'Church',
};

const informationGroups: Array<{ key: keyof ProfileCompletion; title: string }> = [
  { key: 'churchInformation', title: 'Church Information' },
  { key: 'personalInformation', title: 'Personal Information' },
  { key: 'contactInformation', title: 'Contact Information' },
  { key: 'identityInformation', title: 'Identity Information' },
  { key: 'membershipInformation', title: 'Membership Information' },
  { key: 'salvationInformation', title: 'Salvation Information' },
  { key: 'baptismInformation', title: 'Baptism Information' },
  { key: 'educationInformation', title: 'Education Information' },
  { key: 'employmentInformation', title: 'Employment Information' },
  { key: 'ministryInformation', title: 'Ministry Information' },
  { key: 'familyInformation', title: 'Family Information' },
  { key: 'spouseInformation', title: 'Spouse Information' },
  { key: 'childrenInformation', title: 'Children Information' },
  { key: 'dependants', title: 'Dependants' },
  { key: 'emergencyContact', title: 'Emergency Contact' },
  { key: 'churchInterests', title: 'Church Interests' },
  { key: 'givingPreferences', title: 'Giving Preferences' },
  { key: 'documents', title: 'Documents' },
  { key: 'verification', title: 'Verification' },
];

type ProfileFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'boolean'
  | 'list'
  | 'textarea'
  | 'select'
  | 'file'
  | 'file-list'
  | 'children-list'
  | 'dependants-list';

interface ProfileFieldSchema {
  name: string;
  label?: string;
  type?: ProfileFieldType;
  disabled?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  uploadModule?: FileUploadModule;
  isPublic?: boolean;
  accept?: string;
}

interface ChildFormValue {
  name: string;
  gender: string;
  dob: string;
  age: string;
  school: string;
}

interface DependantFormValue {
  name: string;
  relationship: string;
  phone: string;
  age: string;
  isLivingWithUser: boolean;
}

type EditableFieldValue = string | boolean | string[] | ChildFormValue[] | DependantFormValue[];

const memberUploadDefaults = {
  uploadModule: 'baptistone_member' as const,
  isPublic: true,
};

const maritalStatusOptions = [
  { label: 'single', value: 'single' },
  { label: 'married', value: 'married' },
  { label: 'divorce', value: 'divorce' },
];

const sectionFieldSchemas: Partial<Record<keyof ProfileCompletion, ProfileFieldSchema[]>> = {
  churchInformation: [
    { name: 'conferenceId' },
    { name: 'conventionId' },
    { name: 'associationId' },
    { name: 'preferredChurchId' },
    { name: 'previousChurchName' },
    { name: 'preferredChurchName' },
    { name: 'currentlyAttendsChurch', type: 'boolean' },
  ],
  personalInformation: [
    { name: 'firstName' },
    { name: 'lastName' },
    { name: 'displayName' },
    { name: 'dob', label: 'Date Of Birth', type: 'date' },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    { name: 'country' },
    { name: 'countryCode' },
  ],
  contactInformation: [
    { name: 'phone', type: 'tel' },
    { name: 'email', type: 'email', disabled: true },
    { name: 'address', type: 'textarea' },
  ],
  identityInformation: [
    { name: 'nin', label: 'NIN' },
    {
      name: 'validIdType',
      type: 'select',
      options: [
        { label: 'national_id', value: 'national_id' },
        { label: 'passport', value: 'passport' },
      ],
    },
    { name: 'validIdFileId', type: 'file', ...memberUploadDefaults },
    { name: 'verificationConsent', type: 'boolean' },
  ],
  membershipInformation: [
    { name: 'membershipType' },
    { name: 'memberSince', type: 'date' },
  ],
  salvationInformation: [
    { name: 'isBornAgain', type: 'boolean' },
    { name: 'salvationDate', type: 'date' },
  ],
  baptismInformation: [
    { name: 'legalName' },
    { name: 'denomination' },
    { name: 'yearEstablished', type: 'date' },
    { name: 'officialEmail', type: 'email' },
    { name: 'officialPhone', type: 'tel' },
    { name: 'address.street' },
    { name: 'address.city' },
    { name: 'address.state' },
    { name: 'address.country' },
    { name: 'address.zipCode' },
    { name: 'leadPastorName' },
    { name: 'administratorName' },
    { name: 'bankName' },
    { name: 'accountNumber' },
    { name: 'accountName' },
    { name: 'transactionTypes', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'financialAccessLevel' },
    { name: 'consentToVerification', type: 'boolean' },
    { name: 'validIdFileId', type: 'file', ...memberUploadDefaults },
  ],
  educationInformation: [
    { name: 'highestQualification' },
    { name: 'institution' },
    { name: 'courseOfStudy' },
    { name: 'graduationYear', type: 'date' },
  ],
  employmentInformation: [
    {
      name: 'employmentStatus',
      type: 'select',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Employed', value: 'employed' },
        { label: 'Unemployed', value: 'unemployed' },
      ],
    },
    { name: 'school' },
    { name: 'course' },
    { name: 'employer' },
    { name: 'occupation' },
    { name: 'workAddress', type: 'textarea' },
    { name: 'linkedIn', label: 'LinkedIn' },
  ],
  ministryInformation: [
    { name: 'ministryUnit' },
    { name: 'serviceRole' },
    { name: 'skills', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'availability', type: 'list', placeholder: 'Separate items with commas' },
  ],
  familyInformation: [
    { name: 'maritalStatus', type: 'select', options: maritalStatusOptions },
    { name: 'familyRole' },
    { name: 'householdSize', type: 'number' },
    { name: 'hasChildren', type: 'boolean' },
    { name: 'nextOfKinName' },
    { name: 'nextOfKinPhone', type: 'tel' },
    { name: 'nextOfKinRelationship' },
  ],
  spouseInformation: [
    { name: 'maritalStatus', type: 'select', options: maritalStatusOptions },
    { name: 'familyRole' },
    { name: 'householdSize', type: 'number' },
    { name: 'hasChildren', type: 'boolean' },
    { name: 'nextOfKinName' },
    { name: 'nextOfKinPhone', type: 'tel' },
    { name: 'nextOfKinRelationship' },
  ],
  childrenInformation: [{ name: 'children', type: 'children-list' }],
  dependants: [{ name: 'dependants', type: 'dependants-list' }],
  emergencyContact: [
    { name: 'name' },
    { name: 'relationship' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'tel' },
    { name: 'alternatePhone', type: 'tel' },
    { name: 'address', type: 'textarea' },
  ],
  churchInterests: [
    { name: 'skills', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'preferredServiceUnit' },
    { name: 'volunteerAvailability', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'interestedInMinistries', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'interestedInDepartments', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'wouldLikePastoralFollowUp', type: 'boolean' },
  ],
  givingPreferences: [
    { name: 'givingCategories', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'preferredGivingChannels', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'recurringGivingEnabled', type: 'boolean' },
    { name: 'recurringGivingAmount', type: 'number' },
    { name: 'recurringGivingFrequency' },
    { name: 'receiveGivingReceipts', type: 'boolean' },
    { name: 'receiveGivingReminders', type: 'boolean' },
    { name: 'anonymousGivingDefault', type: 'boolean' },
  ],
  documents: [
    { name: 'passportPhotoFileId', type: 'file', ...memberUploadDefaults },
    { name: 'validIdFileId', type: 'file', ...memberUploadDefaults },
    { name: 'baptismCertificateFileId', type: 'file', ...memberUploadDefaults },
    { name: 'membershipTransferLetterFileId', type: 'file', ...memberUploadDefaults },
    { name: 'otherDocumentFileIds', type: 'file-list', ...memberUploadDefaults },
  ],
  verification: [
    { name: 'verificationStatus' },
    { name: 'verifiedAt', type: 'date' },
    { name: 'notes', type: 'textarea' },
  ],
};

const emptyText = 'Not provided';
const churchAssociationFallback = 'Association not provided';

const formatLabel = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatMaybeDate = (value: string | null | undefined) => {
  if (!value) return emptyText;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? value : formatDate(value);
};

const isEmptyValue = (value: ProfileSectionValue): boolean => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

const formatPrimitive = (value: ProfileSectionValue): string => {
  if (value === null || value === undefined || value === '') return emptyText;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') return formatMaybeDate(value);
  return '';
};

const isProfileFileAsset = (value: ProfileSectionValue): value is ProfileFileAsset =>
  Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as Partial<ProfileFileAsset>).url === 'string' &&
      typeof (value as Partial<ProfileFileAsset>).contentType === 'string',
  );

const isImageFileAsset = (value: ProfileFileAsset) => value.contentType.toLowerCase().startsWith('image/');

const getFileDisplayName = (file: ProfileFileAsset) => file.altText || file.key?.split('/').pop() || file.url;

const getMatchingFileKeys = (key: string) => {
  if (key.endsWith('FileIds')) {
    const base = key.slice(0, -'FileIds'.length);
    return [`${base}Files`, `${base}File`];
  }

  if (key.endsWith('FileId')) {
    const base = key.slice(0, -'FileId'.length);
    return [`${base}File`];
  }

  return [];
};

const hasMatchingFileAsset = (section: ProfileInformationSection, key: string) =>
  getMatchingFileKeys(key).some((fileKey) => {
    const fileValue = section[fileKey];
    if (isProfileFileAsset(fileValue)) return true;
    if (Array.isArray(fileValue)) return fileValue.some((item) => isProfileFileAsset(item));
    return false;
  });

const renderFilePreview = (file: ProfileFileAsset) => {
  const displayName = getFileDisplayName(file);

  if (isImageFileAsset(file)) {
    return (
      <AppImage
        src={file.url}
        alt={displayName}
        size="sm"
        className="shadow-[0_8px_18px_rgba(11,31,74,0.08)]"
      />
    );
  }

  return (
    <a
      className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-2 text-center text-[0.6875rem] font-bold text-[#123B8D]"
      href={file.url}
      target="_blank"
      rel="noreferrer"
    >
      <span className="line-clamp-2 min-w-0">Open file</span>
    </a>
  );
};

const renderFileAsset = (file: ProfileFileAsset) => {
  return (
    <div className="flex min-w-0 items-center justify-end rounded-lg bg-[#F8FAFC] p-3">
      {renderFilePreview(file)}
    </div>
  );
};

const renderDetailRow = (label: string, value: ReactNode, key?: string) => (
  <div
    className="flex min-w-0 items-start justify-between gap-4 border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0"
    key={key}
  >
    <AppText className="shrink-0 pt-0.5" variant="caption" color="textMuted" weight="bold">
      {label}
    </AppText>
    <div className="min-w-0 text-right text-sm font-semibold text-[#0B1F4A]">{value}</div>
  </div>
);

const renderStructuredObject = (value: ProfileInformationSection, label?: string) => {
  const entries = Object.entries(value).filter(([, itemValue]) => !isEmptyValue(itemValue));

  if (!entries.length) return emptyText;

  return (
    <div className="grid gap-2 rounded-lg bg-[#F8FAFC] p-3">
      {label && (
        <AppText variant="caption" color="textMuted" weight="bold">
          {label}
        </AppText>
      )}
      <div className="grid gap-3">
        {entries.map(([itemKey, itemValue]) => (
          renderDetailRow(formatLabel(itemKey), renderValue(itemValue), itemKey)
        ))}
      </div>
    </div>
  );
};

const getObjectSummary = (value: ProfileInformationSection, fallback: string) => {
  const preferredValue = value.name || value.displayName || value.firstName || value.relationship;
  return typeof preferredValue === 'string' && preferredValue.trim() ? preferredValue : fallback;
};

const renderCollapsibleObject = (value: ProfileInformationSection, label: string) => (
  <details className="group rounded-lg bg-[#F8FAFC]" key={label}>
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
      <div className="min-w-0">
        <AppText variant="caption" color="textMuted" weight="bold">
          {label}
        </AppText>
        <div className="min-w-0 truncate text-sm font-black text-[#0B1F4A]">
          {getObjectSummary(value, label)}
        </div>
      </div>
      <ChevronDown className="size-4 shrink-0 text-[#123B8D] transition-transform duration-200 group-open:rotate-180" aria-hidden />
    </summary>
    <div className="border-t border-[#E7ECF4] px-3 py-3">
      {renderStructuredObject(value)}
    </div>
  </details>
);

const renderInformationEntry = (key: string, value: ProfileSectionValue) => {
  if (isProfileFileAsset(value)) {
    return (
      <div className="flex min-w-0 items-center justify-between gap-4 border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0" key={key}>
        <div className="grid min-w-0 gap-1">
          <AppText variant="caption" color="textMuted" weight="bold">
            {formatLabel(key)}
          </AppText>
        </div>
        {renderFilePreview(value)}
      </div>
    );
  }

  if (Array.isArray(value) && value.some((item) => isProfileFileAsset(item))) {
    return (
      <div className="grid gap-2 border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0" key={key}>
        <AppText variant="caption" color="textMuted" weight="bold">
          {formatLabel(key)}
        </AppText>
        <div className="grid gap-2">
          {value.filter(isProfileFileAsset).map((file) => (
            <div className="flex min-w-0 items-center justify-between gap-4 rounded-lg bg-[#F8FAFC] p-3" key={file.id || file.url}>
              <span className="min-w-0" />
              {renderFilePreview(file)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => item && typeof item === 'object' && !Array.isArray(item) && !isProfileFileAsset(item))
  ) {
    return (
      <div className="grid gap-2 border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0" key={key}>
        <AppText variant="caption" color="textMuted" weight="bold">
          {formatLabel(key)}
        </AppText>
        <div className="grid gap-2">
          {value.map((item, index) => (
            renderCollapsibleObject(item as ProfileInformationSection, `Item ${index + 1}`)
          ))}
        </div>
      </div>
    );
  }

  return (
    renderDetailRow(formatLabel(key), renderValue(value), key)
  );
};

const renderValue = (value: ProfileSectionValue): ReactNode => {
  if (isEmptyValue(value)) return emptyText;

  if (isProfileFileAsset(value)) {
    return renderFileAsset(value);
  }

  if (Array.isArray(value)) {
    return (
      <div className="grid gap-2">
        {value.map((item, index) => (
          <div className="rounded-lg bg-[#F8FAFC] p-3" key={`${index}-${JSON.stringify(item).slice(0, 20)}`}>
            {item && typeof item === 'object' && !Array.isArray(item) && !isProfileFileAsset(item)
              ? renderStructuredObject(item as ProfileInformationSection, `Item ${index + 1}`)
              : renderValue(item)}
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === 'object') {
    const section = value as ProfileInformationSection;

    return (
      <div className="grid gap-2">
        {Object.entries(section)
          .filter(([itemKey, itemValue]) => !isEmptyValue(itemValue) && !hasMatchingFileAsset(section, itemKey))
          .map(([itemKey, itemValue]) => (
            renderDetailRow(formatLabel(itemKey), renderValue(itemValue), itemKey)
          ))}
      </div>
    );
  }

  return formatPrimitive(value);
};

const getSectionEntries = (section: unknown): Array<readonly [string, ProfileSectionValue]> => {
  if (Array.isArray(section)) {
    return section.length ? section.map((item, index) => [`Item ${index + 1}`, item as ProfileSectionValue] as const) : [];
  }

  if (section && typeof section === 'object') {
    const sectionObject = section as ProfileInformationSection;
    return Object.entries(sectionObject).filter(([key]) => !hasMatchingFileAsset(sectionObject, key));
  }

  return [];
};

const getStringValue = (section: ProfileInformationSection, key: string) => {
  const value = section[key];
  return typeof value === 'string' && value.trim() ? value : '';
};

const getProfileDisplayName = (profile: ProfileCompletion) => {
  const personal = profile.personalInformation;
  const contact = profile.contactInformation;

  return (
    getStringValue(personal, 'displayName') ||
    [getStringValue(personal, 'firstName'), getStringValue(personal, 'lastName')].filter(Boolean).join(' ') ||
    getStringValue(contact, 'email') ||
    'Member Profile'
  );
};

const getAvatarLabel = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MP';

const getSectionObject = (section: unknown): ProfileInformationSection => {
  if (Array.isArray(section)) return {};
  if (section && typeof section === 'object') return section as ProfileInformationSection;
  return {};
};

const createEmptyChild = (): ChildFormValue => ({
  name: '',
  gender: '',
  dob: '',
  age: '',
  school: '',
});

const createEmptyDependant = (): DependantFormValue => ({
  name: '',
  relationship: '',
  phone: '',
  age: '',
  isLivingWithUser: false,
});

const normalizeChildFormValue = (value: unknown): ChildFormValue => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createEmptyChild();

  const child = value as Record<string, ProfileSectionValue>;

  return {
    name: typeof child.name === 'string' ? child.name : '',
    gender: typeof child.gender === 'string' ? child.gender : '',
    dob: typeof child.dob === 'string' ? child.dob.slice(0, 10) : '',
    age: typeof child.age === 'number' || typeof child.age === 'string' ? String(child.age) : '',
    school: typeof child.school === 'string' ? child.school : '',
  };
};

const normalizeChildrenFormValue = (value: unknown): ChildFormValue[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeChildFormValue);
};

const normalizeDependantFormValue = (value: unknown): DependantFormValue => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createEmptyDependant();

  const dependant = value as Record<string, ProfileSectionValue>;

  return {
    name: typeof dependant.name === 'string' ? dependant.name : '',
    relationship: typeof dependant.relationship === 'string' ? dependant.relationship : '',
    phone: typeof dependant.phone === 'string' ? dependant.phone : '',
    age: typeof dependant.age === 'number' || typeof dependant.age === 'string' ? String(dependant.age) : '',
    isLivingWithUser: Boolean(dependant.isLivingWithUser),
  };
};

const normalizeDependantsFormValue = (value: unknown): DependantFormValue[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeDependantFormValue);
};

const isEmptyChild = (child: ChildFormValue) =>
  !child.name.trim() && !child.gender.trim() && !child.dob.trim() && !child.age.trim() && !child.school.trim();

const isEmptyDependant = (dependant: DependantFormValue) =>
  !dependant.name.trim() &&
  !dependant.relationship.trim() &&
  !dependant.phone.trim() &&
  !dependant.age.trim() &&
  !dependant.isLivingWithUser;

const isStringArray = (value: EditableFieldValue): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseChildrenFormValue = (value: EditableFieldValue): ProfileSectionValue[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is ChildFormValue => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .filter((child) => !isEmptyChild(child))
    .map((child) => ({
      name: child.name.trim(),
      gender: child.gender,
      dob: child.dob,
      age: child.age.trim() ? Number(child.age) : null,
      school: child.school.trim(),
    }));
};

const parseDependantsFormValue = (value: EditableFieldValue): ProfileSectionValue[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is DependantFormValue => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .filter((dependant) => !isEmptyDependant(dependant))
    .map((dependant) => ({
      name: dependant.name.trim(),
      relationship: dependant.relationship.trim(),
      phone: dependant.phone.trim(),
      age: dependant.age.trim() ? Number(dependant.age) : null,
      isLivingWithUser: dependant.isLivingWithUser,
    }));
};

const getNestedValue = (source: ProfileInformationSection, path: string): ProfileSectionValue => {
  return path.split('.').reduce<ProfileSectionValue>((currentValue, pathPart) => {
    if (!currentValue || typeof currentValue !== 'object' || Array.isArray(currentValue)) return undefined;
    return (currentValue as ProfileInformationSection)[pathPart];
  }, source);
};

const setNestedValue = (target: ProfileInformationSection, path: string, value: ProfileSectionValue) => {
  const pathParts = path.split('.');
  let cursor = target;

  pathParts.forEach((pathPart, index) => {
    if (index === pathParts.length - 1) {
      cursor[pathPart] = value;
      return;
    }

    const nextValue = cursor[pathPart];
    if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
      cursor[pathPart] = {};
    }

    cursor = cursor[pathPart] as ProfileInformationSection;
  });
};

const stringifyFieldValue = (value: ProfileSectionValue, fieldType?: ProfileFieldType): EditableFieldValue => {
  if (fieldType === 'boolean') return Boolean(value);
  if (fieldType === 'file-list') return Array.isArray(value) ? value.map((item) => String(item)) : [];
  if (fieldType === 'children-list') return normalizeChildrenFormValue(value);
  if (fieldType === 'dependants-list') return normalizeDependantsFormValue(value);
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))
      ? value.join(', ')
      : JSON.stringify(value, null, 2);
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  if (fieldType === 'date' && typeof value === 'string') return value.slice(0, 10);
  return String(value);
};

const getEditableFields = (key: keyof ProfileCompletion, section: unknown): ProfileFieldSchema[] => {
  const schema = sectionFieldSchemas[key];
  if (schema?.length) {
    const sectionObject = getSectionObject(section);
    if (key === 'membershipInformation' && typeof sectionObject.email === 'string') {
      return [{ name: 'email', type: 'email', disabled: true }, ...schema];
    }

    return schema;
  }

  return getSectionEntries(section).map(([fieldKey, value]) => ({
    name: fieldKey,
    disabled: fieldKey === 'email',
    type: typeof value === 'boolean' ? 'boolean' : Array.isArray(value) ? 'list' : typeof value === 'object' ? 'textarea' : 'text',
  }));
};

const getVisibleFields = (
  sectionKey: keyof ProfileCompletion,
  fields: ProfileFieldSchema[],
  formValues: Record<string, EditableFieldValue>,
) => {
  if (sectionKey !== 'employmentInformation') return fields;

  const employmentStatus = String(formValues.employmentStatus ?? '');

  if (employmentStatus === 'student') {
    return fields.filter((field) => ['employmentStatus', 'school', 'course'].includes(field.name));
  }

  if (employmentStatus === 'employed' || employmentStatus === 'unemployed') {
    return fields.filter((field) =>
      ['employmentStatus', 'employer', 'occupation', 'workAddress', 'linkedIn'].includes(field.name),
    );
  }

  return fields.filter((field) => field.name === 'employmentStatus');
};

const buildInitialFormValues = (
  section: unknown,
  fields: ProfileFieldSchema[],
): Record<string, EditableFieldValue> => {
  const sectionData = getSectionObject(section);

  return fields.reduce<Record<string, EditableFieldValue>>((values, field) => {
    if (field.type === 'children-list') {
      const nestedChildren = getNestedValue(sectionData, field.name);
      values[field.name] = normalizeChildrenFormValue(Array.isArray(nestedChildren) ? nestedChildren : section);
      return values;
    }

    if (field.type === 'dependants-list') {
      const nestedDependants = getNestedValue(sectionData, field.name);
      values[field.name] = normalizeDependantsFormValue(Array.isArray(nestedDependants) ? nestedDependants : section);
      return values;
    }

    values[field.name] = stringifyFieldValue(getNestedValue(sectionData, field.name), field.type);
    return values;
  }, {});
};

const parseEditableValue = (value: EditableFieldValue, fieldType?: ProfileFieldType): ProfileSectionValue => {
  if (fieldType === 'boolean') return Boolean(value);
  if (fieldType === 'file-list') return isStringArray(value) ? value : [];
  if (fieldType === 'children-list') return parseChildrenFormValue(value);
  if (fieldType === 'dependants-list') return parseDependantsFormValue(value);

  const stringValue = String(value).trim();

  if (fieldType === 'number') return stringValue ? Number(stringValue) : null;
  if (fieldType === 'list') {
    return stringValue
      ? stringValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  }
  if (fieldType === 'textarea' && /^[{[]/.test(stringValue)) {
    try {
      return JSON.parse(stringValue) as ProfileSectionValue;
    } catch {
      return stringValue;
    }
  }

  return stringValue;
};

const buildSectionPayload = (
  fields: ProfileFieldSchema[],
  formValues: Record<string, EditableFieldValue>,
): ProfileInformationSection =>
  fields.reduce<ProfileInformationSection>((payload, field) => {
    if (field.disabled) return payload;

    setNestedValue(payload, field.name, parseEditableValue(formValues[field.name] ?? '', field.type));
    return payload;
  }, {});

const getSubmitErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return 'Unable to update profile information.';
};

const getChurchRequestErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return 'Unable to send join request.';
};

const SectionShell = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
    <div className="flex items-center justify-between gap-3">
      <AppText variant="h6">{title}</AppText>
      {action}
    </div>
    {children}
  </section>
);

const ProfileSectionEditModal = ({
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
  const fields = useMemo(() => getEditableFields(sectionKey, sectionData), [sectionData, sectionKey]);
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

  const setChildValue = (fieldName: string, index: number, childKey: keyof ChildFormValue, value: string) => {
    setFormValues((current) => {
      const children = Array.isArray(current[fieldName]) ? ([...(current[fieldName] as ChildFormValue[])] as ChildFormValue[]) : [];
      children[index] = { ...(children[index] ?? createEmptyChild()), [childKey]: value };
      return { ...current, [fieldName]: children };
    });
    setSubmitError(null);
  };

  const addChild = (fieldName: string) => {
    setFormValues((current) => {
      const children = Array.isArray(current[fieldName]) ? (current[fieldName] as ChildFormValue[]) : [];
      return { ...current, [fieldName]: [...children, createEmptyChild()] };
    });
    setSubmitError(null);
  };

  const removeChild = (fieldName: string, index: number) => {
    setFormValues((current) => {
      const children = Array.isArray(current[fieldName]) ? (current[fieldName] as ChildFormValue[]) : [];
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
      dependants[index] = { ...(dependants[index] ?? createEmptyDependant()), [dependantKey]: value };
      return { ...current, [fieldName]: dependants };
    });
    setSubmitError(null);
  };

  const addDependant = (fieldName: string) => {
    setFormValues((current) => {
      const dependants = Array.isArray(current[fieldName]) ? (current[fieldName] as DependantFormValue[]) : [];
      return { ...current, [fieldName]: [...dependants, createEmptyDependant()] };
    });
    setSubmitError(null);
  };

  const removeDependant = (fieldName: string, index: number) => {
    setFormValues((current) => {
      const dependants = Array.isArray(current[fieldName]) ? (current[fieldName] as DependantFormValue[]) : [];
      return { ...current, [fieldName]: dependants.filter((_, dependantIndex) => dependantIndex !== index) };
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
          <AppButton fullWidth variant="ghost" type="button" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton fullWidth form={`profile-${String(sectionKey)}-form`} loading={submitting} type="submit">
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
                onChange={(nextValue) => setFieldValue(field.name, Array.isArray(nextValue) ? nextValue[0] ?? '' : nextValue)}
              />
            );
          }

          if (field.type === 'children-list') {
            const children = Array.isArray(value) ? (value as ChildFormValue[]) : [];

            return (
              <div className="grid gap-3" key={field.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">{fieldLabel}</span>
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
                    <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3" key={index}>
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
                          onChange={(event) => setChildValue(field.name, index, 'name', event.target.value)}
                        />
                        <AppDropdown
                          label="Gender"
                          options={[
                            { label: 'Male', value: 'male' },
                            { label: 'Female', value: 'female' },
                          ]}
                          placeholder="Select gender"
                          value={child.gender}
                          onChange={(nextValue) => setChildValue(field.name, index, 'gender', Array.isArray(nextValue) ? nextValue[0] ?? '' : nextValue)}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AppInput
                          label="Date Of Birth"
                          type="date"
                          value={child.dob}
                          onChange={(event) => setChildValue(field.name, index, 'dob', event.target.value)}
                        />
                        <AppInput
                          label="Age"
                          min={0}
                          type="number"
                          value={child.age}
                          onChange={(event) => setChildValue(field.name, index, 'age', event.target.value)}
                        />
                      </div>
                      <AppInput
                        label="School"
                        value={child.school}
                        onChange={(event) => setChildValue(field.name, index, 'school', event.target.value)}
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
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">{fieldLabel}</span>
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
                    <div className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3" key={index}>
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
                          onChange={(event) => setDependantValue(field.name, index, 'name', event.target.value)}
                        />
                        <AppInput
                          label="Relationship"
                          value={dependant.relationship}
                          onChange={(event) => setDependantValue(field.name, index, 'relationship', event.target.value)}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AppInput
                          label="Phone"
                          type="tel"
                          value={dependant.phone}
                          onChange={(event) => setDependantValue(field.name, index, 'phone', event.target.value)}
                        />
                        <AppInput
                          label="Age"
                          min={0}
                          type="number"
                          value={dependant.age}
                          onChange={(event) => setDependantValue(field.name, index, 'age', event.target.value)}
                        />
                      </div>
                      <div className="rounded-lg border border-[#EEF2F7] bg-white p-3">
                        <AppSwitch
                          checked={dependant.isLivingWithUser}
                          label="Living With User"
                          onCheckedChange={(checked) => setDependantValue(field.name, index, 'isLivingWithUser', checked)}
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
                value={field.type === 'file-list' ? (isStringArray(value) ? value : []) : String(value)}
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
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5A6880]">{fieldLabel}</span>
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

const ProfileLoading = () => (
  <div className="grid gap-4">
    <div className="min-h-36 animate-pulse rounded-xl bg-[#EAF1FF]" />
    <div className="grid gap-3 sm:grid-cols-2">
      <AppLoader variant="skeleton" className="min-h-28" label="Loading profile summary" />
      <AppLoader variant="skeleton" className="min-h-28" label="Loading profile progress" />
    </div>
  </div>
);

const ProfileError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <section className="grid gap-4 rounded-xl border border-red-100 bg-red-50 p-5 text-red-800">
    <div className="flex items-start gap-3">
      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="grid gap-1">
        <AppText variant="h6" color="#991B1B">
          Unable to load profile
        </AppText>
        <AppText variant="bodyMedium" color="#B91C1C">
          {message}
        </AppText>
      </div>
    </div>
    <div>
      <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} onClick={onRetry}>
        Retry
      </AppButton>
    </div>
  </section>
);

const ProfileCompletionView = ({ profile, lastFetchedAt }: { profile: ProfileCompletion; lastFetchedAt: string | null }) => {
  const memberAccount = useAppSelector((state) => state.member.data);
  const [editingSection, setEditingSection] = useState<{ key: keyof ProfileCompletion; title: string } | null>(null);
  const sectionEntries = Object.entries(profile.sections);
  const completedSections = sectionEntries.filter(([, section]) => section.completed);
  const incompleteSections = sectionEntries.length - completedSections.length;
  const progress = Math.min(100, Math.max(0, profile.completionScore));
  const avatarLabel = getAvatarLabel(getProfileDisplayName(profile));
  const memberChurchInformationRows = useMemo(() => getMemberChurchInformationRows(memberAccount), [memberAccount]);

  return (
    <div className="grid gap-5">
      <div className="grid justify-items-center pt-2">
        <span className="grid size-16 place-items-center rounded-full bg-[#EAF1FF] text-xl font-black text-[#123B8D] ring-4 ring-white shadow-[0_8px_18px_rgba(11,31,74,0.08)]">
          {avatarLabel}
        </span>
      </div>

      <section className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_18px_rgba(11,31,74,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <AppText variant="h5">Profile Progress</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {completedSections.length} completed, {incompleteSections} pending
            </AppText>
          </div>
          {lastFetchedAt && (
            <AppText variant="caption" color="textMuted">
              Updated {formatMaybeDate(lastFetchedAt)}
            </AppText>
          )}
        </div>
        <div className="relative h-8 overflow-hidden rounded-full bg-[#EAF1FF]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[#D4A017]" style={{ width: `${progress}%` }} />
          <span className="absolute inset-0 grid place-items-center text-sm font-black text-[#0B1F4A]">
            {profile.completionScore}%
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {informationGroups.map((group) => {
          if (group.key === 'churchInformation') {
            return (
              <SectionShell title={group.title} key={String(group.key)}>
                {memberChurchInformationRows.length ? (
                  <div className="grid gap-3">
                    {memberChurchInformationRows.map(([label, value]) => renderDetailRow(label, value, label))}
                  </div>
                ) : (
                  <AppText variant="bodyMedium" color="textMuted">
                    {emptyText}
                  </AppText>
                )}
              </SectionShell>
            );
          }

          const entries = getSectionEntries(profile[group.key]);
          const visibleEntries = entries.filter(([, value]) => !isEmptyValue(value));

          return (
            <SectionShell
              title={group.title}
              action={
                <AppButton
                  leftIcon={<Pencil className="size-3.5" aria-hidden />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingSection({ key: group.key, title: group.title })}
                >
                  Update
                </AppButton>
              }
              key={String(group.key)}
            >
              {visibleEntries.length ? (
                <div className="grid gap-3">
              {visibleEntries.map(([key, value]) => (
                    renderInformationEntry(key, value)
                  ))}
                </div>
              ) : (
                <AppText variant="bodyMedium" color="textMuted">
                  {emptyText}
                </AppText>
              )}
            </SectionShell>
          );
        })}
      </div>

      <SectionShell title="Rewards">
        {profile.rewards.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.rewards.map((reward) => (
              <div className="grid gap-2 rounded-lg border border-[#EEF2F7] p-3" key={reward.id}>
                <div className="flex items-center gap-2">
                  <Gift className="size-4 text-[#D4A017]" aria-hidden />
                  <AppText variant="bodyMedium" weight="bold">
                    {reward.points} {reward.currency}
                  </AppText>
                </div>
                <AppText variant="bodySmall" color="textSecondary">
                  {formatLabel(reward.sectionKey)} - {formatLabel(reward.reason)}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {formatMaybeDate(reward.createdAt)}
                </AppText>
              </div>
            ))}
          </div>
        ) : (
          <AppText variant="bodyMedium" color="textMuted">
            {emptyText}
          </AppText>
        )}
      </SectionShell>

      {editingSection && (
        <ProfileSectionEditModal
          open
          sectionKey={editingSection.key}
          sectionTitle={editingSection.title}
          sectionData={profile[editingSection.key]}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
};

const getChurchAssociationName = (church: ChurchRegistrationOption) =>
  church.association?.name?.trim() || churchAssociationFallback;

const joinableMembershipStatuses: Array<MembershipStatus | null> = [null, 'NONE', 'REJECTED'];

const canRequestChurchMembership = (status: MembershipStatus | null | undefined) =>
  joinableMembershipStatuses.includes(status ?? null);

const getMemberRecordString = (record: MemberRecord | null | undefined, key: string) => {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
};

const getMemberRecordId = (record: unknown): string => {
  if (!record || typeof record !== 'object') return '';

  const source = Array.isArray(record) ? record[0] : record;
  if (!source || typeof source !== 'object') return '';

  const recordObject = source as Record<string, unknown>;
  const directIdKeys = [
    'id',
    'requestId',
    'membershipRequestId',
    'pendingMembershipRequestId',
    'membership_request_id',
    'pending_membership_request_id',
  ];

  for (const key of directIdKeys) {
    const value = recordObject[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  const nestedKeys = ['request', 'membershipRequest', 'pendingMembershipRequest', 'membership_request'];

  for (const key of nestedKeys) {
    const nestedId = getMemberRecordId(recordObject[key]);
    if (nestedId) return nestedId;
  }

  return '';
};

const getNestedMemberRecord = (record: MemberRecord | null | undefined, key: string): MemberRecord | null => {
  const value = record?.[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as MemberRecord) : null;
};

const getPendingMembershipRequestId = (memberAccount: MemberAccount | null) =>
  getMemberRecordId(memberAccount?.pendingMembershipRequest);

const getApprovedChurchDetails = (memberAccount: MemberAccount | null) => {
  const church = memberAccount?.church;
  const association = church?.association;
  const conference = getNestedMemberRecord(association, 'conference');

  return {
    churchName: church?.name?.trim() || 'your church',
    associationName: getMemberRecordString(association, 'name'),
    conferenceName: getMemberRecordString(conference, 'name'),
  };
};

const getMemberChurchInformationRows = (memberAccount: MemberAccount | null): Array<readonly [string, string]> => {
  const church = memberAccount?.church;
  const association = church?.association;
  const conference = getNestedMemberRecord(association, 'conference');
  const convention = getNestedMemberRecord(conference, 'convention');
  const rows: Array<readonly [string, string]> = [
    ['Church Name', church?.name?.trim() ?? ''],
    ['Association Name', getMemberRecordString(association, 'name')],
    ['Conference Name', getMemberRecordString(conference, 'name')],
    ['Convention Name', getMemberRecordString(convention, 'name')],
  ];

  return rows.filter(([, value]) => value);
};

const ChurchMembershipPanel = () => {
  const dispatch = useAppDispatch();
  const initialFetchRequested = useRef(false);
  const searchEffectReady = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [revokeRequestIdError, setRevokeRequestIdError] = useState<string | null>(null);
  const memberAccount = useAppSelector((state) => state.member.data);
  const memberLoading = useAppSelector((state) => state.member.loading);
  const memberError = useAppSelector((state) => state.member.error);
  const {
    error,
    items,
    lastFetchedAt,
    loadMoreError,
    loading,
    loadingMore,
    meta,
    onboardingError,
    onboardingLoading,
    onboardingSuccessMessage,
    query,
    revokeError,
    revokeLoading,
    revokeSuccessMessage,
    selectedChurchId,
  } = useAppSelector((state) => state.church);
  const membershipStatus = memberAccount?.membershipStatus ?? null;
  const canJoinChurch = Boolean(memberAccount) && canRequestChurchMembership(membershipStatus);
  const pendingRequestId = getPendingMembershipRequestId(memberAccount);
  const approvedChurchDetails = useMemo(() => getApprovedChurchDetails(memberAccount), [memberAccount]);
  const selectedChurch = useMemo(
    () => items.find((church) => church.id === selectedChurchId) ?? null,
    [items, selectedChurchId],
  );
  const hasMoreChurches = Boolean(meta && meta.page < meta.totalPages);
  const nextChurchPage = (meta?.page ?? 1) + 1;

  useEffect(() => {
    if (!canJoinChurch) return;
    if (initialFetchRequested.current || lastFetchedAt) return;

    initialFetchRequested.current = true;
    dispatch(fetchChurchRegistrationOptionsThunk({ search: query, page: 1, limit: 20 }));
  }, [canJoinChurch, dispatch, lastFetchedAt, query]);

  useEffect(() => {
    if (!canJoinChurch) return;

    if (!searchEffectReady.current) {
      searchEffectReady.current = true;
      return;
    }

    const debounceTimer = window.setTimeout(() => {
      dispatch(fetchChurchRegistrationOptionsThunk({ search: query, page: 1, limit: 20 }));
    }, 350);

    return () => window.clearTimeout(debounceTimer);
  }, [canJoinChurch, dispatch, query]);

  useEffect(() => {
    if (!canJoinChurch) return;

    const sentinel = loadMoreRef.current;

    if (!sentinel || !hasMoreChurches || loading || loadingMore || error || loadMoreError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        dispatch(fetchChurchRegistrationOptionsThunk({ search: query, page: nextChurchPage, limit: 20 }));
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [canJoinChurch, dispatch, error, hasMoreChurches, loadMoreError, loading, loadingMore, nextChurchPage, query]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setChurchQuery(event.target.value));
    dispatch(setSelectedChurchId(null));
  };

  const handleRetryChurches = () => {
    dispatch(clearChurchError());
    dispatch(fetchChurchRegistrationOptionsThunk({ search: query, page: 1, limit: 20 }));
  };

  const handleRetryLoadMoreChurches = () => {
    dispatch(clearChurchError());
    dispatch(fetchChurchRegistrationOptionsThunk({ search: query, page: nextChurchPage, limit: 20 }));
  };

  const handleRetryMemberAccount = () => {
    dispatch(fetchMemberAccountThunk());
  };

  const handleRevokeMembershipRequest = async () => {
    if (!pendingRequestId) {
      const errorMessage = 'Unable to find the pending church request id. Please refresh and try again.';
      setRevokeRequestIdError(errorMessage);
      dispatch(pushNotification({ type: 'error', title: 'Unable to revoke request', message: errorMessage }));
      return;
    }

    setRevokeRequestIdError(null);
    dispatch(clearChurchRevokeStatus());

    try {
      const response = await dispatch(revokeMembershipRequestThunk({ requestId: pendingRequestId })).unwrap();
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Church request revoked',
          message: response.message || 'Your pending church request has been withdrawn.',
        }),
      );
      dispatch(fetchMemberAccountThunk());
    } catch (requestError) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to revoke request',
          message: getChurchRequestErrorMessage(requestError),
        }),
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedChurchId) return;

    dispatch(clearChurchOnboardingStatus());

    try {
      const response = await dispatch(onboardMemberToChurchThunk({ churchId: selectedChurchId })).unwrap();
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Join request sent',
          message: response.message || 'Your request has been sent to the church admin.',
        }),
      );
      dispatch(fetchMemberAccountThunk());
    } catch (requestError) {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Unable to send request',
          message: getChurchRequestErrorMessage(requestError),
        }),
      );
    }
  };

  if (memberLoading && !memberAccount) {
    return (
      <div className="grid min-h-[55vh] place-items-center pb-28">
        <AppLoader label="Loading membership" />
      </div>
    );
  }

  if (memberError && !memberAccount) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <AppText variant="h6" color="#991B1B" align="center">
              Unable to load membership
            </AppText>
            <AppText variant="bodySmall" color="#B91C1C" align="center">
              {memberError}
            </AppText>
          </div>
          <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={memberLoading} onClick={handleRetryMemberAccount}>
            Retry
          </AppButton>
        </div>
      </div>
    );
  }

  if (!memberAccount) {
    return (
      <div className="grid min-h-[55vh] place-items-center pb-28">
        <AppLoader label="Loading membership" />
      </div>
    );
  }

  if (membershipStatus === 'PENDING') {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
            <Clock3 className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <AppText variant="h6" align="center">
              Church request pending
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" align="center">
              Your church request is pending review. You can withdraw it and choose another church if needed.
            </AppText>
          </div>

          {revokeError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {revokeError}
            </div>
          )}

          {revokeRequestIdError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {revokeRequestIdError}
            </div>
          )}

          {revokeSuccessMessage && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {revokeSuccessMessage}
            </div>
          )}

          <AppButton
            fullWidth
            disabled={memberLoading}
            loading={revokeLoading}
            variant="outline"
            onClick={handleRevokeMembershipRequest}
          >
            Revoke church request
          </AppButton>
        </div>
      </div>
    );
  }

  if (membershipStatus === 'APPROVED') {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <div className="grid gap-2">
            <AppText variant="h6" align="center">
              You are a member of {approvedChurchDetails.churchName}
            </AppText>
            {(approvedChurchDetails.associationName || approvedChurchDetails.conferenceName) && (
              <AppText variant="bodySmall" color="textSecondary" align="center">
                {[approvedChurchDetails.associationName, approvedChurchDetails.conferenceName].filter(Boolean).join(' - ')}
              </AppText>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading && !lastFetchedAt) {
    return (
      <div className="grid min-h-[55vh] place-items-center pb-28">
        <AppLoader label="Loading churches" />
      </div>
    );
  }

  if (error && !lastFetchedAt) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-2 pb-28">
        <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
            <AlertCircle className="size-6" aria-hidden />
          </span>
          <div className="grid gap-1">
            <AppText variant="h6" color="#991B1B" align="center">
              Unable to load churches
            </AppText>
            <AppText variant="bodySmall" color="#B91C1C" align="center">
              {error}
            </AppText>
          </div>
          <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={loading} onClick={handleRetryChurches}>
            Retry
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 pb-28">
      <form className="grid gap-4" id="church-membership-form" onSubmit={handleSubmit}>
        <AppInput
          label="Search church"
          placeholder="Search by church name"
          value={query}
          onChange={handleSearchChange}
        />

        {meta && (
          <AppText variant="caption" color="textMuted">
            Showing {items.length} of {meta.total} churches
          </AppText>
        )}

        {loading && (
          <div className="grid min-h-40 place-items-center">
            <AppLoader label="Loading churches" />
          </div>
        )}

        {error && (
          <div className="grid min-h-40 place-items-center px-2">
            <div className="grid w-full max-w-sm justify-items-center gap-3 text-center">
              <AppText variant="bodySmall" color="#B91C1C" align="center">
                {error}
              </AppText>
              <AppButton leftIcon={<RefreshCw className="size-4" aria-hidden />} loading={loading} size="sm" onClick={handleRetryChurches}>
                Retry
              </AppButton>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-2" role="listbox" aria-label="Church registration options">
              {items.map((church) => {
                const selected = church.id === selectedChurchId;

                return (
                  <button
                    className={`grid min-h-16 gap-1 rounded-lg border p-3 text-left transition ${
                      selected
                        ? 'border-[#123B8D] bg-[#EAF1FF] shadow-[0_8px_20px_rgba(18,59,141,0.12)]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#123B8D] hover:bg-[#F8FAFC]'
                    }`}
                    key={church.id}
                    role="option"
                    aria-selected={selected}
                    type="button"
                    onClick={() => dispatch(setSelectedChurchId(church.id))}
                  >
                    <span className="min-w-0 truncate text-sm font-bold text-[#0B1F4A]">{church.name}</span>
                    <span className="min-w-0 truncate text-xs font-semibold text-[#6B7890]">
                      {getChurchAssociationName(church)}
                    </span>
                  </button>
                );
              })}

              {items.length === 0 && (
                <div className="grid min-h-36 place-items-center text-center">
                  <AppText variant="bodySmall" color="textMuted">
                    {query.trim() ? 'No church found for your search.' : 'No churches available.'}
                  </AppText>
                </div>
              )}
            </div>

            {hasMoreChurches && !loadMoreError && (
              <div ref={loadMoreRef} className="grid min-h-16 place-items-center">
                {loadingMore ? <AppLoader label="Loading more churches" /> : <span className="sr-only">Load more churches</span>}
              </div>
            )}

            {loadMoreError && (
              <div className="grid justify-items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-center">
                <AppText variant="bodySmall" color="#B91C1C" align="center">
                  {loadMoreError}
                </AppText>
                <AppButton
                  leftIcon={<RefreshCw className="size-4" aria-hidden />}
                  loading={loadingMore}
                  size="sm"
                  variant="outline"
                  onClick={handleRetryLoadMoreChurches}
                >
                  Retry
                </AppButton>
              </div>
            )}
          </>
        )}

        {selectedChurch && (
          <div className="grid gap-1 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
            <AppText variant="bodyMedium" weight="bold">
              {selectedChurch.name}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary">
              {getChurchAssociationName(selectedChurch)}
            </AppText>
          </div>
        )}

        {onboardingError && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {onboardingError}
          </div>
        )}

        {onboardingSuccessMessage && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            {onboardingSuccessMessage}
          </div>
        )}
      </form>
      <div className="fixed right-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-0 z-40 border-t border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-[0_-16px_36px_rgba(11,31,74,0.12)] backdrop-blur min-[1181px]:bottom-0 min-[1181px]:left-[18rem] min-[1181px]:px-9">
        <div className="mx-auto max-w-[78rem]">
          <AppButton
            fullWidth
            form="church-membership-form"
            loading={onboardingLoading}
            disabled={!selectedChurchId || !selectedChurch || loading || Boolean(error)}
            type="submit"
          >
            Send join request
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const memberFetchRequested = useRef(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const memberAccount = useAppSelector((state) => state.member.data);
  const { data, error, lastFetchedAt, loading } = useAppSelector((state) => state.profile);
  const headerAvatarName =
    memberAccount?.basicProfile?.displayName ||
    [memberAccount?.basicProfile?.firstName, memberAccount?.basicProfile?.lastName].filter(Boolean).join(' ') ||
    (data ? getProfileDisplayName(data) : 'Member Profile');
  const headerAvatarSrc = memberAccount?.basicProfile?.avatarUrl || undefined;

  const shouldFetchProfile = activeTab === 'profile' && !data && !loading && !error;

  useEffect(() => {
    if (!isAuthenticated) {
      memberFetchRequested.current = false;
      return;
    }

    if (memberFetchRequested.current) return;

    memberFetchRequested.current = true;
    dispatch(fetchMemberAccountThunk());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (shouldFetchProfile) {
      dispatch(fetchProfileCompletionThunk());
    }
  }, [dispatch, shouldFetchProfile]);

  const retryProfileFetch = useCallback(() => {
    dispatch(fetchProfileCompletionThunk());
  }, [dispatch]);

  const activePanel = useMemo(() => {
    if (activeTab === 'church') {
      return <ChurchMembershipPanel />;
    }

    if (loading && !data) {
      return <ProfileLoading />;
    }

    if (error && !data) {
      return <ProfileError message={error} onRetry={retryProfileFetch} />;
    }

    if (data) {
      return <ProfileCompletionView profile={data} lastFetchedAt={lastFetchedAt} />;
    }

    return null;
  }, [activeTab, data, error, lastFetchedAt, loading, retryProfileFetch]);

  return (
    <AppShell headerAvatar={<AppAvatar name={headerAvatarName} src={headerAvatarSrc} size="md" />}>
      <div className="min-w-0 overflow-hidden">
        <div className="sticky top-[1rem] z-10 -mt-2 min-w-0 overflow-hidden bg-white/95 backdrop-blur md:top-[4.5rem] md:-mt-3">
          <div className="mx-auto max-w-[78rem] min-w-0 overflow-hidden">
            <AppScrollableTabs
              tabs={tabs}
              value={activeTab}
              ariaLabel="Profile sections"
              fullWidthTabs
              onValueChange={(next) => setActiveTab(next as ProfileTab)}
            />
          </div>
        </div>

        <section
          className="mx-auto max-w-[78rem] px-4 py-6 pb-28 sm:px-6 md:px-9"
          role="tabpanel"
          aria-label={tabText[activeTab]}
        >
          {activePanel}
        </section>
      </div>
    </AppShell>
  );
}
