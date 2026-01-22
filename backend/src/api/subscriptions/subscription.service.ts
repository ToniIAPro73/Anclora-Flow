import { query as defaultQuery } from "../../database/config.js";
import {
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
} from "./subscription.schema";

type QueryFn = (text: string, params?: any[]) => Promise<{ rows: any[] }>;

export class SubscriptionService {
  private query: QueryFn;

  constructor(queryFn: QueryFn = defaultQuery) {
    this.query = queryFn;
  }

  /**
   * Crea una nueva suscripción de gasto validando reglas de negocio
   */
  async create(data: CreateSubscriptionDTO) {
    // La validación Zod ocurre antes, en el controller o middleware.
    // Aquí ejecutamos la inserción.

    const query = `
      INSERT INTO subscriptions (
        user_id, client_id, project_id, service_name, provider, description, category,
        amount, currency, billing_frequency, has_trial, trial_days, trial_start_date,
        trial_end_date, trial_requires_card, start_date, next_billing_date, end_date, status,
        auto_renew, cancellation_url, login_url, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *;
    `;

    const values = [
      data.userId,
      data.clientId,
      data.projectId,
      data.serviceName,
      data.provider,
      data.description,
      data.category,
      data.amount,
      data.currency,
      data.billingFrequency,
      data.hasTrial,
      data.trialDays,
      data.trialStartDate,
      data.trialEndDate,
      data.trialRequiresCard,
      data.startDate,
      data.nextBillingDate,
      data.endDate,
      data.status,
      data.autoRenew,
      data.cancellationUrl,
      data.loginUrl,
      data.notes,
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene todas las suscripciones de un usuario con filtros opcionales
   */
  async findAll(
    userId: string,
    filters: { status?: string; category?: string } = {},
  ) {
    let query = `SELECT * FROM subscriptions WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    query += ` ORDER BY next_billing_date ASC`;

    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Busca por ID asegurando pertenencia al usuario (Seguridad IDOR)
   */
  async findById(id: string, userId: string) {
    const query = `SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2`;
    const result = await this.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  /**
   * Actualiza una suscripción
   */
  async update(id: string, userId: string, data: UpdateSubscriptionDTO) {
    // Construcción dinámica de query para UPDATE
    const updates: string[] = [];
    const values: any[] = [id, userId];
    let paramIndex = 3;

    // Mapeo manual de campos permitidos para evitar inyección de campos no deseados
    // (Simplificado para el ejemplo, idealmente usar un query builder)
    const fields = Object.keys(data);

    if (fields.length === 0) return null;

    for (const field of fields) {
      // Convertir camelCase a snake_case simple para SQL
      const dbField = field.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );
      updates.push(`${dbField} = $${paramIndex}`);
      values.push((data as any)[field]);
      paramIndex++;
    }

    const query = `
      UPDATE subscriptions 
      SET ${updates.join(", ")}
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;

    const result = await this.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Soft Delete: Marca como cancelada en lugar de borrar
   */
  async cancel(id: string, userId: string) {
    const query = `
      UPDATE subscriptions 
      SET status = 'cancelled', auto_renew = false
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await this.query(query, [id, userId]);
    return result.rows[0] || null;
  }
}
