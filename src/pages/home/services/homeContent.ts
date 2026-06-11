import type { HomeFeature, HomeStatistic, Testimonial } from '../types/home';

export const features: HomeFeature[] = [
  {
    title: 'Bible Offline',
    description: 'Read scripture anywhere with saved plans, bookmarks, and highlights.',
  },
  {
    title: 'Baptist Hymns',
    description: 'Carry a curated Baptist hymn library for worship, rehearsal, and devotion.',
  },
  {
    title: 'Church Connection',
    description: 'Stay aligned with your local church, groups, events, and announcements.',
  },
];

export const statistics: HomeStatistic[] = [
  { label: 'Churches connected', value: '1,200+' },
  { label: 'Hymns available', value: '650+' },
  { label: 'Daily readers', value: '48k' },
  { label: 'Prayer requests', value: '92k' },
];

export const testimonials: Testimonial[] = [
  {
    name: 'Ayo Martins',
    role: 'Choir Lead',
    quote: 'BaptistOne keeps our worship materials and announcements in one calm, reliable place.',
  },
  {
    name: 'Grace Idowu',
    role: 'Youth Coordinator',
    quote: 'The app makes it easier to reach members, share devotionals, and organize weekly activities.',
  },
];

export const updates = [
  'New Sunday school study guide published',
  'Youth convention registration is open',
  'Offline hymn sync improved for low network areas',
];
