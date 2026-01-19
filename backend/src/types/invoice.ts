export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type VerifactuStatus = 'pending' | 'registered' | 'error';

export interface IInvoiceItem {
  id?: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  vatPercentage: number;
  amount: number;
  createdAt?: Date;
}

export interface IInvoice {
  id: string;
  userId: string;
  clientId?: string | null;
  projectId?: string | null;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  subtotal: number;
  vatPercentage: number;
  vatAmount: number;
  irpfPercentage: number;
  irpfAmount: number;
  total: number;
  currency: string;
  notes?: string | null;
  paymentMethod?: string | null;
  paymentDate?: Date | null;
  paidAmount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Verifactu fields
  verifactuEnabled: boolean;
  verifactuStatus: VerifactuStatus;
  verifactuId?: string | null;
  verifactuCsv?: string | null;
  verifactuQrCode?: string | null;
  verifactuHash?: string | null;
  verifactuChainIndex?: number | null;
  verifactuRegisteredAt?: Date | null;
  verifactuErrorMessage?: string | null;
  verifactuUrl?: string | null;

  // Joined fields
  items?: IInvoiceItem[];
  clientName?: string;
  clientEmail?: string;
  clientNif?: string;
  daysLate?: number;
}

export interface IInvoiceCreate {
  clientId?: string | null;
  projectId?: string | null;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  status?: InvoiceStatus;
  subtotal: number;
  vatPercentage?: number;
  vatAmount: number;
  irpfPercentage?: number;
  irpfAmount: number;
  total: number;
  currency?: string;
  notes?: string | null;
  items?: Partial<IInvoiceItem>[];
}

export interface IInvoiceUpdate extends Partial<IInvoiceCreate> {
  paymentMethod?: string | null;
  paymentDate?: Date | string | null;
}

export interface IPayment {
  id: string;
  userId: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  createdAt: Date;
  createdByInternalId?: string; // For joining with users
  createdByName?: string;
}

export interface IInvoiceAuditLog {
  id: string;
  invoiceId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'payment_received';
  oldValue?: any;
  newValue?: any;
  changeReason?: string | null;
  createdAt: Date;
  userName?: string;
}
