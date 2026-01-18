export interface IBankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  bic?: string | null;
  accountType: string; // 'business' | 'personal'
  currency: string;
  isDefault: boolean;
  isActive: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBankAccountCreate {
  bankName: string;
  accountHolder: string;
  iban: string;
  bic?: string | null;
  accountType?: string;
  currency?: string;
  isDefault?: boolean;
  notes?: string | null;
}

export interface IBankAccountUpdate extends Partial<IBankAccountCreate> {
  isActive?: boolean;
}
