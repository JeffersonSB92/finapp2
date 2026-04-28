import { useEffect, useMemo, useState } from 'react';

import { Category, Subcategory, TransactionType } from '../database';
import { useFinanceStore } from '../store';

export interface CategoryManagerSubcategoryItem {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

export interface CategoryManagerCategoryItem {
  id: number;
  name: string;
  type: TransactionType;
  typeLabel: string;
  color: string | null;
  icon: string | null;
  iconLabel: string;
  subcategories: CategoryManagerSubcategoryItem[];
  isExpanded: boolean;
}

export interface UseCategoryManagerResult {
  categories: CategoryManagerCategoryItem[];
  isLoading: boolean;
  error: string | null;
  expandedIds: number[];
  toggleCategory: (categoryId: number) => void;
}

function getTypeLabel(type: TransactionType): string {
  if (type === TransactionType.INCOME) {
    return 'Receita';
  }

  if (type === TransactionType.EXPENSE) {
    return 'Despesa';
  }

  return 'Transferencia';
}

function getIconLabel(category: Category): string {
  if (category.icon?.trim()) {
    return category.icon.trim().slice(0, 2).toUpperCase();
  }

  if (category.type === TransactionType.INCOME) {
    return 'IN';
  }

  if (category.type === TransactionType.EXPENSE) {
    return 'EX';
  }

  return 'TR';
}

function mapSubcategories(
  categoryId: number,
  subcategories: Subcategory[],
): CategoryManagerSubcategoryItem[] {
  return subcategories
    .filter((subcategory) => subcategory.category_id === categoryId)
    .map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      color: subcategory.color,
      icon: subcategory.icon,
    }));
}

export function useCategoryManager(): UseCategoryManagerResult {
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const initialize = useFinanceStore((state) => state.initialize);
  const categories = useFinanceStore((state) => state.categories);
  const subcategories = useFinanceStore((state) => state.subcategories);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const mappedCategories = useMemo<CategoryManagerCategoryItem[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
        typeLabel: getTypeLabel(category.type),
        color: category.color,
        icon: category.icon,
        iconLabel: getIconLabel(category),
        subcategories: mapSubcategories(category.id, subcategories),
        isExpanded: expandedIds.includes(category.id),
      })),
    [categories, expandedIds, subcategories],
  );

  function toggleCategory(categoryId: number): void {
    setExpandedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  return {
    categories: mappedCategories,
    isLoading,
    error,
    expandedIds,
    toggleCategory,
  };
}

