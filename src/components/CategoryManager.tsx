import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TransactionType } from '../database';
import { useCategoryManager } from '../hooks/useCategoryManager';
import { theme } from '../theme/theme';

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
  const { categories, error, isLoading, toggleCategory } = useCategoryManager();

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
              Organize seus lancamentos com uma estrutura clara e expansivel.
            </Text>
          </View>

          <Pressable onPress={onAddCategory} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>+ Nova categoria</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.feedbackCard}>
            <ActivityIndicator color={theme.colors.brand.primary} />
            <Text style={styles.feedbackText}>Carregando categorias...</Text>
          </View>
        ) : null}

        {error && !isLoading ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <View style={styles.list}>
            {categories.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhuma categoria cadastrada</Text>
                <Text style={styles.emptyText}>
                  Crie categorias para organizar receitas, despesas e seus agrupamentos.
                </Text>
              </View>
            ) : (
              categories.map((category) => (
                <View key={category.id} style={styles.categoryCard}>
                  <Pressable
                    onPress={() => toggleCategory(category.id)}
                    style={styles.categoryHeader}
                  >
                    <View style={styles.categoryLeading}>
                      <View
                        style={[
                          styles.iconBadge,
                          category.color ? { backgroundColor: category.color } : null,
                        ]}
                      >
                        <Text style={styles.iconBadgeText}>{category.iconLabel}</Text>
                      </View>

                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>
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
                      <Pressable
                        onPress={() => onEditCategory?.(category.id)}
                        style={styles.secondaryButton}
                      >
                        <Text style={styles.secondaryButtonText}>Editar</Text>
                      </Pressable>

                      <Text style={styles.expandIcon}>
                        {category.isExpanded ? '-' : '+'}
                      </Text>
                    </View>
                  </Pressable>

                  {category.isExpanded ? (
                    <View style={styles.subcategoryArea}>
                      <View style={styles.subcategoryHeader}>
                        <Text style={styles.subcategoryTitle}>Subcategorias</Text>
                        <Pressable
                          onPress={() => onAddSubcategory?.(category.id)}
                          style={styles.inlineAction}
                        >
                          <Text style={styles.inlineActionText}>+ Adicionar</Text>
                        </Pressable>
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
                              <View
                                style={[
                                  styles.subcategoryDot,
                                  subcategory.color
                                    ? { backgroundColor: subcategory.color }
                                    : null,
                                ]}
                              />
                              <Text style={styles.subcategoryName}>
                                {subcategory.name}
                              </Text>
                            </View>

                            <Text style={styles.subcategoryEditLabel}>Editar</Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  ) : null}
                </View>
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
    paddingBottom: theme.spacing['3xl'],
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
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  primaryButton: {
    ...theme.shadows.card,
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
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
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  categoryCard: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 84,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  categoryLeading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.radii.lg,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  iconBadgeText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
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
  secondaryButton: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  expandIcon: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
    width: 20,
    textAlign: 'center',
  },
  subcategoryArea: {
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  subcategoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subcategoryTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  inlineAction: {
    paddingVertical: 4,
  },
  inlineActionText: {
    color: theme.colors.brand.primary,
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
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  subcategoryLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  subcategoryDot: {
    backgroundColor: theme.colors.gray[600],
    borderRadius: theme.radii.pill,
    height: 10,
    width: 10,
  },
  subcategoryName: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  subcategoryEditLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
});

