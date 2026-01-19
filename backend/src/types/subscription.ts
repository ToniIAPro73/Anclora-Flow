export type BillingFrequency = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial' | 'expired';

export interface ISubscription {
  id: string;
  userId: string;
  serviceName: string;
  provider: string;
  description?: string | null;
  amount: number;
  currency: string;
  billingFrequency: BillingFrequency;
  nextBillingDate?: Date | null;
  startDate?: Date;
  status: SubscriptionStatus;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  serviceName: string;
  provider: string;
  description?: string | null;
  amount: number;
  currency?: string;
  billingFrequency: BillingFrequency;
  nextBillingDate?: Date | string | null;
  status?: SubscriptionStatus;
  category?: string | null;
}

export interface ISubscriptionUpdate extends Partial<ISubscriptionCreate> {}
