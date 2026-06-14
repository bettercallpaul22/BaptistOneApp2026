import type { ChurchDocumentItem, ChurchEventItem } from '@/types/church';

export const getSortValue = (item: { orderIndex?: number | null }) =>
  typeof item.orderIndex === 'number' ? item.orderIndex : Number.MAX_SAFE_INTEGER;

export const sortByOrderAndDate = <TItem extends { orderIndex?: number | null; createdAt?: string }>(items: TItem[]) =>
  [...items].sort((firstItem, secondItem) => {
    const orderDifference = getSortValue(firstItem) - getSortValue(secondItem);

    if (orderDifference !== 0) return orderDifference;

    return (firstItem.createdAt ?? '').localeCompare(secondItem.createdAt ?? '');
  });

export const getDocumentName = (document: Pick<ChurchDocumentItem, 'name'>) =>
  document.name?.trim() || 'Church document';

export const getFileExtension = (document: ChurchDocumentItem) => {
  const contentType = document.file?.contentType?.split('/').pop()?.trim();
  const keyExtension = document.file?.key?.split('.').pop()?.trim();

  return (contentType || keyExtension || 'file').toUpperCase();
};

export const formatFileSize = (size?: number | null) => {
  if (typeof size !== 'number') return null;

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const getEventTitle = (event: Pick<ChurchEventItem, 'title'>) =>
  event.title?.trim() || 'Church event';

export const formatEventType = (type?: string | null) => {
  const normalizedType = type?.trim();

  if (!normalizedType) return 'Event';

  return normalizedType
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
};

export const formatEventDate = (event: Pick<ChurchEventItem, 'endAt' | 'isAllDay' | 'startAt'>) => {
  if (!event.startAt) return 'Date not provided';

  const startDate = new Date(event.startAt);
  const endDate = event.endAt ? new Date(event.endAt) : null;

  if (Number.isNaN(startDate.getTime())) return event.startAt;

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    ...(event.isAllDay ? {} : { timeStyle: 'short' as const }),
  });
  const startLabel = dateFormatter.format(startDate);

  if (!endDate || Number.isNaN(endDate.getTime())) return startLabel;

  return `${startLabel} - ${dateFormatter.format(endDate)}`;
};

export const getEventLocation = (event: Pick<ChurchEventItem, 'location'>) =>
  [event.location?.name, event.location?.address].filter(Boolean).join(' - ');
