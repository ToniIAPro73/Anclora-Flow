export interface IBudget {
  id: string;
  userId: string;
  category: string;
  month: Date;
  plannedAmount: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Virtual/Joined fields
  actualSpent?: number;
  relatedRevenue?: number;
  remainingAmount?: number;
  spendingRatio?: number;
}

export interface IBudgetSummary {
  plannedTotal: number;
  actualTotal: number;
  remainingTotal: number;
  onTrackCategories: number;
  trackedCategories: number;
}

export interface IBudgetSuggestion {
  category: string;
  avgMonthlySpend: number;
  peakSpend: number;
  plannedAmount: number;
  suggestedDelta: number;
  recommendation: 'estable' | 'nuevo' | 'incrementar' | 'optimizar';
}

export interface IBudgetCreate {
  category: string;
  month: string | Date;
  plannedAmount: number;
  notes?: string | null;
}

export interface IBudgetUpdate extends Partial<IBudgetCreate> {}
