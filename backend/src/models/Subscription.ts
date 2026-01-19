import { ISubscription, ISubscriptionCreate, ISubscriptionUpdate, ISubscriptionSummary } from '../types/subscription.js';
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
}

export default Subscription;
