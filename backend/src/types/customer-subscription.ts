export type BillingFrequency = 'monthly' | 'quarterly' | 'yearly';
export type CustomerSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

export interface ICustomerSubscription {
  id: string;
  userId: string;
  clientId: string;
  
  // Client info (joined from clients table)
  clientName?: string;
  clientEmail?: string;
  
  // Plan information
  planName: string;
  planCode: string;
  description?: string | null;
  
  // Pricing
  amount: number;
  currency: string;
  billingFrequency: BillingFrequency;
  
  // Trial
  hasTrial: boolean;
  trialDays?: number | null;
  trialStartDate?: Date | null;
  trialEndDate?: Date | null;
  trialConverted: boolean;
  trialConversionDate?: Date | null;
  
  // Key dates
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate?: Date | null;
  cancellationDate?: Date | null;
  cancellationEffectiveDate?: Date | null;
  
  // Status
  status: CustomerSubscriptionStatus;
  
  // Auto-invoicing
  autoInvoice: boolean;
  autoSendInvoice: boolean;
  invoiceDay: number;
  
  // Upgrades/Downgrades
  previousPlanCode?: string | null;
  planChangedAt?: Date | null;
  planChangeType?: 'upgrade' | 'downgrade' | null;
  
  // Metrics
  totalRevenue: number;
  invoicesCount: number;
  failedPaymentsCount: number;
  lastInvoiceId?: string | null;
  
  // Additional info
  discountPercentage: number;
  discountEndDate?: Date | null;
  paymentMethod?: string | null;
  notes?: string | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerSubscriptionCreate {
  clientId: string;
  planName: string;
  planCode: string;
  description?: string | null;
  amount: number;
  currency?: string;
  billingFrequency: BillingFrequency;
  startDate: Date | string;
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  nextBillingDate?: Date | string | null;
  status?: CustomerSubscriptionStatus;
  hasTrial?: boolean;
  trialDays?: number | null;
  trialStartDate?: Date | string | null;
  trialEndDate?: Date | string | null;
  autoInvoice?: boolean;
  autoSendInvoice?: boolean;
  invoiceDay?: number;
  discountPercentage?: number;
  discountEndDate?: Date | string | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

export interface ICustomerSubscriptionUpdate extends Partial<ICustomerSubscriptionCreate> {}

export interface ICustomerSubscriptionMRR {
  userId: string;
  activeSubscriptions: number;
  mrr: number;
  avgSubscriptionValue: number;
}

export interface ICustomerSubscriptionARR {
  userId: string;
  arr: number;
  totalActiveSubscriptions: number;
}
