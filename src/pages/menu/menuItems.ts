import bibleIcon from '@/assets/icons/app_bible.svg';
import eventIcon from '@/assets/icons/app_event.svg';
import familyIcon from '@/assets/icons/app_family.svg';
import givingIcon from '@/assets/icons/app_giving.svg';
import hymnIcon from '@/assets/icons/app_hymn.svg';
import forumIcon from '@/assets/icons/app_forum.svg';
import ministryIcon from '@/assets/icons/app_ministry.svg';
import cartIcon from '@/assets/icons/app_cart.svg';
import walletIcon from '@/assets/icons/app_wallet.svg';
import type { QuickActionCardTone } from '@/components/display';
import { paths } from '@/routes/paths';

export interface QuickAction {
  label: string;
  icon: string;
  tone: QuickActionCardTone;
  to?: string;
}

export const menuItems: QuickAction[] = [
  { label: 'Bible', icon: bibleIcon, tone: 'primary', to: paths.bible },
  { label: 'Hymns', icon: hymnIcon, tone: 'gold', to: paths.hymnal },
  { label: 'Events', icon: eventIcon, tone: 'plain', to: paths.events },
  { label: 'Convention', icon: eventIcon, tone: 'plain', to: paths.convention },
  { label: 'Family', icon: familyIcon, tone: 'plain', to: paths.family },
  { label: 'Forum', icon: forumIcon, tone: 'plain', to: paths.forum },
  { label: 'Ministry', icon: ministryIcon, tone: 'plain', to: paths.ministries },
  { label: 'Giving', icon: givingIcon, tone: 'plain', to: paths.donation },
  { label: 'Resources', icon: cartIcon, tone: 'plain', to: paths.resources },
  { label: 'Wallet', icon: walletIcon, tone: 'plain', to: paths.wallet },
];
