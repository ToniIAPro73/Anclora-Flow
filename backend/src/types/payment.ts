export type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'cheque' | 'paypal' | 'stripe' | 'other';
export type PaymentStatus = 'registered' | 'reconciled' | 'rejected';

export interface IPayment {
  id: string;
  userId: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  bankAccountId?: string | null;
  status: PaymentStatus;
  reconciliationDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Joined fields
  invoiceNumber?: string;
  clientName?: string;
  bankName?: string;
  bankIban?: string;
}

export interface IPaymentCreate {
  invoiceId: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  bankAccountId?: string | null;
  notes?: string | null;
}

export interface IPaymentUpdate {
  status?: PaymentStatus;
  reconciliationDate?: Date | string | null;
  notes?: string | null;
}
