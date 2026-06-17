import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppModalSheet } from './ui';
import { theme } from '../theme/theme';
import { getCurrentMonthDate, shiftMonth } from '../utils/date';

interface MonthSelectorOption {
  label: string;
  value: Date;
}

interface MonthSelectorProps {
  selectedDate: Date;
  onSelectMonth: (date: Date) => void;
}

const ITEM_HEIGHT = 58;
const ITEM_SPACING = 8;
const ITEM_FULL_HEIGHT = ITEM_HEIGHT + ITEM_SPACING;

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function MonthSelector({
  onSelectMonth,
  selectedDate,
}: MonthSelectorProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const listRef = useRef<FlatList<MonthSelectorOption> | null>(null);

  const options = useMemo<MonthSelectorOption[]>(() => {
    const currentMonth = getCurrentMonthDate();
    const items: MonthSelectorOption[] = [];

    for (let offset = -24; offset <= 24; offset += 1) {
      const monthDate = shiftMonth(currentMonth, offset);
      items.push({
        label: formatMonthLabel(monthDate),
        value: monthDate,
      });
    }

    return items;
  }, []);

  const selectedMonthKey = getMonthKey(selectedDate);
  const currentMonthKey = getMonthKey(getCurrentMonthDate());
  const currentMonthIndex = options.findIndex(
    (option) => getMonthKey(option.value) === currentMonthKey,
  );

  function scrollToCurrentMonth(): void {
    if (currentMonthIndex < 0) {
      return;
    }

    listRef.current?.scrollToIndex({
      animated: false,
      index: currentMonthIndex,
      viewPosition: 0,
    });
  }

  useEffect(() => {
    if (!visible || currentMonthIndex < 0) {
      return;
    }

    const timeoutId = setTimeout(scrollToCurrentMonth, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentMonthIndex, visible]);

  function renderOption({
    item: option,
  }: ListRenderItemInfo<MonthSelectorOption>): React.JSX.Element {
    const isSelected = getMonthKey(option.value) === selectedMonthKey;

    return (
      <Pressable
        onPress={() => {
          onSelectMonth(option.value);
          setVisible(false);
        }}
        style={[
          styles.option,
          isSelected ? styles.optionSelected : null,
        ]}
      >
        <Text
          style={[
            styles.optionText,
            isSelected ? styles.optionTextSelected : null,
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View>
      <Pressable onPress={() => setVisible(true)} style={styles.trigger}>
        <Text numberOfLines={1} style={styles.triggerText}>
          {formatMonthLabel(selectedDate)}
        </Text>
        <Feather
          color={theme.colors.text.muted}
          name="chevron-down"
          size={18}
          style={styles.triggerIcon}
        />
      </Pressable>

      <AppModalSheet
        disableScrollWrap
        onClose={() => setVisible(false)}
        title="Selecionar mês"
        visible={visible}
      >
        <FlatList
          data={options}
          contentContainerStyle={styles.listContent}
          getItemLayout={(_, index) => ({
            index,
            length: ITEM_FULL_HEIGHT,
            offset: ITEM_FULL_HEIGHT * index,
          })}
          keyExtractor={(item) => getMonthKey(item.value)}
          onLayout={scrollToCurrentMonth}
          onContentSizeChange={() => {
            scrollToCurrentMonth();
          }}
          onScrollToIndexFailed={() => {
            setTimeout(scrollToCurrentMonth, 50);
          }}
          ref={listRef}
          renderItem={renderOption}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </AppModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    maxWidth: '100%',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  triggerText: {
    color: theme.colors.text.secondary,
    flexShrink: 1,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'capitalize',
  },
  triggerIcon: {
    flexShrink: 0,
  },
  option: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  separator: {
    height: theme.spacing.sm,
  },
  optionSelected: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  optionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: theme.colors.brand.primary,
  },
});
