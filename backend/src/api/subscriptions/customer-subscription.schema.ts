import { z } from "zod";

// Enums
export const BillingFrequencyEnum = z.enum(["monthly", "quarterly", "yearly"]);
export const CustomerSubscriptionStatusEnum = z.enum([
  "trial",
  "active",
  "past_due",
  "cancelled",
  "expired",
]);
export const PlanChangeTypeEnum = z.enum(["upgrade", "downgrade"]);

const customerSubscriptionBaseSchema = z.object({
  userId: z.string().uuid().optional(), // Inyectado
  clientId: z.string().uuid({ message: "El ID del cliente es obligatorio" }),

  // Info Plan
  planName: z.string().min(1, "Nombre del plan requerido").max(100),
  planCode: z.string().min(1, "Código del plan requerido").max(50),
  description: z.string().optional().nullable(),

  // Pricing
  amount: z.number().min(0, "El importe debe ser mayor o igual a 0"),
  currency: z.string().length(3).default("EUR"),
  billingFrequency: BillingFrequencyEnum,

  // Trial Logic
  hasTrial: z.boolean().default(false),
  trialDays: z.number().int().positive().optional().nullable(),
  trialStartDate: z.string().datetime().optional().nullable(),
  trialEndDate: z.string().datetime().optional().nullable(),

  // Fechas Clave
  startDate: z.string().datetime(),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  nextBillingDate: z.string().datetime().optional().nullable(),

  status: CustomerSubscriptionStatusEnum.default("active"),

  // Facturación Automática
  autoInvoice: z.boolean().default(true),
  autoSendInvoice: z.boolean().default(false),
  invoiceDay: z.number().int().min(1).max(28).default(1),

  // Descuentos
  discountPercentage: z.number().min(0).max(100).default(0),
  discountEndDate: z.string().datetime().optional().nullable(),

  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Esquema Base para Creación
export const createCustomerSubscriptionSchema = customerSubscriptionBaseSchema.superRefine(
  (data, ctx) => {
    if (data.hasTrial) {
      if (!data.trialDays || !data.trialStartDate || !data.trialEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Si tiene trial, debe especificar días, fecha inicio y fin",
          path: ["hasTrial"],
        });
      }
    }

    const start = new Date(data.currentPeriodStart);
    const end = new Date(data.currentPeriodEnd);
    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El fin del periodo debe ser posterior al inicio",
        path: ["currentPeriodEnd"],
      });
    }
  },
);

// Esquema para Actualización
export const updateCustomerSubscriptionSchema = customerSubscriptionBaseSchema
  .partial()
  .omit({ userId: true, clientId: true })
  .superRefine((data, ctx) => {
    if (data.hasTrial) {
      if (!data.trialDays || !data.trialStartDate || !data.trialEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Si tiene trial, debe especificar días, fecha inicio y fin",
          path: ["hasTrial"],
        });
      }
    }

    if (data.currentPeriodStart && data.currentPeriodEnd) {
      const start = new Date(data.currentPeriodStart);
      const end = new Date(data.currentPeriodEnd);
      if (start >= end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El fin del periodo debe ser posterior al inicio",
          path: ["currentPeriodEnd"],
        });
      }
    }
  });

// Esquema para Query Params
export const customerSubscriptionQuerySchema = z.object({
  status: CustomerSubscriptionStatusEnum.optional(),
  clientId: z.string().uuid().optional(),
  planCode: z.string().optional(),
});

// Tipos
export type CreateCustomerSubscriptionDTO = z.infer<
  typeof createCustomerSubscriptionSchema
>;
export type UpdateCustomerSubscriptionDTO = z.infer<
  typeof updateCustomerSubscriptionSchema
>;
export type CustomerSubscriptionQueryDTO = z.infer<
  typeof customerSubscriptionQuerySchema
>;
