import { Router } from "express";
import { SubscriptionController } from "./subscription.controller.js";

// Asumimos que existe un middleware de autenticación global o compartido
// Si no existe, deberás crear uno en backend/src/middleware/auth.ts
// import { authenticate } from '../../../middleware/auth';

// Placeholder temporal para simular auth si no tienes el middleware real listo
const authenticate = (req: any, res: any, next: any) => {
  // TODO: Reemplazar con middleware real de JWT
  if (!req.headers.authorization) {
    // Para desarrollo rápido, si no hay header, inyectamos un usuario mock
    // En producción esto DEBE fallar
    if (process.env.NODE_ENV === "development") {
      req.user = { id: "123e4567-e89b-12d3-a456-426614174000" }; // UUID válido mock
      return next();
    }
    return res.status(401).json({ error: "No token provided" });
  }
  // Lógica real de verificación de token iría aquí
  next();
};

const router = Router();
const controller = new SubscriptionController();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Definición de endpoints
router.get("/", controller.list);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.cancel);

export default router;
