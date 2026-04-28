export type PlanningCategory = 'essential' | 'nonEssential' | 'savings';

export type PlanningStatus = 'above' | 'within' | 'below';

export interface PlanningExpenses {
  essential: number;
  nonEssential: number;
}

export interface PlanningConfiguration {
  essential: number;
  nonEssential: number;
  savings: number;
}

export interface CalculateFinancialPlanningInput {
  totalIncome: number;
  expenses: PlanningExpenses;
  planning: PlanningConfiguration;
}

export interface FinancialPlanningItem {
  category: PlanningCategory;
  plannedPercentage: number;
  currentPercentage: number;
  differencePercentage: number;
  currentAmount: number;
  plannedAmount: number;
  differenceAmount: number;
  status: PlanningStatus;
}

export interface FinancialPlanningResult {
  income: number;
  items: FinancialPlanningItem[];
}

function calculatePercentage(amount: number, totalIncome: number): number {
  if (totalIncome <= 0) {
    return 0;
  }

  return (amount / totalIncome) * 100;
}

function getStatus(
  currentPercentage: number,
  plannedPercentage: number,
): PlanningStatus {
  if (currentPercentage > plannedPercentage) {
    return 'above';
  }

  if (currentPercentage < plannedPercentage) {
    return 'below';
  }

  return 'within';
}

export function calculateFinancialPlanning(
  input: CalculateFinancialPlanningInput,
): FinancialPlanningResult {
  const { totalIncome, expenses, planning } = input;
  const savingsAmount =
    totalIncome - (expenses.essential + expenses.nonEssential);
  const essentialCurrentPercentage = calculatePercentage(
    expenses.essential,
    totalIncome,
  );
  const nonEssentialCurrentPercentage = calculatePercentage(
    expenses.nonEssential,
    totalIncome,
  );
  const savingsCurrentPercentage = calculatePercentage(savingsAmount, totalIncome);
  const essentialPlannedAmount = (totalIncome * planning.essential) / 100;
  const nonEssentialPlannedAmount = (totalIncome * planning.nonEssential) / 100;
  const savingsPlannedAmount = (totalIncome * planning.savings) / 100;

  const items: FinancialPlanningItem[] = [
    {
      category: 'essential',
      plannedPercentage: planning.essential,
      currentPercentage: essentialCurrentPercentage,
      differencePercentage: essentialCurrentPercentage - planning.essential,
      currentAmount: expenses.essential,
      plannedAmount: essentialPlannedAmount,
      differenceAmount: expenses.essential - essentialPlannedAmount,
      status: getStatus(essentialCurrentPercentage, planning.essential),
    },
    {
      category: 'nonEssential',
      plannedPercentage: planning.nonEssential,
      currentPercentage: nonEssentialCurrentPercentage,
      differencePercentage:
        nonEssentialCurrentPercentage - planning.nonEssential,
      currentAmount: expenses.nonEssential,
      plannedAmount: nonEssentialPlannedAmount,
      differenceAmount: expenses.nonEssential - nonEssentialPlannedAmount,
      status: getStatus(nonEssentialCurrentPercentage, planning.nonEssential),
    },
    {
      category: 'savings',
      plannedPercentage: planning.savings,
      currentPercentage: savingsCurrentPercentage,
      differencePercentage: savingsCurrentPercentage - planning.savings,
      currentAmount: savingsAmount,
      plannedAmount: savingsPlannedAmount,
      differenceAmount: savingsAmount - savingsPlannedAmount,
      status: getStatus(savingsCurrentPercentage, planning.savings),
    },
  ];

  return {
    income: totalIncome,
    items,
  };
}
