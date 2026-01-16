import { IBudget, IBudgetSummary, IBudgetSuggestion, IBudgetCreate, IBudgetUpdate } from '../types/budget.js';
import { budgetRepository } from '../repositories/budget.repository.js';

class Budget {
  static async findByMonth(userId: string, month?: string | Date): Promise<IBudget[]> {
    return budgetRepository.findByMonth(userId, month);
  }

  static async getSummary(userId: string, month?: string | Date): Promise<IBudgetSummary> {
    return budgetRepository.getSummary(userId, month);
  }

  static async getSuggestions(userId: string, month?: string | Date, monthsLookback: number = 3): Promise<IBudgetSuggestion[]> {
    return budgetRepository.getSuggestions(userId, month, monthsLookback);
  }

  static async createOrUpdate(userId: string, payload: IBudgetCreate): Promise<IBudget> {
    return budgetRepository.createOrUpdate(userId, payload);
  }

  static async update(userId: string, id: string, payload: IBudgetUpdate): Promise<IBudget | null> {
    return budgetRepository.update(id, userId, payload);
  }

  static async delete(userId: string, id: string): Promise<{ id: string } | null> {
    const success = await budgetRepository.delete(id, userId);
    return success ? { id } : null;
  }
}

export default Budget;
