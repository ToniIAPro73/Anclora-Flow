export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'cancelled';

export interface IProject {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  budget: number;
  startDate?: Date | null;
  endDate?: Date | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Joined fields
  clientName?: string;
  invoiceCount?: number;
  totalInvoiced?: number;
  expenseCount?: number;
  totalExpenses?: number;
  netProfit?: number;
}

export interface IProjectSummary {
  totalProjects: number;
  activeProjects: number;
  onHoldProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalInvoiced: number;
}

export interface IProjectStatusMetric {
  status: ProjectStatus;
  count: number;
  totalBudget: number;
  totalInvoiced: number;
}

export interface IProjectCreate {
  clientId: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  budget?: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  color?: string | null;
}

export interface IProjectUpdate extends Partial<IProjectCreate> {}
