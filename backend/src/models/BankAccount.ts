import { IBankAccount, IBankAccountCreate, IBankAccountUpdate } from '../types/bank-account.js';
import { bankAccountRepository } from '../repositories/bank-account.repository.js';

class BankAccount {
  // Create a new bank account
  static async create(userId: string, accountData: IBankAccountCreate): Promise<IBankAccount> {
    return bankAccountRepository.create(userId, accountData);
  }

  // Find bank account by ID
  static async findById(id: string, userId: string): Promise<IBankAccount | null> {
    return bankAccountRepository.findById(id, userId);
  }

  // Get all bank accounts for a user
  static async findAllByUser(userId: string, activeOnly: boolean = false): Promise<IBankAccount[]> {
    return bankAccountRepository.findAllByUser(userId, activeOnly);
  }

  // Get default bank account
  static async findDefault(userId: string): Promise<IBankAccount | null> {
    return bankAccountRepository.findDefault(userId);
  }

  // Update bank account
  static async update(id: string, userId: string, updates: IBankAccountUpdate): Promise<IBankAccount | null> {
    return bankAccountRepository.update(id, userId, updates);
  }

  // Set as default (unsets other defaults)
  static async setAsDefault(id: string, userId: string): Promise<IBankAccount | null> {
    return bankAccountRepository.setAsDefault(id, userId);
  }

  // Deactivate account
  static async deactivate(id: string, userId: string): Promise<IBankAccount | null> {
    return bankAccountRepository.update(id, userId, { isActive: false });
  }

  // Delete bank account
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const success = await bankAccountRepository.delete(id, userId);
    return success ? { id } : null;
  }
}

export default BankAccount;
