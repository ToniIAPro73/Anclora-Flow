import type { Request, RequestHandler, Response } from "express";
import { CustomerSubscriptionService } from "./customer-subscription.service.js";
import {
  createCustomerSubscriptionSchema,
  customerSubscriptionQuerySchema,
} from "./customer-subscription.schema.js";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class CustomerSubscriptionController {
  private service: CustomerSubscriptionService;

  constructor() {
    this.service = new CustomerSubscriptionService();
  }

  /**
   * GET /api/customer-subscriptions
   */
  list: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const queryValidation = customerSubscriptionQuerySchema.safeParse(
        req.query,
      );
      if (!queryValidation.success) {
        return res.status(400).json({
          error: "Invalid query params",
          details: queryValidation.error.format(),
        });
      }

      const subscriptions = await this.service.findAll(
        userId,
        queryValidation.data,
      );
      return res.json({ subscriptions, count: subscriptions.length });
    } catch (error) {
      console.error("Error listing customer subscriptions:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * POST /api/customer-subscriptions
   */
  create: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = createCustomerSubscriptionSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validation.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: validation.error.format(),
        });
      }

      const subscription = await this.service.create(validation.data as any);
      return res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating customer subscription:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * GET /api/customer-subscriptions/summary
   */
  getSummary: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const summary = await this.service.getSummary(userId);
      return res.json(summary);
    } catch (error) {
      console.error("Error fetching customer subscription summary:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * POST /api/customer-subscriptions/:id/convert
   */
  convertTrial: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const { id } = req.params;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      if (Array.isArray(id)) {
        return res.status(400).json({ error: "Invalid subscription id" });
      }

      const converted = await this.service.convertTrial(id, userId);
      if (!converted) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      return res.json(converted);
    } catch (error) {
      console.error("Error converting trial:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * POST /api/customer-subscriptions/:id/cancel
   */
  cancel: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const { id } = req.params;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      if (Array.isArray(id)) {
        return res.status(400).json({ error: "Invalid subscription id" });
      }

      const cancelled = await this.service.cancel(id, userId);
      if (!cancelled) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      return res.json(cancelled);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
