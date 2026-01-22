import { Router } from "express";
import { CustomerSubscriptionController } from "./customer-subscription.controller.js";

// Middleware de autenticación (Placeholder - igual que en task-04)
const authenticate = (req: any, res: any, next: any) => {
  if (!req.headers.authorization) {
    if (process.env.NODE_ENV === "development") {
      req.user = { id: "123e4567-e89b-12d3-a456-426614174000" };
      return next();
    }
    return res.status(401).json({ error: "No token provided" });
  }
  next();
};

const router = Router();
const controller = new CustomerSubscriptionController();

router.use(authenticate);

// Rutas Generales
router.get("/", controller.list);
router.post("/", controller.create);

// Rutas Especiales (KPIs y Operaciones)
// Nota: /summary debe ir ANTES de /:id para evitar conflicto de rutas
router.get("/summary", controller.getSummary);

// Operaciones sobre recursos específicos
router.post("/:id/convert", controller.convertTrial);
router.post("/:id/cancel", controller.cancel);

export default router;
