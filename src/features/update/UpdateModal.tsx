import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';
import baptistOneIcon from '../../assets/icons/1024.png';

type UpdateModalProps = {
  visible: boolean;
  nativeVersion: string;
  webVersion: string;
  storeUrl?: string;
  onDismiss: () => void;
};

export function UpdateModal({
  visible,
  nativeVersion,
  webVersion,
  storeUrl,
  onDismiss,
}: UpdateModalProps) {
  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl).catch(() => {
        onDismiss();
      });
    } else {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Image source={baptistOneIcon} style={styles.logoIcon} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.message}>
            A new version of the app is available with performance improvements, bug fixes, and new features.

            Update now to enjoy the best experience.
          </Text>

          <Text style={styles.versionInfo}>
            Current version: v{nativeVersion}
          </Text>
          <Text style={[styles.versionInfo, styles.newVersionInfo]}>
            New version: v{webVersion}
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.updateButton,
                pressed && styles.updateButtonPressed,
              ]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.dismissButton,
                pressed && styles.dismissButtonPressed,
              ]}
              onPress={onDismiss}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoIcon: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  versionInfo: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  newVersionInfo: {
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%' as const,
    gap: 10,
  },
  updateButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  updateButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  updateButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonPressed: {
    opacity: 0.6,
  },
  dismissButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});