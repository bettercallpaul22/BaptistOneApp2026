import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { AppText } from '@/components/common';
import { AppImage } from '@/components/display';
import type {
  ProfileCompletion,
  ProfileFileAsset,
  ProfileInformationSection,
  ProfileSectionValue,
} from '@/types/profile';
import { emptyText } from '../config/profileConfig';
import { formatLabel, formatMaybeDate } from './profileFormatters';

export const isEmptyValue = (value: ProfileSectionValue): boolean => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

const capitalizeFirstLetter = (str: string): string =>
  str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const formatPrimitive = (value: ProfileSectionValue): string => {
  if (value === null || value === undefined || value === '') return emptyText;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') {
    const formatted = formatMaybeDate(value);
    return formatted === emptyText ? formatted : capitalizeFirstLetter(formatted);
  }
  return '';
};

export const isProfileFileAsset = (value: ProfileSectionValue): value is ProfileFileAsset =>
  Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as Partial<ProfileFileAsset>).url === 'string' &&
    typeof (value as Partial<ProfileFileAsset>).contentType === 'string',
  );

export const isImageFileAsset = (value: ProfileFileAsset) =>
  value.contentType.toLowerCase().startsWith('image/');

export const getFileDisplayName = (file: ProfileFileAsset) =>
  file.altText || file.key?.split('/').pop() || file.url;

export const getMatchingFileKeys = (key: string) => {
  if (key.endsWith('FileIds')) {
    const base = key.slice(0, -'FileIds'.length);
    return [`${base}Files`, `${base}File`];
  }

  if (key.endsWith('FileId')) {
    const base = key.slice(0, -'FileId'.length);
    return [`${base}File`];
  }

  if (key.endsWith('Url')) {
    const base = key.slice(0, -'Url'.length);
    return [`${base}File`];
  }

  return [];
};

export const hasMatchingFileAsset = (section: ProfileInformationSection, key: string) =>
  getMatchingFileKeys(key).some((fileKey) => {
    const fileValue = section[fileKey];
    if (isProfileFileAsset(fileValue)) return true;
    if (Array.isArray(fileValue)) return fileValue.some((item) => isProfileFileAsset(item));
    return false;
  });

export const renderFilePreview = (file: ProfileFileAsset) => {
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

export const renderFileAsset = (file: ProfileFileAsset) => {
  return (
    <div className="flex min-w-0 items-center justify-end rounded-lg bg-[#F8FAFC] p-3">
      {renderFilePreview(file)}
    </div>
  );
};

export const renderDetailRow = (label: string, value: ReactNode, key?: string) => (
  <div
    className="flex min-w-0 items-start justify-between gap-4 py-1.5"
    key={key}
  >
    <AppText className="shrink-0 pt-0.5" variant="caption" color="textMuted" weight="bold">
      {label}
    </AppText>
    <div className="min-w-0 text-right text-sm font-semibold text-[#0B1F4A]">{value}</div>
  </div>
);

export const renderStructuredObject = (value: ProfileInformationSection, label?: string) => {
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
        {entries.map(([itemKey, itemValue]) =>
          renderDetailRow(formatLabel(itemKey), renderValue(itemValue), itemKey),
        )}
      </div>
    </div>
  );
};

export const getObjectSummary = (value: ProfileInformationSection, fallback: string) => {
  const preferredValue = value.name || value.displayName || value.firstName || value.relationship;
  return typeof preferredValue === 'string' && preferredValue.trim() ? preferredValue : fallback;
};

export const renderCollapsibleObject = (value: ProfileInformationSection, label: string) => (
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
      <ChevronDown
        className="size-4 shrink-0 text-[#123B8D] transition-transform duration-200 group-open:rotate-180"
        aria-hidden
      />
    </summary>
    <div className="border-t border-[#E7ECF4] px-3 py-3">{renderStructuredObject(value)}</div>
  </details>
);

