import {
  ISubscription,
  ISubscriptionCreate,
  ISubscriptionUpdate,
  ISubscriptionSummary,
  ISubscriptionStatusBreakdown,
  IRevenueForecast
} from '../types/subscription.js';
import { subscriptionRepository } from '../repositories/subscription.repository.js';

class Subscription {
  static async create(userId: string, payload: ISubscriptionCreate): Promise<ISubscription> {
    return subscriptionRepository.create(userId, payload);
  }

  static async findById(id: string, userId: string): Promise<ISubscription | null> {
    return subscriptionRepository.findById(id, userId);
  }

  static async findAllByUser(userId: string, filters: any = {}): Promise<ISubscription[]> {
    return subscriptionRepository.findAllByUser(userId, filters);
  }

  static async update(id: string, userId: string, updates: ISubscriptionUpdate): Promise<ISubscription | null> {
    return subscriptionRepository.update(id, userId, updates);
  }

  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const success = await subscriptionRepository.delete(id, userId);
    return success ? { id } : null;
  }

  static async getSummary(userId: string): Promise<ISubscriptionSummary | null> {
    return subscriptionRepository.getSummary(userId);
  }

  static async getStatusBreakdown(userId: string): Promise<ISubscriptionStatusBreakdown[]> {
    return subscriptionRepository.getStatusBreakdown(userId);
  }

  static async getRevenueForecast(userId: string, months: number = 6): Promise<IRevenueForecast[]> {
    return subscriptionRepository.getRevenueForecast(userId, months);
  }

  static async getUpcoming(userId: string, limit: number = 8): Promise<any[]> {
    return subscriptionRepository.getUpcoming(userId, limit);
  }

  static async getForProject(userId: string, projectId: string): Promise<any[]> {
    return subscriptionRepository.getForProject(userId, projectId);
  }

  static async getForClient(userId: string, clientId: string): Promise<any[]> {
    return subscriptionRepository.getForClient(userId, clientId);
  }
}

export default Subscription;
