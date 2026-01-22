import { query as defaultQuery } from "../../database/config.js";
import {
  CreateCustomerSubscriptionDTO,
  UpdateCustomerSubscriptionDTO,
  CustomerSubscriptionQueryDTO,
} from "./customer-subscription.schema.js";

type QueryFn = (text: string, params?: any[]) => Promise<{ rows: any[] }>;

export class CustomerSubscriptionService {
  private query: QueryFn;

  constructor(queryFn: QueryFn = defaultQuery) {
    this.query = queryFn;
  }

  /**
   * Crea una nueva suscripción de cliente
   */
  async create(data: CreateCustomerSubscriptionDTO) {
    // Nota: Aquí se asume que userId viene inyectado y validado

    const query = `
      INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description,
        amount, currency, billing_frequency,
        has_trial, trial_days, trial_start_date, trial_end_date,
        start_date, current_period_start, current_period_end, next_billing_date,
        status, auto_invoice, auto_send_invoice, invoice_day,
        discount_percentage, discount_end_date, payment_method, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *;
    `;

    const values = [
      data.userId,
      data.clientId,
      data.planName,
      data.planCode,
      data.description,
      data.amount,
      data.currency,
      data.billingFrequency,
      data.hasTrial,
      data.trialDays,
      data.trialStartDate,
      data.trialEndDate,
      data.startDate,
      data.currentPeriodStart,
      data.currentPeriodEnd,
      data.nextBillingDate,
      data.status,
      data.autoInvoice,
      data.autoSendInvoice,
      data.invoiceDay,
      data.discountPercentage,
      data.discountEndDate,
      data.paymentMethod,
      data.notes,
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Listar con filtros y paginación básica
   */
  async findAll(userId: string, filters: CustomerSubscriptionQueryDTO) {
    let query = `
      SELECT cs.*, c.name as client_name 
      FROM customer_subscriptions cs
      JOIN clients c ON cs.client_id = c.id
      WHERE cs.user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND cs.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.clientId) {
      query += ` AND cs.client_id = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex++;
    }

    query += ` ORDER BY cs.created_at DESC`;

    const result = await this.query(query, params);
    return result.rows;
  }

  async findById(id: string, userId: string) {
    const query = `
      SELECT cs.*, c.name as client_name 
      FROM customer_subscriptions cs
      JOIN clients c ON cs.client_id = c.id
      WHERE cs.id = $1 AND cs.user_id = $2
    `;
    const result = await this.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  /**
   * Conversión de Trial a Activo
   * Regla RN-CSUB-12
   */
  async convertTrial(id: string, userId: string) {
    const query = `
      UPDATE customer_subscriptions
      SET status = 'active',
          trial_converted = true,
          trial_conversion_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND status = 'trial'
      RETURNING *;
    `;
    const result = await this.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  /**
   * Cancelación de Suscripción
   * Regla RN-CSUB-11: status='cancelled', next_billing_date=NULL
   */
  async cancel(id: string, userId: string) {
    const query = `
      UPDATE customer_subscriptions
      SET status = 'cancelled',
          cancellation_date = CURRENT_DATE,
          next_billing_date = NULL,
          auto_invoice = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await this.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  /**
   * Obtener Resumen de Métricas (Vistas Materializadas)
   */
  async getSummary(userId: string) {
    // Consultar vistas SQL creadas en Task-02
    const mrrQuery = `SELECT * FROM mrr_summary WHERE user_id = $1`;
    const arrQuery = `SELECT * FROM arr_summary WHERE user_id = $1`;
    const trialsQuery = `SELECT COUNT(*) as count FROM expiring_customer_trials WHERE user_id = $1 AND urgency_level IN ('critical', 'warning')`;

    const [mrrRes, arrRes, trialsRes] = await Promise.all([
      this.query(mrrQuery, [userId]),
      this.query(arrQuery, [userId]),
      this.query(trialsQuery, [userId]),
    ]);

    return {
      mrrBreakdown: mrrRes.rows,
      totalArr: arrRes.rows[0]?.arr || 0,
      activeSubscriptions: arrRes.rows[0]?.total_active_subscriptions || 0,
      expiringTrialsCount: parseInt(trialsRes.rows[0]?.count || "0"),
    };
  }
}
