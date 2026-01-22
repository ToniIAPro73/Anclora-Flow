import { z } from "zod";

// Enums alineados con la base de datos
export const BillingFrequencyEnum = z.enum(["monthly", "quarterly", "yearly"]);
export const SubscriptionStatusEnum = z.enum([
  "trial",
  "active",
  "paused",
  "cancelled",
  "expired",
]);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD");

const subscriptionBaseSchema = z.object({
  userId: z.string().uuid(), // Inyectado típicamente por el controller/auth middleware
  clientId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),

  serviceName: z
    .string()
    .min(1, "El nombre del servicio es obligatorio")
    .max(255),
  provider: z.string().min(1, "El proveedor es obligatorio").max(255),
  description: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),

  amount: z.number().positive("El importe debe ser mayor que 0"),
  currency: z.string().length(3).default("EUR"),
  billingFrequency: BillingFrequencyEnum,

  // Lógica de Trial
  hasTrial: z.boolean().default(false),
  trialDays: z.number().int().positive().optional().nullable(),
  trialStartDate: dateString.optional().nullable(),
  trialEndDate: dateString.optional().nullable(),
  trialRequiresCard: z.boolean().default(false),

  // Fechas
  startDate: dateString,
  nextBillingDate: dateString.optional().nullable(),
  endDate: dateString.optional().nullable(),

  status: SubscriptionStatusEnum.default("active"),

  // Config
  autoRenew: z.boolean().default(true),
  cancellationUrl: z.string().url().optional().nullable(),
  loginUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Esquema Base para Creación
export const createSubscriptionSchema = subscriptionBaseSchema.superRefine(
  (data, ctx) => {
    // Validación Cruzada: Si tiene trial, trialDays y trialEndDate son obligatorios
    if (data.hasTrial) {
      if (!data.trialDays) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "trialDays es obligatorio si hasTrial es true",
          path: ["trialDays"],
        });
      }
      if (!data.trialEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "trialEndDate es obligatorio si hasTrial es true",
          path: ["trialEndDate"],
        });
      }
    }
  },
);

// Esquema para Actualización (Partial)
export const updateSubscriptionSchema = subscriptionBaseSchema
  .partial()
  .omit({ userId: true })
  .superRefine((data, ctx) => {
    if (data.hasTrial === true) {
      if (data.trialDays == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "trialDays es obligatorio si hasTrial es true",
          path: ["trialDays"],
        });
      }
      if (data.trialEndDate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "trialEndDate es obligatorio si hasTrial es true",
          path: ["trialEndDate"],
        });
      }
    }
  });

// Esquema para query params en GET (filtros)
export const querySubscriptionSchema = z.object({
  status: SubscriptionStatusEnum.optional(),
  category: z.string().max(100).optional(),
});

// Tipos inferidos
export type CreateSubscriptionDTO = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDTO = z.infer<typeof updateSubscriptionSchema>;
export type QuerySubscriptionDTO = z.infer<typeof querySubscriptionSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;
