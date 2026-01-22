-- ==============================================================================
-- MIGRATION: 005_create_subscription_views
-- DESCRIPCIÓN: Vistas SQL para cálculo de KPIs (MRR, ARR, Churn) y operativas
-- REFERENCIA: EF-SUSCRIPCIONES-001 (Sección 6)
-- DEPENDENCIAS: Requiere tablas creadas en 004_create_subscriptions_module
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. VISTA: mrr_summary
-- PROPÓSITO: Calcular el Monthly Recurring Revenue por plan
-- LÓGICA: Normaliza frecuencias trimestrales/anuales a base mensual
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW mrr_summary AS
SELECT 
    user_id,
    plan_name,
    COUNT(*) AS active_subscriptions,
    SUM(CASE 
        WHEN billing_frequency = 'monthly' THEN amount
        WHEN billing_frequency = 'quarterly' THEN amount / 3
        WHEN billing_frequency = 'yearly' THEN amount / 12
        ELSE 0
    END) AS mrr,
    AVG(amount) AS avg_subscription_value
FROM customer_subscriptions
WHERE status IN ('trial', 'active')
GROUP BY user_id, plan_name
ORDER BY mrr DESC;

COMMENT ON VIEW mrr_summary IS 'Monthly Recurring Revenue (MRR) desglosado por plan y usuario';


-- ------------------------------------------------------------------------------
-- 2. VISTA: arr_summary
-- PROPÓSITO: Calcular el Annual Recurring Revenue total por usuario
-- LÓGICA: Proyección anual (MRR x 12)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW arr_summary AS
SELECT 
    user_id,
    SUM(CASE 
        WHEN billing_frequency = 'monthly' THEN amount * 12
        WHEN billing_frequency = 'quarterly' THEN amount * 4
        WHEN billing_frequency = 'yearly' THEN amount
        ELSE 0
    END) AS arr,
    COUNT(*) AS total_active_subscriptions
FROM customer_subscriptions
WHERE status IN ('trial', 'active')
GROUP BY user_id;

COMMENT ON VIEW arr_summary IS 'Annual Recurring Revenue (ARR) total por usuario';


-- ------------------------------------------------------------------------------
-- 3. VISTA: upcoming_invoicing
-- PROPÓSITO: Identificar suscripciones que deben facturarse en los próximos 7 días
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW upcoming_invoicing AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name AS client_name,
    cs.plan_name,
    cs.amount,
    cs.next_billing_date,
    (cs.next_billing_date - CURRENT_DATE) AS days_until_billing,
    cs.auto_invoice,
    cs.auto_send_invoice
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.status = 'active'
  AND cs.next_billing_date <= (CURRENT_DATE + INTERVAL '7 days')
  AND cs.next_billing_date >= CURRENT_DATE
ORDER BY cs.next_billing_date ASC;

COMMENT ON VIEW upcoming_invoicing IS 'Suscripciones activas pendientes de facturación en la próxima semana';


-- ------------------------------------------------------------------------------
-- 4. VISTA: expiring_customer_trials
-- PROPÓSITO: Monitorizar trials que están por vencer para acciones de conversión
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW expiring_customer_trials AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name AS client_name,
    c.email AS client_email,
    cs.plan_name,
    cs.trial_start_date,
    cs.trial_end_date,
    cs.trial_days,
    cs.amount AS price_after_trial,
    (cs.trial_end_date - CURRENT_DATE) AS days_until_trial_ends,
    CASE 
        WHEN cs.trial_end_date < CURRENT_DATE THEN 'expired'
        WHEN cs.trial_end_date <= (CURRENT_DATE + INTERVAL '2 days') THEN 'critical'
        WHEN cs.trial_end_date <= (CURRENT_DATE + INTERVAL '7 days') THEN 'warning'
        ELSE 'active'
    END AS urgency_level
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.status = 'trial'
  AND cs.has_trial = true
  AND cs.trial_converted = false
ORDER BY cs.trial_end_date ASC;

COMMENT ON VIEW expiring_customer_trials IS 'Estado de urgencia para conversión de trials de clientes';


-- ------------------------------------------------------------------------------
-- 5. VISTA: churn_metrics
-- PROPÓSITO: Análisis de cancelaciones históricas (últimos 12 meses)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW churn_metrics AS
SELECT 
    user_id,
    DATE_TRUNC('month', cancellation_date) AS month,
    COUNT(*) AS cancelled_subscriptions,
    SUM(amount) AS lost_mrr
FROM customer_subscriptions
WHERE status = 'cancelled'
  AND cancellation_date IS NOT NULL
  AND cancellation_date >= (CURRENT_DATE - INTERVAL '12 months')
GROUP BY user_id, DATE_TRUNC('month', cancellation_date)
ORDER BY month DESC;

COMMENT ON VIEW churn_metrics IS 'Métricas mensuales de cancelación (Churn) y pérdida de MRR';


-- ------------------------------------------------------------------------------
-- 6. VISTA: plan_changes
-- PROPÓSITO: Auditoría de upgrades y downgrades recientes (90 días)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW plan_changes AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name AS client_name,
    cs.previous_plan_code,
    cs.plan_code AS current_plan_code,
    cs.plan_change_type,
    cs.plan_changed_at,
    cs.amount AS current_amount
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.plan_changed_at IS NOT NULL
  AND cs.plan_changed_at >= (CURRENT_DATE - INTERVAL '90 days')
ORDER BY cs.plan_changed_at DESC;

COMMENT ON VIEW plan_changes IS 'Historial reciente de cambios de plan (Upgrades/Downgrades)';


-- ------------------------------------------------------------------------------
-- 7. VISTA: at_risk_subscriptions
-- PROPÓSITO: Detección temprana de impagos o problemas de cobro
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW at_risk_subscriptions AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name AS client_name,
    c.email AS client_email,
    cs.plan_name,
    cs.amount,
    cs.failed_payments_count,
    cs.status,
    cs.next_billing_date
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.failed_payments_count > 0
   OR cs.status = 'past_due'
ORDER BY cs.failed_payments_count DESC, cs.next_billing_date ASC;

COMMENT ON VIEW at_risk_subscriptions IS 'Suscripciones en riesgo por fallos de pago o morosidad';

COMMIT;