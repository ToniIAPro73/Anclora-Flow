export interface IClient {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  nifCif?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Joined fields
  projectsCount?: number;
  subscriptionsCount?: number;
  invoiceCount?: number;
  totalInvoiced?: number;
  totalPending?: number;
}

export interface IClientSummary {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newThisMonth: number;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
}

export interface IClientCreate {
  name: string;
  email?: string | null;
  phone?: string | null;
  nifCif?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string;
  notes?: string | null;
  isActive?: boolean;
}

export interface IClientUpdate extends Partial<IClientCreate> {}
