import type { ChurchLeadershipItem } from '@/types/church';

export const leaderTypeLabels: Record<string, { singular: string; plural: string }> = {
  PASTOR: { singular: 'Pastor', plural: 'Pastors' },
  MINISTER: { singular: 'Minister', plural: 'Ministers' },
  DEACON: { singular: 'Deacon', plural: 'Deacons' },
  COUNCIL: { singular: 'Council', plural: 'Council' },
};

export const formatLeaderType = (type: string | null | undefined) => {
  const normalizedType = type?.trim();

  if (!normalizedType) return 'Leader';

  return normalizedType
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
};

export const getLeaderTypeKey = (leader: Pick<ChurchLeadershipItem, 'type'>) =>
  leader.type?.trim().toUpperCase() || 'LEADER';

export const getLeaderGroupTitle = (leader: Pick<ChurchLeadershipItem, 'type'>) => {
  const typeKey = getLeaderTypeKey(leader);

  return leaderTypeLabels[typeKey]?.plural ?? formatLeaderType(typeKey);
};

export const getLeaderRole = (leader: Pick<ChurchLeadershipItem, 'title' | 'type'>) => {
  const title = leader.title?.trim();

  return title || leaderTypeLabels[getLeaderTypeKey(leader)]?.singular || formatLeaderType(leader.type);
};

export const getLeaderName = (leader: Pick<ChurchLeadershipItem, 'name'>) =>
  leader.name?.trim() || 'Church leader';

export const getLeaderSortValue = (leader: Pick<ChurchLeadershipItem, 'orderIndex'>) =>
  typeof leader.orderIndex === 'number' ? leader.orderIndex : Number.MAX_SAFE_INTEGER;

export const sortLeadership = (leadership: ChurchLeadershipItem[]) =>
  [...leadership].sort((firstLeader, secondLeader) => {
    const orderDifference = getLeaderSortValue(firstLeader) - getLeaderSortValue(secondLeader);

    if (orderDifference !== 0) return orderDifference;

    return (firstLeader.createdAt ?? '').localeCompare(secondLeader.createdAt ?? '');
  });

export const getLeadershipGroups = (leadership: ChurchLeadershipItem[]) => {
  const groups = new Map<string, { type: string; title: string; people: ChurchLeadershipItem[] }>();

  sortLeadership(leadership).forEach((leader) => {
    const typeKey = getLeaderTypeKey(leader);
    const group = groups.get(typeKey) ?? { type: typeKey, title: getLeaderGroupTitle(leader), people: [] };

    group.people.push(leader);
    groups.set(typeKey, group);
  });

  return Array.from(groups.values());
};
