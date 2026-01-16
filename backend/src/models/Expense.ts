import { IExpense, IExpenseCreate, IExpenseUpdate, IExpenseSummary, IExpenseByCategory } from '../types/expense.js';
import { expenseRepository } from '../repositories/expense.repository.js';

class Expense {
  // Create a new expense
  static async create(userId: string, expenseData: IExpenseCreate): Promise<IExpense> {
    return expenseRepository.create(userId, expenseData);
  }

  // Find expense by ID
  static async findById(id: string, userId: string): Promise<IExpense | null> {
    return expenseRepository.findById(id, userId);
  }

  // Get all expenses for a user with filters
  static async findAllByUser(userId: string, filters: any = {}): Promise<IExpense[]> {
    return expenseRepository.findAllByUser(userId, filters);
  }

  // Update expense
  static async update(id: string, userId: string, updates: IExpenseUpdate): Promise<IExpense | null> {
    return expenseRepository.update(id, userId, updates);
  }

  // Delete expense
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const success = await expenseRepository.delete(id, userId);
    return success ? { id } : null;
  }

  // Get expense statistics
  static async getStatistics(userId: string, filters: any = {}): Promise<IExpenseSummary> {
    return expenseRepository.getStatistics(userId, filters);
  }

  // Get expenses by category
  static async getByCategory(userId: string, filters: any = {}): Promise<IExpenseByCategory[]> {
    return expenseRepository.getByCategory(userId, filters);
  }

  // Get monthly expenses
  static async getMonthlyExpenses(userId: string, months: number = 12): Promise<any[]> {
    return expenseRepository.getMonthlyExpenses(userId, months);
  }

  // Get top vendors
  static async getTopVendors(userId: string, limit: number = 10): Promise<any[]> {
    return expenseRepository.getTopVendors(userId, limit);
  }
}

export default Expense;
