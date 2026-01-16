export interface IVerifactuConfig {
  userId: number;
  enabled: boolean;
  autoRegister: boolean;
  certificatePath?: string | null;
  certificatePassword?: string | null;
  softwareNif: string;
  softwareName: string;
  softwareVersion: string;
  softwareLicense?: string | null;
  testMode: boolean;
  lastChainIndex: number;
  lastChainHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVerifactuLog {
  id: number;
  invoiceId: string;
  userId: number;
  action: string;
  status: 'success' | 'error';
  requestData?: any;
  responseData?: any;
  errorMessage?: string | null;
  createdAt: Date;

  // Joined fields
  invoiceNumber?: string;
}

export interface IVerifactuResponse {
  success: boolean;
  status: 'registered' | 'error' | 'cancelled';
  verifactuId: string;
  csv: string;
  qrCode: string;
  url: string;
  hash: string;
  chainIndex: number;
  timestamp: string;
}

export interface IVerifactuChainVerification {
  valid: boolean;
  totalInvoices: number;
  details: IVerifactuChainDetail[];
}

export interface IVerifactuChainDetail {
  invoiceNumber: string;
  chainIndex: number;
  hash: string;
  previousHash: string;
  expectedPreviousHash: string;
  valid: boolean;
}
