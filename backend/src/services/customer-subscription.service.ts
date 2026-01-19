import { customerSubscriptionRepository } from '../repositories/customer-subscription.repository.js';
import {
  ICustomerSubscription,
  ICustomerSubscriptionCreate,
  ICustomerSubscriptionUpdate,
  ICustomerSubscriptionMRR,
  ICustomerSubscriptionARR
} from '../types/customer-subs

cription.js';

export class CustomerSubscriptionService {
  async findById(id: string, userId: string): Promise<ICustomerSubscription | null> {
    return customerSubscriptionRepository.findById(id, userId);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<ICustomerSubscription[]> {
    return customerSubscriptionRepository.findAllByUser(userId, filters);
  }

  async create(userId: string, payload: ICustomerSubscriptionCreate): Promise<ICustomerSubscription> {
    return customerSubscriptionRepository.create(userId, payload);
  }

  async update(id: string, userId: string, updates: ICustomerSubscriptionUpdate): Promise<ICustomerSubscription | null> {
    return customerSubscriptionRepository.update(id, userId, updates);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    return customerSubscriptionRepository.delete(id, userId);
  }

  async getMRR(userId: string): Promise<ICustomerSubscriptionMRR | null> {
    return customerSubscriptionRepository.getMRR(userId);
  }

  async getARR(userId: string): Promise<ICustomerSubscriptionARR | null> {
    return customerSubscriptionRepository.getARR(userId);
  }

  async getExpiringTrials(userId: string, days: number = 7): Promise<ICustomerSubscription[]> {
    return customerSubscriptionRepository.getExpiringTrials(userId, days);
  }

  async convertTrialToActive(id: string, userId: string): Promise<ICustomerSubscription | null> {
    return customerSubscriptionRepository.convertTrialToActive(id, userId);
  }

  async cancel(id: string, userId: string, reason?: string): Promise<ICustomerSubscription | null> {
    // TODO: guardar el reason en notas o en nueva columna cancellation_reason
    return customerSubscriptionRepository.cancel(id, userId);
  }

  async upgradePlan(id: string, userId: string, newPlanCode: string, newAmount: number): Promise<ICustomerSubscription | null> {
    return customerSubscriptionRepository.upgradePlan(id, userId, newPlanCode, newAmount);
  }
}

export const customerSubscriptionService = new CustomerSubscriptionService();
