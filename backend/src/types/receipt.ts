export type ReceiptType = 'invoice' | 'ticket' | 'receipt' | 'albaran' | 'bank_statement' | 'other';
export type EntityType = 'expense' | 'payment' | 'invoice' | 'subscription';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IExtractedData {
  totalAmount?: number | null;
  taxAmount?: number | null;
  vendorName?: string | null;
  documentNumber?: string | null;
  documentDate?: string | null;
  items?: any[];
  confidence?: number | null;
  text?: string;
  processingTime?: number;
  method?: string;
}

export interface IReceipt {
  id: string;
  userId: string;
  receiptType: ReceiptType;
  entityType: EntityType;
  entityId: string;
  
  // File metadata
  fileName: string;
  fileSize: number; // bytes
  fileType?: string | null; // pdf, jpg, png, docx, xlsx
  fileUrl: string;
  thumbnailUrl?: string | null;
  
  // Document metadata
  documentDate?: Date | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  documentTotal?: number | null;
  currency: string;
  
  // OCR/Classification
  isVerified: boolean;
  extractionStatus: ExtractionStatus;
  extractedData?: IExtractedData | null;
  
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceiptCreate {
  receiptType: ReceiptType;
  entityType: EntityType;
  entityId: string;
  documentDate?: Date | string | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
}

export interface IReceiptUpdate {
  isVerified?: boolean;
  extractionStatus?: ExtractionStatus;
  extractedData?: IExtractedData | null;
  documentDate?: Date | string | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  documentTotal?: number | null;
  notes?: string | null;
}
