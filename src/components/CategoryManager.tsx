import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { TransactionType } from '../database';
import { useCategoryManager } from '../hooks/useCategoryManager';
import { theme } from '../theme/theme';
import { AppButton, AppCard, EmptyState, IconBadge } from './ui';

interface CategoryManagerProps {
  onAddCategory?: () => void;
  onEditCategory?: (categoryId: number) => void;
  onAddSubcategory?: (categoryId: number) => void;
  onEditSubcategory?: (subcategoryId: number) => void;
}

function getTypeAccent(type: TransactionType): string {
  if (type === TransactionType.INCOME) {
    return theme.colors.status.success;
  }

  if (type === TransactionType.EXPENSE) {
    return theme.colors.brand.primary;
  }

  return theme.colors.text.secondary;
}

export function CategoryManager({
  onAddCategory,
  onEditCategory,
  onAddSubcategory,
  onEditSubcategory,
}: CategoryManagerProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const { categories, error, isLoading, toggleCategory } = useCategoryManager();
  const isCompactLayout = width < 420;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Categorias</Text>
            <Text style={styles.title}>Categorias e subcategorias</Text>
            <Text style={styles.subtitle}>
              Organize seus lançamentos com uma estrutura clara, compacta e fácil de expandir.
            </Text>
          </View>

          <AppButton
            label="+ Nova categoria"
            onPress={onAddCategory}
            size="sm"
            style={styles.primaryButton}
          />
        </View>

        {isLoading ? (
          <AppCard style={styles.feedbackCard}>
            <ActivityIndicator color={theme.colors.brand.primary} />
            <Text style={styles.feedbackText}>Carregando categorias...</Text>
          </AppCard>
        ) : null}

        {error && !isLoading ? (
          <AppCard style={styles.feedbackCard}>
            <Text style={styles.errorText}>{error}</Text>
          </AppCard>
        ) : null}

        {!isLoading && !error ? (
          <View style={styles.list}>
            {categories.length === 0 ? (
              <EmptyState
                actionLabel="Nova categoria"
                description="Crie categorias para organizar receitas, despesas e os agrupamentos do seu planejamento."
                eyebrow="Sem categorias"
                icon="grid"
                onActionPress={onAddCategory}
                style={styles.emptyCard}
                title="Nenhuma categoria cadastrada"
              />
            ) : (
              categories.map((category) => (
                <AppCard key={category.id} style={styles.categoryCard}>
                  <Pressable
                    onPress={() => toggleCategory(category.id)}
                    style={[styles.categoryHeader, isCompactLayout ? styles.categoryHeaderCompact : null]}
                  >
                    <View style={styles.categoryLeading}>
                      <IconBadge
                        backgroundColor={category.color}
                        fallbackLabel={category.iconLabel}
                        iconName={category.icon}
                      />

                      <View style={styles.categoryInfo}>
                        <Text numberOfLines={1} style={styles.categoryName}>
                          {category.name}
                        </Text>
                        <Text
                          style={[
                            styles.categoryType,
                            { color: getTypeAccent(category.type) },
                          ]}
                        >
                          {category.typeLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryActions}>
                      <AppButton
                        label="Editar"
                        onPress={() => onEditCategory?.(category.id)}
                        size="sm"
                        variant="secondary"
                      />

                      <View style={styles.expandBadge}>
                        <Text style={styles.expandIcon}>
                          {category.isExpanded ? '-' : '+'}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {category.isExpanded ? (
                    <View style={styles.subcategoryArea}>
                      <View
                        style={[
                          styles.subcategoryHeader,
                          isCompactLayout ? styles.subcategoryHeaderCompact : null,
                        ]}
                      >
                        <Text style={styles.subcategoryTitle}>Subcategorias</Text>
                        <AppButton
                          label="+ Adicionar"
                          onPress={() => onAddSubcategory?.(category.id)}
                          size="sm"
                          variant="ghost"
                        />
                      </View>

                      {category.subcategories.length === 0 ? (
                        <Text style={styles.emptySubcategoryText}>
                          Nenhuma subcategoria cadastrada.
                        </Text>
                      ) : (
                        category.subcategories.map((subcategory) => (
                          <Pressable
                            key={subcategory.id}
                            onPress={() => onEditSubcategory?.(subcategory.id)}
                            style={styles.subcategoryItem}
                          >
                            <View style={styles.subcategoryLeft}>
                              {subcategory.icon ? (
                                <IconBadge
                                  backgroundColor={subcategory.color}
                                  fallbackLabel={subcategory.name.slice(0, 2).toUpperCase()}
                                  iconName={subcategory.icon}
                                  size={28}
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.subcategoryDot,
                                    subcategory.color
                                      ? { backgroundColor: subcategory.color }
                                      : null,
                                  ]}
                                />
                              )}
                              <Text numberOfLines={1} style={styles.subcategoryName}>
                                {subcategory.name}
                              </Text>
                            </View>

                            <Text style={styles.subcategoryEditLabel}>Editar</Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  ) : null}
                </AppCard>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.bottomSafe + theme.spacing['3xl'],
  },
  header: {
    gap: theme.spacing.md,
  },
  headerText: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  primaryButton: {
    alignSelf: 'flex-start',
  },
  feedbackCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  feedbackText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  errorText: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  emptyCard: {
    minHeight: 0,
  },
  categoryCard: {
    gap: theme.spacing.md,
    overflow: 'hidden',
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  categoryHeaderCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  categoryLeading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minWidth: 0,
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  categoryName: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  categoryType: {
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  categoryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  expandBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  expandIcon: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  subcategoryArea: {
    borderTopColor: theme.colors.border.soft,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  subcategoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subcategoryHeaderCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  subcategoryTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  emptySubcategoryText: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  subcategoryItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  subcategoryLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  subcategoryDot: {
    backgroundColor: theme.colors.gray[600],
    borderRadius: theme.radii.pill,
    height: 10,
    width: 10,
  },
  subcategoryName: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  subcategoryEditLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    marginLeft: theme.spacing.sm,
    textTransform: 'uppercase',
  },
});
