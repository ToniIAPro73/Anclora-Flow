import { IReceipt, IReceiptCreate, IReceiptUpdate } from '../types/receipt.js';
import { receiptRepository } from '../repositories/receipt.repository.js';

class Receipt {
  // Create a new receipt (without file upload - that's handled by the route)
  static async create(userId: string, receiptData: IReceiptCreate, fileMetadata: any): Promise<IReceipt> {
    return receiptRepository.create(userId, receiptData, fileMetadata);
  }

  // Find receipt by ID
  static async findById(id: string, userId: string): Promise<IReceipt | null> {
    return receiptRepository.findById(id, userId);
  }

  // Get all receipts for an entity (invoice, expense, payment, etc.)
  static async findByEntity(entityType: string, entityId: string, userId: string): Promise<IReceipt[]> {
    return receiptRepository.findByEntity(entityType, entityId, userId);
  }

  // Get all receipts for a user
  static async findAllByUser(userId: string, filters: any = {}): Promise<IReceipt[]> {
    return receiptRepository.findAllByUser(userId, filters);
  }

  // Update receipt (mainly for OCR data)
  static async update(id: string, userId: string, updates: IReceiptUpdate): Promise<IReceipt | null> {
    return receiptRepository.update(id, userId, updates);
  }

  // Delete receipt (returns file info for cleanup)
  static async delete(id: string, userId: string): Promise<{ id: string; fileUrl: string; thumbnailUrl?: string } | null> {
    return receiptRepository.deleteWithFileInfo(id, userId);
  }

  // Get receipts pending OCR processing
  static async findPendingOCR(userId: string): Promise<IReceipt[]> {
    return receiptRepository.findPendingOCR(userId);
  }

  // Update OCR extraction status
  static async updateExtractionStatus(
    id: string, 
    userId: string, 
    status: string, 
    extractedData: any = null
  ): Promise<IReceipt | null> {
    return receiptRepository.updateExtractionStatus(id, userId, status, extractedData);
  }
}

export default Receipt;
