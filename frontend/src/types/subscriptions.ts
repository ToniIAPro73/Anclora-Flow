// ==========================================
// Enums & Types Compartidos
// ==========================================
export type BillingFrequency = "monthly" | "quarterly" | "yearly";
export type ExpenseStatus =
  | "trial"
  | "active"
  | "paused"
  | "cancelled"
  | "expired";
export type RevenueStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

// ==========================================
// Módulo: Mis Gastos (Expenses)
// ==========================================
export interface Subscription {
  id: string;
  user_id: string;
  client_id?: string | null;
  project_id?: string | null;
  service_name: string;
  provider: string;
  description?: string | null;
  category?: string | null;
  amount: number; // string en JSON si viene de DECIMAL, pero tratamos como number en UI
  currency: string;
  billing_frequency: BillingFrequency;

  // Trial
  has_trial: boolean;
  trial_days?: number | null;
  trial_start_date?: string | null; // ISO Date
  trial_end_date?: string | null; // ISO Date

  // Fechas
  start_date: string;
  next_billing_date?: string | null;

  status: ExpenseStatus;
  auto_renew: boolean;
  cancellation_url?: string | null;
  login_url?: string | null;
  notes?: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionDTO {
  serviceName: string;
  provider: string;
  amount: number;
  billingFrequency: BillingFrequency;
  startDate: string; // ISO

  // Opcionales
  currency?: string;
  clientId?: string;
  description?: string;
  category?: string;
  hasTrial?: boolean;
  trialDays?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  trialRequiresCard?: boolean;
  nextBillingDate?: string;
  status?: ExpenseStatus;
  autoRenew?: boolean;
  cancellationUrl?: string;
  loginUrl?: string;
}

// ==========================================
// Módulo: Mis Ingresos (Revenue)
// ==========================================
export interface CustomerSubscription {
  id: string;
  user_id: string;
  client_id: string;
  client_name?: string; // Viene del JOIN

  plan_name: string;
  plan_code: string;
  description?: string | null;
  amount: number;
  currency: string;
  billing_frequency: BillingFrequency;

  // Trial
  has_trial: boolean;
  trial_days?: number | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  trial_converted: boolean;

  // Fechas
  start_date: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_date?: string | null;

  status: RevenueStatus;
  auto_invoice: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateCustomerSubscriptionDTO {
  clientId: string;
  planName: string;
  planCode: string;
  amount: number;
  billingFrequency: BillingFrequency;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;

  hasTrial?: boolean;
  trialDays?: number;
  trialStartDate?: string;
  trialEndDate?: string;

  autoInvoice?: boolean;
  invoiceDay?: number;
  discountPercentage?: number;
}

// ==========================================
// KPIs / Summary
// ==========================================
export interface MrrBreakdown {
  plan_name: string;
  active_subscriptions: string; // COUNT devuelve string en pg
  mrr: number;
  avg_subscription_value: number;
}

export interface SubscriptionsSummary {
  mrrBreakdown: MrrBreakdown[];
  totalArr: number;
  activeSubscriptions: number; // o string
  expiringTrialsCount: number;
}
