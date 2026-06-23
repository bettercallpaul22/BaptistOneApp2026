export interface ForumMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ForumPost {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ForumSummary {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  unitId?: string;
  members: ForumMember[];
  posts: ForumPost[];
  postCount: number;
}

export interface ForumDepartment {
  id: string;
  title: string;
  description: string;
  joined: boolean;
  members: ForumMember[];
  forumIds: string[];
}

export interface ForumUnit {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  joined: boolean;
  members: ForumMember[];
  forumIds: string[];
}

const basicMembers: ForumMember[] = [
  { id: '1', name: 'Maria O.' },
  { id: '2', name: 'Joshua T.' },
  { id: '3', name: 'Ruth A.' },
  { id: '4', name: 'Daniel S.' },
  { id: '5', name: 'Tara K.' },
  { id: '6', name: 'Ibrahim H.' },
  { id: '7', name: 'Grace N.' },
  { id: '8', name: 'Blessing P.' },
  { id: '9', name: 'Hannah E.' },
  { id: '10', name: 'Samuel A.' },
  { id: '11', name: 'Paul F.' },
  { id: '12', name: 'Tunde M.' },
  { id: '13', name: 'Ada E.' },
  { id: '14', name: 'Chinonso L.' },
  { id: '15', name: 'Moses N.' },
];

const makePosts = (forumName: string, count: number): ForumPost[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${forumName}-${index + 1}`,
    authorName: basicMembers[index % basicMembers.length].name,
    content: `This is a sample post for ${forumName}. It helps the team discuss the latest updates and share ideas in this forum.`,
    createdAt: `${index + 1}h ago`,
  }));

export const forums: ForumSummary[] = [
  {
    id: 'general-discussion',
    title: 'General Discussion',
    description: 'A forum for church announcements, volunteer coordination, and community support.',
    departmentId: 'general',
    members: [basicMembers[0], basicMembers[1], basicMembers[2], basicMembers[3]],
    posts: makePosts('general-discussion', 4),
    postCount: 14,
  },
  {
    id: 'worship-planning',
    title: 'Worship Planning',
    description: 'Plan service songs, rehearsal schedules, and worship team updates.',
    departmentId: 'general',
    unitId: 'worship-team',
    members: [basicMembers[0], basicMembers[5], basicMembers[6]],
    posts: makePosts('worship-planning', 6),
    postCount: 21,
  },
  {
    id: 'youth-events',
    title: 'Youth Events',
    description: 'Coordinate youth meetups, retreats, and mentorship sessions.',
    departmentId: 'youth',
    unitId: 'youth-ministry',
    members: [basicMembers[3], basicMembers[4], basicMembers[5]],
    posts: makePosts('youth-events', 5),
    postCount: 18,
  },
  {
    id: 'teen-bible-study',
    title: 'Teen Bible Study',
    description: 'Share study notes, questions, and prayer points for teens.',
    departmentId: 'youth',
    unitId: 'teen-groups',
    members: [basicMembers[4], basicMembers[7], basicMembers[8]],
    posts: makePosts('teen-bible-study', 4),
    postCount: 12,
  },
  {
    id: 'women-prayer-circle',
    title: 'Women Prayer Circle',
    description: 'Share prayers, encouragement, and support within the women’s ministry.',
    departmentId: 'women',
    unitId: 'women-prayer',
    members: [basicMembers[6], basicMembers[7], basicMembers[8]],
    posts: makePosts('women-prayer-circle', 4),
    postCount: 11,
  },
  {
    id: 'women-leadership',
    title: 'Women Leadership',
    description: 'Coordinate women’s ministry plans, events, and small group leaders.',
    departmentId: 'women',
    unitId: 'women-leadership',
    members: [basicMembers[7], basicMembers[9], basicMembers[10]],
    posts: makePosts('women-leadership', 3),
    postCount: 9,
  },
  {
    id: 'men-disciple',
    title: 'Men Discipleship',
    description: 'Discuss spiritual growth, mentoring, and church leadership for men.',
    departmentId: 'men',
    unitId: 'men-disciple',
    members: [basicMembers[9], basicMembers[10], basicMembers[11]],
    posts: makePosts('men-disciple', 5),
    postCount: 15,
  },
  {
    id: 'missions-outreach',
    title: 'Missions Outreach',
    description: 'Coordinate outreach teams, mission updates, and community care.',
    departmentId: 'missions',
    unitId: 'missions-outreach',
    members: [basicMembers[12], basicMembers[13], basicMembers[14]],
    posts: makePosts('missions-outreach', 6),
    postCount: 20,
  },
];

export const departments: ForumDepartment[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Open conversation for church announcements, service coordination, and fellowship.',
    joined: false,
    members: [basicMembers[0], basicMembers[1], basicMembers[2], basicMembers[3]],
    forumIds: ['general-discussion', 'worship-planning'],
  },
  {
    id: 'youth',
    title: 'Youth',
    description: 'Youth ministry discussions, events, and leadership planning.',
    joined: false,
    members: [basicMembers[3], basicMembers[4], basicMembers[5], basicMembers[7]],
    forumIds: ['youth-events', 'teen-bible-study'],
  },
  {
    id: 'women',
    title: 'Women',
    description: 'Women’s prayer support, mentorship, and ministry coordination.',
    joined: false,
    members: [basicMembers[6], basicMembers[7], basicMembers[8], basicMembers[9]],
    forumIds: ['women-prayer-circle', 'women-leadership'],
  },
  {
    id: 'men',
    title: 'Men',
    description: 'Men’s fellowship, accountability, and spiritual growth groups.',
    joined: false,
    members: [basicMembers[9], basicMembers[10], basicMembers[11], basicMembers[12]],
    forumIds: ['men-disciple'],
  },
  {
    id: 'missions',
    title: 'Missions',
    description: 'Outreach planning, volunteer coordination, and global mission updates.',
    joined: false,
    members: [basicMembers[12], basicMembers[13], basicMembers[14]],
    forumIds: ['missions-outreach'],
  },
];

export const units: ForumUnit[] = [
  {
    id: 'worship-team',
    title: 'Worship Team',
    description: 'Forum for planning worship services and rehearsals.',
    departmentId: 'general',
    joined: false,
    members: [basicMembers[0], basicMembers[5], basicMembers[6]],
    forumIds: ['worship-planning'],
  },
  {
    id: 'youth-ministry',
    title: 'Youth Ministry',
    description: 'Youth ministry coordination for events and discipleship.',
    departmentId: 'youth',
    joined: false,
    members: [basicMembers[3], basicMembers[4], basicMembers[5]],
    forumIds: ['youth-events'],
  },
  {
    id: 'teen-groups',
    title: 'Teen Groups',
    description: 'Teen small group planning and Bible study discussions.',
    departmentId: 'youth',
    joined: false,
    members: [basicMembers[4], basicMembers[7], basicMembers[8]],
    forumIds: ['teen-bible-study'],
  },
  {
    id: 'women-prayer',
    title: 'Women Prayer',
    description: "Women's prayer teams and encouragement support.",
    departmentId: 'women',
    joined: false,
    members: [basicMembers[6], basicMembers[7], basicMembers[8]],
    forumIds: ['women-prayer-circle'],
  },
  {
    id: 'women-leadership',
    title: 'Women Leadership',
    description: "Women's ministry leader coordination and resourcing.",
    departmentId: 'women',
    joined: false,
    members: [basicMembers[7], basicMembers[9], basicMembers[10]],
    forumIds: ['women-leadership'],
  },
  {
    id: 'men-disciple',
    title: 'Men Discipleship',
    description: "Men's leadership and mentorship discussion forum.",
    departmentId: 'men',
    joined: false,
    members: [basicMembers[9], basicMembers[10], basicMembers[11]],
    forumIds: ['men-disciple'],
  },
  {
    id: 'missions-outreach',
    title: 'Missions Outreach',
    description: 'Mission team planning, reports, and volunteer coordination.',
    departmentId: 'missions',
    joined: false,
    members: [basicMembers[12], basicMembers[13], basicMembers[14]],
    forumIds: ['missions-outreach'],
  },
];

export const findForum = (forumId: string) => forums.find((forum) => forum.id === forumId);
export const getForumsByDepartment = (departmentId: string) =>
  forums.filter((forum) => forum.departmentId === departmentId);
export const getForumsByUnit = (unitId: string) =>
  forums.filter((forum) => forum.unitId === unitId);
export const findDepartment = (departmentId: string) =>
  departments.find((department) => department.id === departmentId);
export const findUnit = (unitId: string) => units.find((unit) => unit.id === unitId);
