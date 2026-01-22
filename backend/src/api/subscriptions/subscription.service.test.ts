import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { SubscriptionService } from "./subscription.service";
import { createSubscriptionSchema } from "./subscription.schema.js";

const getCallArgs = (mockQuery: any, index = 0) =>
  (mockQuery.mock.calls[index]?.arguments ?? []) as any[];

describe("SubscriptionService", () => {
  describe("Validación Zod (Schema)", () => {
    it("debe validar una suscripción correcta", () => {
      const validData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        serviceName: "Netflix",
        provider: "Netflix Inc",
        amount: 15.99,
        billingFrequency: "monthly",
        startDate: "2026-01-01",
        hasTrial: false,
      };

      const result = createSubscriptionSchema.safeParse(validData);
      assert.strictEqual(result.success, true);
    });

    it("debe fallar si hay trial pero faltan fechas", () => {
      const invalidData = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        serviceName: "Netflix",
        provider: "Netflix Inc",
        amount: 15.99,
        billingFrequency: "monthly",
        startDate: "2026-01-01",
        hasTrial: true,
        // trialDays y trialEndDate faltantes
      };

      const result = createSubscriptionSchema.safeParse(invalidData);
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((i) => i.path.includes("trialDays")),
        );
      }
    });
  });

  describe("Lógica de servicio (mock DB)", () => {
    it("create debe insertar con user_id y retornar la fila", async () => {
      const mockQuery = mock.fn(async () => ({ rows: [{ id: "sub-1" }] }));
      const service = new SubscriptionService(mockQuery as any);

      const payload = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        clientId: null,
        projectId: null,
        serviceName: "Netflix",
        provider: "Netflix Inc",
        description: null,
        category: null,
        amount: 15.99,
        currency: "EUR",
        billingFrequency: "monthly",
        hasTrial: false,
        trialDays: null,
        trialStartDate: null,
        trialEndDate: null,
        trialRequiresCard: false,
        startDate: "2026-01-01",
        nextBillingDate: null,
        endDate: null,
        status: "active",
        autoRenew: true,
        cancellationUrl: null,
        loginUrl: null,
        notes: null,
      };

      const result = await service.create(payload as any);

      assert.strictEqual(result?.id, "sub-1");
      assert.strictEqual(mockQuery.mock.calls.length, 1);
      const args = getCallArgs(mockQuery);
      assert.match(String(args[0]), /INSERT INTO subscriptions/);
    });

    it("findById debe aplicar IDOR con user_id", async () => {
      const mockQuery = mock.fn(async () => ({ rows: [{ id: "sub-2" }] }));
      const service = new SubscriptionService(mockQuery as any);

      await service.findById("sub-2", "user-1");

      assert.strictEqual(mockQuery.mock.calls.length, 1);
      const args = getCallArgs(mockQuery);
      assert.match(String(args[0]), /user_id = \$2/);
      assert.deepStrictEqual(args[1], ["sub-2", "user-1"]);
    });

    it("update convierte camelCase a snake_case", async () => {
      const mockQuery = mock.fn(async () => ({ rows: [{ id: "sub-3" }] }));
      const service = new SubscriptionService(mockQuery as any);

      await service.update("sub-3", "user-1", { serviceName: "Spotify" });

      assert.strictEqual(mockQuery.mock.calls.length, 1);
      const args = getCallArgs(mockQuery);
      assert.match(String(args[0]), /service_name/);
    });

    it("update sin campos debe retornar null sin consultar DB", async () => {
      const mockQuery = mock.fn(async () => ({ rows: [] }));
      const service = new SubscriptionService(mockQuery as any);

      const result = await service.update("sub-4", "user-1", {});

      assert.strictEqual(result, null);
      assert.strictEqual(mockQuery.mock.calls.length, 0);
    });

    it("findAll aplica filtros de status y category", async () => {
      const mockQuery = mock.fn(async () => ({ rows: [] }));
      const service = new SubscriptionService(mockQuery as any);

      await service.findAll("user-1", { status: "active", category: "streaming" });

      assert.strictEqual(mockQuery.mock.calls.length, 1);
      const args = getCallArgs(mockQuery);
      const sql = String(args[0]);
      assert.match(sql, /status = \$2/);
      assert.match(sql, /category = \$3/);
      assert.deepStrictEqual(args[1], [
        "user-1",
        "active",
        "streaming",
      ]);
    });

    it("cancel marca status y auto_renew con IDOR", async () => {
      const mockQuery = mock.fn(async () => ({ rows: [{ id: "sub-9" }] }));
      const service = new SubscriptionService(mockQuery as any);

      await service.cancel("sub-9", "user-1");

      assert.strictEqual(mockQuery.mock.calls.length, 1);
      const args = getCallArgs(mockQuery);
      const sql = String(args[0]);
      assert.match(sql, /status = 'cancelled'/);
      assert.match(sql, /auto_renew = false/);
      assert.match(sql, /user_id = \$2/);
      assert.deepStrictEqual(args[1], [
        "sub-9",
        "user-1",
      ]);
    });
  });
});
