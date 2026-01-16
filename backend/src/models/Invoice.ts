import { IInvoice, IInvoiceCreate, IInvoiceUpdate } from '../types/invoice.js';
import { invoiceRepository } from '../repositories/invoice.repository.js';

class Invoice {
  // Create a new invoice with line items
  static async create(userId: string, invoiceData: IInvoiceCreate): Promise<IInvoice> {
    return invoiceRepository.create(userId, invoiceData);
  }

  // Find invoice by ID with items
  static async findById(id: string, userId: string): Promise<IInvoice | null> {
    return invoiceRepository.findById(id, userId);
  }

  // Get all invoices for a user with filters
  static async findAllByUser(userId: string, filters: any = {}): Promise<IInvoice[]> {
    return invoiceRepository.findAllByUser(userId, filters);
  }

  // Update invoice
  static async update(id: string, userId: string, updates: IInvoiceUpdate): Promise<IInvoice | null> {
    return invoiceRepository.update(id, userId, updates);
  }

  // Delete invoice
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const success = await invoiceRepository.delete(id, userId);
    return success ? { id } : null;
  }

  // Mark invoice as paid
  static async markAsPaid(id: string, userId: string, paymentData: any = {}): Promise<IInvoice> {
    return invoiceRepository.markAsPaid(id, userId, paymentData);
  }

  // Get invoice statistics
  static async getStatistics(userId: string, filters: any = {}): Promise<any> {
    return invoiceRepository.getStatistics(userId, filters);
  }

  // Get monthly income data
  static async getMonthlyIncome(userId: string, months: number = 12): Promise<any[]> {
    return invoiceRepository.getMonthlyIncome(userId, months);
  }

  // Check for overdue invoices and update status
  static async updateOverdueStatus(userId: string): Promise<any[]> {
    return invoiceRepository.updateOverdueStatus(userId);
  }

  // Get invoice with Verifactu data
  static async findByIdWithVerifactu(id: string, userId: string): Promise<IInvoice | null> {
    return invoiceRepository.findByIdWithVerifactu(id, userId);
  }

  // Get Verifactu status
  static async getVerifactuStatus(id: string, userId: string): Promise<any> {
    return invoiceRepository.getVerifactuStatus(id, userId);
  }

  // Update Verifactu status
  static async updateVerifactuStatus(id: string, userId: string, status: string, errorMessage: string | null = null): Promise<IInvoice | null> {
    return invoiceRepository.updateVerifactuStatus(id, userId, status, errorMessage);
  }

  // Get invoices pending Verifactu registration
  static async findPendingVerifactu(userId: string): Promise<IInvoice[]> {
    return invoiceRepository.findPendingVerifactu(userId);
  }

  // Get invoices registered in Verifactu
  static async findRegisteredVerifactu(userId: string, limit: number = 100): Promise<any[]> {
    return invoiceRepository.findRegisteredVerifactu(userId, limit);
  }

  // Get Verifactu statistics
  static async getVerifactuStatistics(userId: string): Promise<any> {
    return invoiceRepository.getVerifactuStatistics(userId);
  }
}

export default Invoice;