export const renderInformationEntry = (key: string, value: ProfileSectionValue) => {
  if (isProfileFileAsset(value)) {
    return (
      <div
        className="flex min-w-0 items-center justify-between gap-4 border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0"
        key={key}
      >
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
      <div
        className="grid gap-2 border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0"
        key={key}
      >
        <AppText variant="caption" color="textMuted" weight="bold">
          {formatLabel(key)}
        </AppText>
        <div className="grid gap-2">
          {value.filter(isProfileFileAsset).map((file) => (
            <div
              className="flex min-w-0 items-center justify-between gap-4 rounded-lg bg-[#F8FAFC] p-3"
              key={file.id || file.url}
            >
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
    value.every(
      (item) =>
        item && typeof item === 'object' && !Array.isArray(item) && !isProfileFileAsset(item),
    )
  ) {
    const isChildrenArray = key === 'children' || key === 'childrenInformation';
    return (
      <div
        className="grid gap-2 border-b border-[#EEF2F7] pb-3 last:border-b-0 last:pb-0"
        key={key}
      >
        <AppText variant="caption" color="textMuted" weight="bold">
          {formatLabel(key)}
        </AppText>
        <div className="grid gap-3">
          {value.map((item, index) => {
            const section = item as ProfileInformationSection;
            const label = isChildrenArray
              ? (section.name as string) || `Child ${index + 1}`
              : `Item ${index + 1}`;
            return (
              <div
                key={index}
                className="rounded-lg border border-[#EEF2F7] bg-[#F8FAFC] p-3"
              >
                <AppText variant="bodySmall" weight="bold" className="mb-1.5 text-[#123B8D]">
                  {label}
                </AppText>
                <div className="grid gap-1">
                  {Object.entries(section)
                    .filter(([, v]) => !isEmptyValue(v))
                    .map(([fieldKey, fieldVal]) =>
                      renderDetailRow(formatLabel(fieldKey), renderValue(fieldVal), fieldKey),
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return renderDetailRow(formatLabel(key), renderValue(value), key);
};

export const renderValue = (value: ProfileSectionValue): ReactNode => {
  if (isEmptyValue(value)) return emptyText;

  if (isProfileFileAsset(value)) {
    return renderFileAsset(value);
  }

  if (Array.isArray(value)) {
    return (
      <div className="grid gap-2">
        {value.map((item, index) => (
          <div
            className="rounded-lg bg-[#F8FAFC] p-3"
            key={`${index}-${JSON.stringify(item).slice(0, 20)}`}
          >
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
    const entries = Object.entries(section).filter(
      ([itemKey, itemValue]) =>
        !isEmptyValue(itemValue) && !hasMatchingFileAsset(section, itemKey),
    );

    if (entries.length === 0) return emptyText;

    const allPrimitive = entries.every(([, v]) =>
      v === null || v === undefined || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
    );

    if (allPrimitive) {
      const parts = entries
        .map(([, v]) => formatPrimitive(v))
        .filter((p) => p !== emptyText);
      return parts.length > 0 ? parts.join(', ') : emptyText;
    }

    return (
      <div className="rounded-lg bg-[#F8FAFC] p-3">
        <div className="grid gap-1.5">
          {entries.map(([itemKey, itemValue]) =>
            renderDetailRow(formatLabel(itemKey), renderValue(itemValue), itemKey),
          )}
        </div>
      </div>
    );
  }

  return formatPrimitive(value);
};

export const getSectionEntries = (
  section: unknown,
): Array<readonly [string, ProfileSectionValue]> => {
  if (Array.isArray(section)) {
    return section.length
      ? section.map((item, index) => [`Item ${index + 1}`, item as ProfileSectionValue] as const)
      : [];
  }

  if (section && typeof section === 'object') {
    const sectionObject = section as ProfileInformationSection;
    return Object.entries(sectionObject).filter(
      ([key]) => !hasMatchingFileAsset(sectionObject, key),
    );
  }

  return [];
};

export const getStringValue = (section: ProfileInformationSection, key: string) => {
  const value = section[key];
  return typeof value === 'string' && value.trim() ? value : '';
};

export const getProfileDisplayName = (profile: ProfileCompletion) => {
  const personal = profile.personalInformation;
  const contact = profile.contactInformation;

  return (
    getStringValue(personal, 'displayName') ||
    [getStringValue(personal, 'firstName'), getStringValue(personal, 'lastName')]
      .filter(Boolean)
      .join(' ') ||
    getStringValue(contact, 'email') ||
    'Member Profile'
  );
};

export const getAvatarLabel = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MP';

export const getSectionObject = (section: unknown): ProfileInformationSection => {
  if (Array.isArray(section)) return {};
  if (section && typeof section === 'object') return section as ProfileInformationSection;
  return {};
};
