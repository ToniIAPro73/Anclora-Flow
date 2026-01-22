import type { Request, RequestHandler, Response } from "express";
import { SubscriptionService } from "./subscription.service.js";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  querySubscriptionSchema,
} from "./subscription.schema.js";

// Extendemos Request para incluir el usuario autenticado (ajustar según tu middleware de auth real)
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class SubscriptionController {
  private service: SubscriptionService;

  constructor() {
    this.service = new SubscriptionService();
  }

  /**
   * GET /api/subscriptions
   * Lista suscripciones con filtros opcionales
   */
  list: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Validar query params
      const queryValidation = querySubscriptionSchema.safeParse(req.query);
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
      res.json(subscriptions);
    } catch (error) {
      console.error("Error listing subscriptions:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * POST /api/subscriptions
   * Crea una nueva suscripción
   */
  create: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Validar body
      const validation = createSubscriptionSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validation.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: validation.error.format(),
        });
      }

      const subscription = await this.service.create(validation.data as any); // Type assertion seguro tras validación
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * PUT /api/subscriptions/:id
   * Actualiza una suscripción existente
   */
  update: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const { id } = req.params;
      if (Array.isArray(id)) {
        return res.status(400).json({ error: "Invalid subscription id" });
      }
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Validar body parcial
      const validation = updateSubscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation Error",
          details: validation.error.format(),
        });
      }

      const updated = await this.service.update(id, userId, validation.data);

      if (!updated) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  /**
   * DELETE /api/subscriptions/:id
   * Realiza un Soft Delete (cambia estado a 'cancelled')
   */
  cancel: RequestHandler = async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const { id } = req.params;
      if (Array.isArray(id)) {
        return res.status(400).json({ error: "Invalid subscription id" });
      }
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const cancelled = await this.service.cancel(id, userId);

      if (!cancelled) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      res.json({
        message: "Subscription cancelled successfully",
        subscription: cancelled,
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
