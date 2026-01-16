export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'pending';

export interface ISubscription {
  id: string;
  userId: string;
  clientId?: string | null;
  projectId?: string | null;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate?: Date | null;
  nextBillingDate: Date;
  status: SubscriptionStatus;
  autoInvoice: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Joined fields
  clientName?: string;
  projectName?: string;
}

export interface ISubscriptionSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  totalAmount: number;
  monthlyRecurringRevenue: number;
  next30DaysRevenue: number;
}

export interface ISubscriptionStatusBreakdown {
  status: SubscriptionStatus;
  count: number;
  totalAmount: number;
}

export interface IRevenueForecast {
  month: Date;
  forecastAmount: number;
}

export interface ISubscriptionCreate {
  clientId?: string | null;
  projectId?: string | null;
  name: string;
  description?: string | null;
  amount: number;
  currency?: string;
  billingCycle: BillingCycle;
  startDate: Date | string;
  endDate?: Date | string | null;
  nextBillingDate: Date | string;
  status?: SubscriptionStatus;
  autoInvoice?: boolean;
}

export interface ISubscriptionUpdate extends Partial<ISubscriptionCreate> {}
