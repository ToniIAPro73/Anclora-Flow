import { IPayment, IPaymentCreate, IPaymentUpdate } from '../types/payment.js';
import { paymentRepository } from '../repositories/payment.repository.js';

class Payment {
  // Create a new payment
  static async create(userId: string, paymentData: IPaymentCreate): Promise<IPayment> {
    return paymentRepository.create(userId, paymentData);
  }

  // Find payment by ID
  static async findById(id: string, userId: string): Promise<IPayment | null> {
    return paymentRepository.findById(id, userId);
  }

  // Get all payments for an invoice
  static async findByInvoiceId(invoiceId: string, userId: string): Promise<IPayment[]> {
    return paymentRepository.findByInvoiceId(invoiceId, userId);
  }

  // Get all payments for a user with filters
  static async findAllByUser(userId: string, filters: any = {}): Promise<IPayment[]> {
    return paymentRepository.findAllByUser(userId, filters);
  }

  // Update payment (mainly for reconciliation)
  static async update(id: string, userId: string, updates: IPaymentUpdate): Promise<IPayment | null> {
    return paymentRepository.update(id, userId, updates);
  }

  // Delete payment
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const success = await paymentRepository.delete(id, userId);
    return success ? { id } : null;
  }

  // Get total paid amount for an invoice
  static async getTotalPaidByInvoice(invoiceId: string, userId: string): Promise<number> {
    return paymentRepository.getTotalPaidByInvoice(invoiceId, userId);
  }

  // Get payment statistics
  static async getStatistics(userId: string, filters: any = {}): Promise<any> {
    return paymentRepository.getStatistics(userId, filters);
  }
}

export default Payment;
