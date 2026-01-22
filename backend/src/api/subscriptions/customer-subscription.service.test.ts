/// <reference types="node" />
import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { CustomerSubscriptionService } from "./customer-subscription.service.js";
import { createCustomerSubscriptionSchema } from "./customer-subscription.schema.js";

describe("CustomerSubscriptionService", () => {
  describe("Schema Validation", () => {
    it("debe validar un plan correcto", () => {
      const valid = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        clientId: "123e4567-e89b-12d3-a456-426614174001",
        planName: "Pro Plan",
        planCode: "PRO-01",
        amount: 50,
        billingFrequency: "monthly",
        startDate: "2026-01-01T00:00:00Z",
        currentPeriodStart: "2026-01-01T00:00:00Z",
        currentPeriodEnd: "2026-02-01T00:00:00Z",
        status: "active",
      };
      const res = createCustomerSubscriptionSchema.safeParse(valid);
      assert.ok(res.success);
    });

    it("debe fallar si start_date > end_date", () => {
      const invalid = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        clientId: "123e4567-e89b-12d3-a456-426614174001",
        planName: "Pro Plan",
        planCode: "PRO-01",
        amount: 50,
        billingFrequency: "monthly",
        startDate: "2026-01-01T00:00:00Z",
        currentPeriodStart: "2026-01-01T00:00:00Z",
        // Error lógico: fin antes que inicio
        currentPeriodEnd: "2025-01-01T00:00:00Z",
      };
      const res = createCustomerSubscriptionSchema.safeParse(invalid);
      assert.strictEqual(res.success, false);
      if (!res.success) {
        assert.ok(
          res.error.issues.some((i) => i.path.includes("currentPeriodEnd")),
        );
      }
    });
  });

  describe("Trial Conversion Logic", () => {
    it("debe generar query correcta para convertir trial", async () => {
      const mockQuery = mock.fn(async () => ({
        rows: [{ id: "1", status: "active" }],
      }));
      const service = new CustomerSubscriptionService(mockQuery as any);

      await service.convertTrial("sub-123", "user-456");

      const calls = mockQuery.mock.calls as Array<{ arguments?: unknown[] }>;
      const sql = String(calls[0]?.arguments?.[0] ?? "");

      // Verificar que el SQL actualiza los campos requeridos por RN-CSUB-12
      assert.ok(sql.includes("SET status = 'active'"));
      assert.ok(sql.includes("trial_converted = true"));
      assert.ok(sql.includes("trial_conversion_date = CURRENT_DATE"));
    });
  });
});
