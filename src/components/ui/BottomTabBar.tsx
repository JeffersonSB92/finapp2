import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme/theme';

export interface BottomTabItem<Route extends string> {
  label: string;
  route: Route;
  icon: React.ComponentProps<typeof Feather>['name'];
}

interface BottomTabBarProps<Route extends string> {
  items: BottomTabItem<Route>[];
  activeRoute: Route | string;
  onSelect: (route: Route) => void;
}

export function BottomTabBar<Route extends string>({
  activeRoute,
  items,
  onSelect,
}: BottomTabBarProps<Route>): React.JSX.Element {
  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        {items.map((item) => {
          const isActive = activeRoute === item.route;

          return (
            <Pressable
              key={item.route}
              onPress={() => onSelect(item.route)}
              style={[styles.item, isActive ? styles.itemActive : null]}
            >
              <Feather
                color={isActive ? theme.colors.brand.primary : theme.colors.text.muted}
                name={item.icon}
                size={16}
              />
              <Text style={[styles.label, isActive ? styles.labelActive : null]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  bar: {
    ...theme.shadows.cardSoft,
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  item: {
    alignItems: 'center',
    borderRadius: theme.radii.lg,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 2,
  },
  itemActive: {
    backgroundColor: theme.colors.brand.primarySoft,
  },
  label: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: 11,
    lineHeight: theme.fonts.lineHeight.xs,
    textAlign: 'center',
  },
  labelActive: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
  },
});
