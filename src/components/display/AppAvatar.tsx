import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

export interface AppAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

const avatarSize = {
  sm: 32,
  md: 44,
  lg: 64,
};

const fontSize = {
  sm: 12,
  md: 14,
  lg: 20,
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export function AppAvatar({ src, name, size = 'md', online = false }: AppAvatarProps) {
  const resolvedSize = avatarSize[size];

  return (
    <View style={[styles.avatar, { width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 }]}>
      {src ? (
        <Image source={{ uri: src }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize: fontSize[size] }]}>{initials(name)}</Text>
      )}
      <View style={[styles.status, online && styles.online]} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: colors.primary,
    fontWeight: '800',
  },
  status: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
  },
  online: {
    backgroundColor: colors.success,
  },
});
