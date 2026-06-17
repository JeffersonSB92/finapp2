import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { theme } from '../../theme/theme';

interface AppModalSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  disableScrollWrap?: boolean;
}

export function AppModalSheet({
  children,
  disableScrollWrap = false,
  onClose,
  title,
  visible,
}: AppModalSheetProps): React.JSX.Element {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeAction}>
              <Text style={styles.closeText}>Fechar</Text>
            </Pressable>
          </View>

          {disableScrollWrap ? (
            <View style={styles.content}>{children}</View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.content}>{children}</View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: theme.colors.background.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.soft,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    borderWidth: theme.borders.width.thin,
    maxHeight: '72%',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.bottomSafe,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  closeAction: {
    minHeight: 32,
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  content: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.bottomSafe,
  },
});
