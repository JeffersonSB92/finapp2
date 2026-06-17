import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme/theme';

export interface FloatingActionOption<Route extends string> {
  label: string;
  route: Route;
  icon: React.ComponentProps<typeof Feather>['name'];
}

interface FloatingActionMenuProps<Route extends string> {
  currentRoute: string;
  isOpen: boolean;
  onPrimaryPress: () => void;
  onSelectRoute: (route: Route) => void;
  options: FloatingActionOption<Route>[];
}

export function FloatingActionMenu<Route extends string>({
  currentRoute,
  isOpen,
  onPrimaryPress,
  onSelectRoute,
  options,
}: FloatingActionMenuProps<Route>): React.JSX.Element {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      {isOpen ? (
        <View style={styles.menu}>
          {options.map((option) => {
            const isActive = currentRoute === option.route;

            return (
              <Pressable
                key={option.route}
                onPress={() => onSelectRoute(option.route)}
                style={[styles.option, isActive ? styles.optionActive : null]}
              >
                <Feather
                  color={isActive ? theme.colors.brand.primary : theme.colors.text.secondary}
                  name={option.icon}
                  size={16}
                />
                <Text style={[styles.optionText, isActive ? styles.optionTextActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Pressable onPress={onPrimaryPress} style={styles.primary}>
        <Feather color={theme.colors.brand.white} name={isOpen ? 'x' : 'plus'} size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    bottom: theme.spacing.bottomSafe + theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  menu: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  option: {
    ...theme.shadows.floating,
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
  },
  optionActive: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  optionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  optionTextActive: {
    color: theme.colors.brand.primary,
  },
  primary: {
    ...theme.shadows.floating,
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primaryPressed,
    borderRadius: theme.radii.pill,
    borderWidth: theme.borders.width.thin,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
});
