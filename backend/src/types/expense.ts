export interface IExpense {
  id: string;
  userId: string;
  projectId?: string | null;
  category: string;
  subcategory?: string | null;
  description: string;
  amount: number;
  vatAmount: number;
  vatPercentage: number;
  isDeductible: boolean;
  deductiblePercentage: number;
  expenseDate: Date;
  paymentMethod?: string | null;
  vendor?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Joined fields
  projectName?: string;
}

export interface IExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  totalVat: number;
  deductibleAmount: number;
  averageExpense: number;
}

export interface IExpenseByCategory {
  category: string;
  expenseCount: number;
  totalAmount: number;
  averageAmount: number;
}

export interface IExpenseCreate {
  projectId?: string | null;
  category: string;
  subcategory?: string | null;
  description: string;
  amount: number;
  vatAmount?: number;
  vatPercentage?: number;
  isDeductible?: boolean;
  deductiblePercentage?: number;
  expenseDate: Date | string;
  paymentMethod?: string | null;
  vendor?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
}

export interface IExpenseUpdate extends Partial<IExpenseCreate> {
  changeReason?: string | null;
}
