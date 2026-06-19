import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

export type NativeIconName =
  | 'arrow-left'
  | 'bell'
  | 'bible'
  | 'bookmark'
  | 'book-open'
  | 'briefcase'
  | 'building'
  | 'calendar'
  | 'church'
  | 'clock'
  | 'globe'
  | 'heart'
  | 'home'
  | 'log-out'
  | 'map-pin'
  | 'megaphone'
  | 'menu'
  | 'message-circle'
  | 'more-horizontal'
  | 'music'
  | 'phone'
  | 'search'
  | 'settings'
  | 'share'
  | 'shield-alert'
  | 'shopping-cart'
  | 'sprout'
  | 'star'
  | 'user'
  | 'users'
  | 'video'
  | 'volume'
  | 'wallet';

interface NativeIconProps {
  name: NativeIconName;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function NativeIcon({
  name,
  color = colors.primaryDark,
  size = 24,
  strokeWidth = 2.2,
}: NativeIconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'arrow-left' ? (
        <>
          <Path d="m12 19-7-7 7-7" {...common} />
          <Path d="M19 12H5" {...common} />
        </>
      ) : null}
      {name === 'menu' ? (
        <>
          <Path d="M4 7h16" {...common} />
          <Path d="M4 12h16" {...common} />
          <Path d="M4 17h16" {...common} />
        </>
      ) : null}
      {name === 'globe' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M3 12h18" {...common} />
          <Path d="M12 3a14 14 0 0 1 0 18" {...common} />
          <Path d="M12 3a14 14 0 0 0 0 18" {...common} />
        </>
      ) : null}
      {name === 'more-horizontal' ? (
        <>
          <Circle cx="5" cy="12" r="1" {...common} />
          <Circle cx="12" cy="12" r="1" {...common} />
          <Circle cx="19" cy="12" r="1" {...common} />
        </>
      ) : null}
      {name === 'volume' ? (
        <>
          <Path d="M4 9v6h4l5 4V5L8 9H4Z" {...common} />
          <Path d="M16 9a5 5 0 0 1 0 6" {...common} />
          <Path d="M18.5 6.5a9 9 0 0 1 0 11" {...common} />
        </>
      ) : null}
      {name === 'home' ? (
        <>
          <Path d="M3 11.5 12 4l9 7.5" {...common} />
          <Path d="M5.5 10.5V20h13v-9.5" {...common} />
          <Path d="M9.5 20v-5h5v5" {...common} />
        </>
      ) : null}
      {name === 'bible' ? (
        <>
          <Path d="M6 4h10.5A2.5 2.5 0 0 1 19 6.5V21H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" {...common} />
          <Path d="M7 17h12" {...common} />
          <Path d="M8 8h6" {...common} />
          <Path d="M11 6v7" {...common} />
        </>
      ) : null}
      {name === 'bookmark' ? (
        <>
          <Path d="M7 4h10a1 1 0 0 1 1 1v16l-6-4-6 4V5a1 1 0 0 1 1-1Z" {...common} />
          <Path d="M10 8h4" {...common} />
        </>
      ) : null}
      {name === 'book-open' ? (
        <>
          <Path d="M12 6.5A6.5 6.5 0 0 0 5.5 3H4v16h1.5A6.5 6.5 0 0 1 12 22" {...common} />
          <Path d="M12 6.5A6.5 6.5 0 0 1 18.5 3H20v16h-1.5A6.5 6.5 0 0 0 12 22" {...common} />
          <Path d="M12 6.5V22" {...common} />
        </>
      ) : null}
      {name === 'music' ? (
        <>
          <Path d="M9 18V6l10-2v12" {...common} />
          <Circle cx="6.5" cy="18" r="2.5" {...common} />
          <Circle cx="16.5" cy="16" r="2.5" {...common} />
        </>
      ) : null}
      {name === 'church' ? (
        <>
          <Path d="M4 21V10l8-5 8 5v11" {...common} />
          <Path d="M8 21v-7h8v7" {...common} />
          <Path d="M12 3v5" {...common} />
          <Path d="M10 5h4" {...common} />
          <Path d="M3 21h18" {...common} />
        </>
      ) : null}
      {name === 'user' ? (
        <>
          <Circle cx="12" cy="8" r="4" {...common} />
          <Path d="M5 21a7 7 0 0 1 14 0" {...common} />
        </>
      ) : null}
      {name === 'users' ? (
        <>
          <Circle cx="9" cy="8" r="3" {...common} />
          <Path d="M3.5 20a5.5 5.5 0 0 1 11 0" {...common} />
          <Path d="M16 11a3 3 0 1 0-.8-5.9" {...common} />
          <Path d="M17 20a5 5 0 0 0-3-4.5" {...common} />
        </>
      ) : null}
      {name === 'bell' ? (
        <>
          <Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" {...common} />
          <Path d="M10 21a2 2 0 0 0 4 0" {...common} />
        </>
      ) : null}
      {name === 'map-pin' ? (
        <>
          <Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" {...common} />
          <Circle cx="12" cy="10" r="3" {...common} />
        </>
      ) : null}
      {name === 'shield-alert' ? (
        <>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" {...common} />
          <Path d="M12 8v5" {...common} />
          <Path d="M12 17h.01" {...common} />
        </>
      ) : null}
      {name === 'share' ? (
        <>
          <Circle cx="18" cy="5" r="3" {...common} />
          <Circle cx="6" cy="12" r="3" {...common} />
          <Circle cx="18" cy="19" r="3" {...common} />
          <Path d="m8.6 13.5 6.8 4" {...common} />
          <Path d="m15.4 6.5-6.8 4" {...common} />
        </>
      ) : null}
      {name === 'calendar' ? (
        <>
          <Rect x="4" y="5" width="16" height="16" rx="2" {...common} />
          <Path d="M16 3v4" {...common} />
          <Path d="M8 3v4" {...common} />
          <Path d="M4 11h16" {...common} />
        </>
      ) : null}
      {name === 'clock' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M12 7v5l3 2" {...common} />
        </>
      ) : null}
      {name === 'megaphone' ? (
        <>
          <Path d="M3 11v3a2 2 0 0 0 2 2h2l4 4v-6l8-3V6l-8 3H5a2 2 0 0 0-2 2Z" {...common} />
          <Path d="M19 6v5" {...common} />
        </>
      ) : null}
      {name === 'message-circle' ? (
        <>
          <Path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.2A8.5 8.5 0 1 1 21 11.5Z" {...common} />
          <Path d="M8 11h.01" {...common} />
          <Path d="M12 11h.01" {...common} />
          <Path d="M16 11h.01" {...common} />
        </>
      ) : null}
      {name === 'heart' ? (
        <>
          <Path d="M20.8 8.6a5.3 5.3 0 0 0-8.1-3.9L12 5.4l-.7-.7a5.3 5.3 0 0 0-8.1 3.9c0 4.7 8.8 10 8.8 10s8.8-5.3 8.8-10Z" {...common} />
          <Path d="M9 13h6" {...common} />
        </>
      ) : null}
      {name === 'sprout' ? (
        <>
          <Path d="M12 21V11" {...common} />
          <Path d="M12 11C8 11 6 8 6 5c3 0 6 2 6 6Z" {...common} />
          <Path d="M12 13c4 0 6-3 6-6-3 0-6 2-6 6Z" {...common} />
        </>
      ) : null}
      {name === 'wallet' ? (
        <>
          <Rect x="3" y="6" width="18" height="13" rx="2" {...common} />
          <Path d="M17 12h4v4h-4a2 2 0 0 1 0-4Z" {...common} />
          <Path d="M6 6V4h11v2" {...common} />
        </>
      ) : null}
      {name === 'briefcase' ? (
        <>
          <Rect x="3" y="7" width="18" height="13" rx="2" {...common} />
          <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" {...common} />
          <Path d="M3 12h18" {...common} />
        </>
      ) : null}
      {name === 'video' ? (
        <>
          <Rect x="3" y="6" width="13" height="12" rx="2" {...common} />
          <Path d="m16 10 5-3v10l-5-3" {...common} />
        </>
      ) : null}
      {name === 'shopping-cart' ? (
        <>
          <Path d="M6 6h15l-2 8H8L6 3H3" {...common} />
          <Circle cx="9" cy="20" r="1" {...common} />
          <Circle cx="18" cy="20" r="1" {...common} />
        </>
      ) : null}
      {name === 'settings' ? (
        <>
          <Path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" {...common} />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 .9-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5.9h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" {...common} />
        </>
      ) : null}
      {name === 'phone' ? (
        <>
          <Path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6.2 6.2l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7A2 2 0 0 1 22 16.9Z" {...common} />
          <Path d="M15 3a6 6 0 0 1 6 6" {...common} />
          <Path d="M15 7a2 2 0 0 1 2 2" {...common} />
        </>
      ) : null}
      {name === 'star' ? (
        <>
          <Path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" {...common} />
        </>
      ) : null}
      {name === 'log-out' ? (
        <>
          <Path d="M10 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" {...common} />
          <Path d="M15 17l5-5-5-5" {...common} />
          <Path d="M20 12H9" {...common} />
        </>
      ) : null}
      {name === 'building' ? (
        <>
          <Rect x="5" y="3" width="14" height="18" rx="2" {...common} />
          <Path d="M9 7h.01" {...common} />
          <Path d="M15 7h.01" {...common} />
          <Path d="M9 11h.01" {...common} />
          <Path d="M15 11h.01" {...common} />
          <Path d="M10 21v-5h4v5" {...common} />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <Circle cx="11" cy="11" r="7" {...common} />
          <Path d="m16 16 5 5" {...common} />
        </>
      ) : null}
    </Svg>
  );
}
